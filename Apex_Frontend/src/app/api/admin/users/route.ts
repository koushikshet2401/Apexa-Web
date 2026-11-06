import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.USERS_READ)
  if (auth instanceof Response) return auth

  try {
    let users: any[] = []
    try {
      users = await db.adminUser.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          lastLoginAt: true,
          roleId: true,
          role: {
            select: { id: true, name: true, description: true },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (err: any) {
      if (err?.code === 'P2022' || err?.code === 'P2021') {
        // Fallback for baseline database
        users = await db.adminUser.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        })
        // Augment with baseline defaults
        users = users.map((u) => ({
          ...u,
          isActive: true,
          role: { id: 'baseline', name: 'SUPER_ADMIN', description: 'System Administrator' },
        }))
      } else {
        throw err
      }
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error listing admin users:', error)
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.USERS_CREATE)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const { email, password, name, roleId } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password is required and must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existing = await db.adminUser.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: `An administrator with email "${normalizedEmail}" already exists.` },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    let newUser: any = null
    try {
      newUser = await db.adminUser.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: name ? name.trim() : null,
          roleId: roleId || null,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          roleId: true,
          createdAt: true,
        },
      })
    } catch (err: any) {
      if (err?.code === 'P2022' || err?.code === 'P2021') {
        newUser = await db.adminUser.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            name: name ? name.trim() : null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        })
      } else {
        throw err
      }
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1')

    logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'ADMIN_CREATED',
      entityType: 'AdminUser',
      entityId: newUser.id,
      summary: `Created new admin account: ${newUser.email}`,
      ipAddress: ip,
    }).catch(() => {})

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
