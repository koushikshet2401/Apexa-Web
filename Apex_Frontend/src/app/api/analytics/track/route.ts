import { NextRequest, NextResponse } from 'next/server'
import { recordAnalyticsEvent, AnalyticsEventType } from '@/lib/analytics'
import { SESSION_COOKIE_NAME, verifyToken } from '@/lib/auth'

const VALID_EVENT_TYPES = new Set<AnalyticsEventType>([
  'PAGE_VIEW',
  'PROJECT_VIEW',
  'COUNTRY_VIEW',
  'ENQUIRY_SUBMITTED',
  'PROJECT_ADDED',
  'DEAL_CLOSED',
])

/**
 * POST /api/analytics/track
 * Public endpoint for anonymous website visitor telemetry.
 * Automatically excludes administrative traffic, prevents duplicate events,
 * and maintains non-PII compliance using salt-hashed visitor identifiers.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Admin Exclusion Check via Cookie or Authorization header
    const adminCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const authHeader = request.headers.get('authorization')
    let isAdmin = false

    if (adminCookie) {
      const session = await verifyToken(adminCookie)
      if (session) isAdmin = true
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const session = await verifyToken(token)
      if (session) isAdmin = true
    }

    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // Empty or invalid JSON
      body = {}
    }

    const path = typeof body.path === 'string' ? body.path : undefined

    // Exclude admin paths
    if (isAdmin || (path && (path.startsWith('/admin') || path.startsWith('/api/admin')))) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: 'ADMIN_TRAFFIC_EXCLUDED',
      })
    }

    // 2. Validate Event Type
    const rawEventType = body.eventType || 'PAGE_VIEW'
    const eventType: AnalyticsEventType = VALID_EVENT_TYPES.has(rawEventType)
      ? rawEventType
      : 'PAGE_VIEW'

    // 3. Extract Client Network Identifiers for Non-PII Hashing
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : request.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    // 4. Record Event
    const result = await recordAnalyticsEvent({
      eventType,
      path,
      entityType: body.entityType,
      entityId: body.entityId,
      country: body.country,
      ip,
      userAgent,
      isAdmin: false,
      idempotencyKey: body.idempotencyKey,
      metadata: body.metadata,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error tracking analytics event:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to record analytics event' },
      { status: 500 }
    )
  }
}
