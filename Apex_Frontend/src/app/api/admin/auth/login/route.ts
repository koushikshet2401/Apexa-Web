import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken, setSessionCookie } from '@/lib/auth'
import { logAdminActivity } from '@/lib/activityLog'
import { APPROVED_BASELINE_ADMIN_EMAIL, APPROVED_BASELINE_ADMIN_ID, getAdminSessionVersion } from '@/lib/rbac'

// In-memory rate limiting: max 5 attempts per IP per 15 minutes
interface RateLimitRecord {
  count: number
  resetAt: number
}

const loginAttempts = new Map<string, RateLimitRecord>()
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false
  }

  record.count += 1
  return true
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1')

  try {
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Resilient DB query: handles both Phase 3 schema (with RBAC/isActive) and baseline schema
    let user: any = null
    let hasPhase3Columns = false

    try {
      user = await db.adminUser.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
          isActive: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      module: true,
                      action: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      hasPhase3Columns = true
    } catch (err: any) {
      if (err?.code === 'P2022' || err?.code === 'P2021') {
        // Fallback for baseline database prior to Phase 3 migration deployment
        user = await db.adminUser.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            name: true,
          },
        })
        hasPhase3Columns = false
      } else {
        throw err
      }
    }

    // Generic error: never reveal whether account exists or password was incorrect
    if (!user) {
      logAdminActivity({
        adminEmail: normalizedEmail,
        action: 'ADMIN_LOGIN_FAILED',
        entityType: 'AdminUser',
        entityId: 'unknown',
        summary: `Failed login attempt for unknown user: ${normalizedEmail}`,
        ipAddress: ip,
      }).catch(() => {})

      return NextResponse.json(
        { ok: false, error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Check account status if Phase 3 isActive column is present
    if (hasPhase3Columns && user.isActive === false) {
      logAdminActivity({
        adminId: user.id,
        adminEmail: user.email,
        action: 'ADMIN_LOGIN_DEACTIVATED',
        entityType: 'AdminUser',
        entityId: user.id,
        summary: `Blocked login attempt for deactivated user: ${user.email}`,
        ipAddress: ip,
      }).catch(() => {})

      return NextResponse.json(
        { ok: false, error: 'Account is deactivated. Please contact an administrator.' },
        { status: 403 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      logAdminActivity({
        adminId: user.id,
        adminEmail: user.email,
        action: 'ADMIN_LOGIN_FAILED',
        entityType: 'AdminUser',
        entityId: user.id,
        summary: `Failed login attempt: incorrect password for user ${user.email}`,
        ipAddress: ip,
      }).catch(() => {})

      return NextResponse.json(
        { ok: false, error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Success - reset attempts for this IP
    loginAttempts.delete(ip)

    // Update lastLoginAt if column is present in database
    if (hasPhase3Columns) {
      try {
        await db.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
      } catch (updateErr) {
        console.warn('[AUTH] Could not update lastLoginAt:', updateErr)
      }
    }

    // Extract permissions list
    let roleName = user.role?.name
    const permissions: string[] = []
    if (user.role?.permissions && Array.isArray(user.role.permissions)) {
      for (const rp of user.role.permissions) {
        if (rp.permission?.module && rp.permission?.action) {
          permissions.push(`${rp.permission.module}:${rp.permission.action}`)
        }
      }
    }

    if (!roleName) {
      // TEMPORARY BASELINE COMPATIBILITY: Restrict fallback SUPER_ADMIN strictly to approved primary administrator
      if (
        user.id === APPROVED_BASELINE_ADMIN_ID &&
        normalizedEmail === APPROVED_BASELINE_ADMIN_EMAIL.toLowerCase()
      ) {
        roleName = 'SUPER_ADMIN'
      } else {
        roleName = 'RESTRICTED_ADMIN'
      }
    }

    const sessionVersion = getAdminSessionVersion(user.id)
    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: roleName,
      permissions,
      sessionVersion,
    })

    logAdminActivity({
      adminId: user.id,
      adminEmail: user.email,
      action: 'ADMIN_LOGIN_SUCCESS',
      entityType: 'AdminUser',
      entityId: user.id,
      summary: `Successful admin login: ${user.email} (${roleName})`,
      ipAddress: ip,
    }).catch(() => {})

    const response = NextResponse.json({
      ok: true,
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleName,
      },
    })
    setSessionCookie(response, token)

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
