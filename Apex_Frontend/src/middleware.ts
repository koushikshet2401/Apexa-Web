import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose/jwt/verify'

const SESSION_COOKIE_NAME = 'apex_admin_session'

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'apex-default-jwt-secret-fallback-minimum-32-chars-long!'
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page without authentication
  if (pathname === '/admin/login') {
    // If user is already authenticated and visits /admin/login, redirect to /admin
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (token) {
      try {
        await jwtVerify(token, getSecretKey())
        return NextResponse.redirect(new URL('/admin', request.url))
      } catch {
        // Invalid or expired token, proceed to login page
      }
    }
    return NextResponse.next()
  }

  // Check admin session for all other /admin routes
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, getSecretKey())
    return NextResponse.next()
  } catch {
    const loginUrl = new URL('/admin/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    // Clear invalid cookie
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
