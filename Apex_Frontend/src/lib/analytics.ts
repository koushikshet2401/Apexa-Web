import crypto from 'crypto'
import { db } from './db'

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'PROJECT_VIEW'
  | 'COUNTRY_VIEW'
  | 'ENQUIRY_SUBMITTED'
  | 'PROJECT_ADDED'
  | 'DEAL_CLOSED'

export interface RecordEventOptions {
  eventType: AnalyticsEventType
  path?: string
  entityType?: 'Property' | 'Country' | 'Enquiry' | 'Deal'
  entityId?: string
  country?: string
  ip?: string
  userAgent?: string
  isAdmin?: boolean
  idempotencyKey?: string
  metadata?: any
}

// In-memory cache for recent idempotency keys to quickly reject duplicate requests
const recentEventKeys = new Set<string>()

/**
 * Generates an anonymous, non-reversible visitor hash without persisting IP addresses.
 * Uses a monthly rotating salt to ensure long-term privacy and compliance.
 */
export function generateVisitorHash(ip?: string, userAgent?: string): string {
  if (!ip && !userAgent) return 'anon_visitor'
  const monthSalt = new Date().toISOString().substring(0, 7)
  const secretSalt = process.env.JWT_SECRET || 'apex_analytics_salt_fallback'
  return crypto
    .createHmac('sha256', secretSalt)
    .update(`${ip || ''}:${userAgent || ''}:${monthSalt}`)
    .digest('hex')
    .substring(0, 16)
}

/**
 * Records an analytics event into PostgreSQL.
 * Strictly excludes administrative traffic, prevents duplicate events,
 * and maintains atomic daily aggregations in DailyAnalytics.
 */
export async function recordAnalyticsEvent(
  options: RecordEventOptions,
  prismaClient: any = db
): Promise<{ ok: boolean; ignored?: boolean; reason?: string; eventId?: string }> {
  // 1. Admin traffic exclusion
  if (options.isAdmin || (options.path && options.path.startsWith('/admin'))) {
    return { ok: true, ignored: true, reason: 'ADMIN_TRAFFIC_EXCLUDED' }
  }

  // 2. Idempotency deduplication check
  if (options.idempotencyKey) {
    if (recentEventKeys.has(options.idempotencyKey)) {
      return { ok: true, ignored: true, reason: 'DUPLICATE_EVENT_KEY' }
    }
    recentEventKeys.add(options.idempotencyKey)
    if (recentEventKeys.size > 10000) {
      recentEventKeys.clear()
    }
  }

  const visitorHash = generateVisitorHash(options.ip, options.userAgent)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  try {
    // 3. Insert detailed AnalyticsEvent
    const event = await prismaClient.analyticsEvent.create({
      data: {
        eventType: options.eventType,
        path: options.path ? options.path.substring(0, 255) : null,
        entityType: options.entityType || null,
        entityId: options.entityId || null,
        country: options.country || null,
        visitorHash,
        idempotencyKey: options.idempotencyKey || null,
        metadata: options.metadata || undefined,
      },
    })

    // 4. Atomically upsert DailyAnalytics aggregation record
    const increments: any = {
      totalVisits: { increment: 1 },
      qualifyingVisits: { increment: 1 },
    }

    if (options.eventType === 'PAGE_VIEW') {
      increments.pageViews = { increment: 1 }
    } else if (options.eventType === 'PROJECT_VIEW') {
      increments.projectViews = { increment: 1 }
      increments.pageViews = { increment: 1 }
    } else if (options.eventType === 'COUNTRY_VIEW') {
      increments.countryViews = { increment: 1 }
      increments.pageViews = { increment: 1 }
    } else if (options.eventType === 'ENQUIRY_SUBMITTED') {
      increments.enquiriesCount = { increment: 1 }
    }

    await prismaClient.dailyAnalytics.upsert({
      where: { date: today },
      update: increments,
      create: {
        date: today,
        totalVisits: 1,
        qualifyingVisits: 1,
        pageViews: options.eventType === 'PAGE_VIEW' || options.eventType === 'PROJECT_VIEW' || options.eventType === 'COUNTRY_VIEW' ? 1 : 0,
        projectViews: options.eventType === 'PROJECT_VIEW' ? 1 : 0,
        countryViews: options.eventType === 'COUNTRY_VIEW' ? 1 : 0,
        enquiriesCount: options.eventType === 'ENQUIRY_SUBMITTED' ? 1 : 0,
      },
    })

    return { ok: true, eventId: event.id }
  } catch (error: any) {
    if (error?.code === 'P2002' && options.idempotencyKey) {
      // Unique constraint on idempotencyKey caught at database level
      return { ok: true, ignored: true, reason: 'DUPLICATE_IDEMPOTENCY_KEY_DB' }
    }
    console.error('[ANALYTICS_RECORD_ERROR]', error)
    return { ok: false, reason: error.message }
  }
}

