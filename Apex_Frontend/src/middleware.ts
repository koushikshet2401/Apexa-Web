import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE_NAME = 'apex_admin_session'

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production environment.')
    }
    return new TextEncoder().encode('apex-default-jwt-secret-fallback-minimum-32-chars-long!')
  }
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // -------------------------------------------------------------
  // 1. API ADMIN ROUTES (/api/admin/*)
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/admin')) {
    // Whitelisted authentication endpoints
    if (
      pathname === '/api/admin/auth/login' ||
      pathname === '/api/admin/auth/logout'
    ) {
      return NextResponse.next()
    }

    let token = request.cookies.get(SESSION_COOKIE_NAME)?.value

    // Also support Authorization: Bearer header for REST API clients
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim()
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await jwtVerify(token, getSecretKey())
      return NextResponse.next()
    } catch {
      const response = NextResponse.json({ error: 'Unauthorized: Session expired or invalid' }, { status: 401 })
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }
  }

  // -------------------------------------------------------------
  // 2. ADMIN UI PAGE ROUTES (/admin/*)
  // -------------------------------------------------------------
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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
