import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie, getAdminFromRequest, SESSION_COOKIE_NAME } from '@/lib/auth'
import { logAdminActivity } from '@/lib/activityLog'
import { revokeSessionToken, revokeAdminSessions, invalidateAdminCache } from '@/lib/rbac'

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  let allDevices = false
  try {
    const body = await request.json()
    if (body?.allDevices) allDevices = true
  } catch {}

  if (token) {
    revokeSessionToken(token)
  }

  if (admin) {
    if (allDevices) {
      revokeAdminSessions(admin.id)
    } else {
      invalidateAdminCache(admin.id)
    }
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1')
    logAdminActivity({
      adminId: admin.id,
      adminEmail: admin.email,
      action: allDevices ? 'ADMIN_LOGOUT_ALL_DEVICES' : 'ADMIN_LOGOUT',
      entityType: 'AdminUser',
      entityId: admin.id,
      summary: allDevices ? `Admin signed out of all devices: ${admin.email}` : `Admin signed out: ${admin.email}`,
      ipAddress: ip,
    }).catch(() => {})
  }

  const response = NextResponse.json({ ok: true, message: 'Logged out successfully' })
  clearSessionCookie(response)
  return response
}
