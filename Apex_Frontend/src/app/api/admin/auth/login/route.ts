import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken, setSessionCookie } from '@/lib/auth'

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
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1')

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
        { ok: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.adminUser.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Success - reset attempts for this IP
    loginAttempts.delete(ip)

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    })

    const response = NextResponse.json({ ok: true })
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