export interface ParsedDateRange {
  startDate: Date
  endDate: Date
  rangeKey: 'today' | '7d' | '30d' | '90d' | 'ytd' | 'custom'
  interval: 'day' | 'month'
}

/**
 * Validates and parses analytics date filter query parameters.
 * Supports: today, 7d, 30d, 90d, ytd, and custom (startDate, endDate).
 * Guarantees a consistent UTC timezone strategy.
 */
export function parseAnalyticsDateRange(searchParams: URLSearchParams): ParsedDateRange {
  const rangeParam = (searchParams.get('range') || '30d').toLowerCase()
  const now = new Date()
  let startDate: Date
  const endDate: Date = new Date(now)
  endDate.setUTCHours(23, 59, 59, 999)

  let rangeKey: ParsedDateRange['rangeKey'] = '30d'
  let interval: 'day' | 'month' = 'day'

  if (rangeParam === 'today') {
    rangeKey = 'today'
    startDate = new Date(now)
    startDate.setUTCHours(0, 0, 0, 0)
    interval = 'day'
  } else if (rangeParam === '7d') {
    rangeKey = '7d'
    startDate = new Date(now)
    startDate.setUTCDate(startDate.getUTCDate() - 6)
    startDate.setUTCHours(0, 0, 0, 0)
    interval = 'day'
  } else if (rangeParam === '90d') {
    rangeKey = '90d'
    startDate = new Date(now)
    startDate.setUTCDate(startDate.getUTCDate() - 89)
    startDate.setUTCHours(0, 0, 0, 0)
    interval = 'day'
  } else if (rangeParam === 'ytd') {
    rangeKey = 'ytd'
    startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
    interval = 'month'
  } else if (rangeParam === 'custom' || searchParams.get('startDate') || searchParams.get('endDate')) {
    rangeKey = 'custom'
    const sStr = searchParams.get('startDate')
    const eStr = searchParams.get('endDate')

    if (!sStr || !eStr) {
      throw new Error('Custom date range requires both "startDate" and "endDate" parameters (YYYY-MM-DD).')
    }

    const s = new Date(sStr)
    const e = new Date(eStr)

    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      throw new Error('Invalid date format for custom date range. Expected YYYY-MM-DD.')
    }

    if (s > e) {
      throw new Error('startDate must be on or before endDate.')
    }

    s.setUTCHours(0, 0, 0, 0)
    e.setUTCHours(23, 59, 59, 999)
    startDate = s
    endDate.setTime(e.getTime())

    const daysDiff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
    interval = daysDiff > 90 ? 'month' : 'day'
  } else {
    // Default 30d
    rangeKey = '30d'
    startDate = new Date(now)
    startDate.setUTCDate(startDate.getUTCDate() - 29)
    startDate.setUTCHours(0, 0, 0, 0)
    interval = 'day'
  }

  return { startDate, endDate, rangeKey, interval }
}
