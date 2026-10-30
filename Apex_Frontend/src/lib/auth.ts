import { SignJWT, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

export const SESSION_COOKIE_NAME = 'apex_admin_session'
export const DEFAULT_SESSION_MAX_AGE = 86400 // 24 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.warn('JWT_SECRET environment variable is missing, using fallback.')
    return new TextEncoder().encode('apex-default-jwt-secret-fallback-minimum-32-chars-long!')
  }
  return new TextEncoder().encode(secret)
}

function getMaxAge(): number {
  return parseInt(process.env.ADMIN_SESSION_MAX_AGE || `${DEFAULT_SESSION_MAX_AGE}`, 10)
}

export async function signToken(payload: Record<string, any>): Promise<string> {
  const maxAge = getMaxAge()
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(getSecretKey())
}

export async function verifyToken<T = { id: string; email: string }>(token: string): Promise<T | null> {
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

export async function getAdminFromRequest(request: Request): Promise<{ id: string; email: string } | null> {
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

  if (!token) return null
  return await verifyToken<{ id: string; email: string }>(token)
}
