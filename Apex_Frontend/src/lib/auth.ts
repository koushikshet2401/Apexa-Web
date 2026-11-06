import { SignJWT, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

export const SESSION_COOKIE_NAME = 'apex_admin_session'
export const DEFAULT_SESSION_MAX_AGE = 86400 // 24 hours

export interface AdminSession {
  id: string
  email: string
  name?: string | null
  role?: string | null
  permissions?: string[]
  [key: string]: any
}

export function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production environment.')
    }
    console.warn('JWT_SECRET environment variable is missing, using development fallback.')
    return new TextEncoder().encode('apex-default-jwt-secret-fallback-minimum-32-chars-long!')
  }
  if (secret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters long in production environment.')
  }
  return new TextEncoder().encode(secret)
}

function getMaxAge(): number {
  return parseInt(process.env.ADMIN_SESSION_MAX_AGE || `${DEFAULT_SESSION_MAX_AGE}`, 10)
}

export async function signToken(payload: AdminSession | Record<string, any>): Promise<string> {
  const maxAge = getMaxAge()
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(getSecretKey())
}

export async function verifyToken<T = AdminSession>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as unknown as T
  } catch {
    return null
  }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  const maxAge = getMaxAge()
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function getAdminFromRequest(request: Request): Promise<AdminSession | null> {
  let token: string | undefined

  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    token = (request as any).cookies.get(SESSION_COOKIE_NAME)?.value
  } else {
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`))
    if (match) {
      token = decodeURIComponent(match[1])
    }
  }

  // Fallback to Authorization: Bearer <token> header for REST API clients
  if (!token) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim()
    }
  }

  if (!token) return null
  return await verifyToken<AdminSession>(token)
}
