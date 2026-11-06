import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { parseAnalyticsDateRange } from '@/lib/analytics'

/**
 * GET /api/admin/analytics/visits
 * Returns detailed website visit analytics, time-series trends, and top viewed pages.
 * Supports query parameters: ?range=today|7d|30d|90d|ytd|custom&startDate=...&endDate=...
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.ANALYTICS_READ)
  if (auth instanceof Response) return auth

  try {
    let parsedRange
    try {
      parsedRange = parseAnalyticsDateRange(request.nextUrl.searchParams)
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    const { startDate, endDate, rangeKey, interval } = parsedRange

    // 1. Summary aggregations from DailyAnalytics within the date range
    const summaryRaw = await db.$queryRaw<
      Array<{
        total_qualifying: number
        total_page_views: number
        total_project_views: number
        total_country_views: number
      }>
    >`
      SELECT 
          COALESCE(SUM("qualifyingVisits"), 0)::INTEGER AS total_qualifying,
          COALESCE(SUM("pageViews"), 0)::INTEGER AS total_page_views,
          COALESCE(SUM("projectViews"), 0)::INTEGER AS total_project_views,
          COALESCE(SUM("countryViews"), 0)::INTEGER AS total_country_views
      FROM "DailyAnalytics"
      WHERE "date" >= ${startDate} AND "date" <= ${endDate}
    `

    const sum = summaryRaw[0] || {
      total_qualifying: 0,
      total_page_views: 0,
      total_project_views: 0,
      total_country_views: 0,
    }

    const totalQualifyingVisits = Number(sum.total_qualifying || 0)
    const totalPageViews = Number(sum.total_page_views || 0)
    const totalProjectViews = Number(sum.total_project_views || 0)
    const totalCountryViews = Number(sum.total_country_views || 0)

    // 2. Repeat visits within the date range
    const repeatRaw = await db.$queryRaw<Array<{ repeat_count: number }>>`
      SELECT COUNT(*)::INTEGER AS repeat_count
      FROM (
        SELECT "visitorHash"
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
          AND "visitorHash" IS NOT NULL
          AND "visitorHash" != 'anon_visitor'
        GROUP BY "visitorHash"
        HAVING COUNT(*) > 1
      ) t
    `
    const repeatVisitsCount = Number(repeatRaw[0]?.repeat_count || 0)

    const repeatVisitsRatio =
      totalQualifyingVisits > 0
        ? Number(((repeatVisitsCount / totalQualifyingVisits) * 100).toFixed(2))
        : 0

    const avgPageViewsPerVisit =
      totalQualifyingVisits > 0
        ? Number((totalPageViews / totalQualifyingVisits).toFixed(2))
        : 0

    // 3. Time Series Data
    let timeSeries: Array<{
      date: string
      visits: number
      pageViews: number
      projectViews: number
      countryViews: number
    }> = []

    if (interval === 'month') {
      const monthlyRaw = await db.$queryRaw<
        Array<{
          month_str: string
          visits: number
          page_views: number
          project_views: number
          country_views: number
        }>
      >`
        SELECT 
            TO_CHAR("date", 'YYYY-MM') AS month_str,
            COALESCE(SUM("qualifyingVisits"), 0)::INTEGER AS visits,
            COALESCE(SUM("pageViews"), 0)::INTEGER AS page_views,
            COALESCE(SUM("projectViews"), 0)::INTEGER AS project_views,
            COALESCE(SUM("countryViews"), 0)::INTEGER AS country_views
        FROM "DailyAnalytics"
        WHERE "date" >= ${startDate} AND "date" <= ${endDate}
        GROUP BY TO_CHAR("date", 'YYYY-MM')
        ORDER BY month_str ASC
      `
      timeSeries = monthlyRaw.map((r) => ({
        date: r.month_str,
        visits: Number(r.visits),
        pageViews: Number(r.page_views),
        projectViews: Number(r.project_views),
        countryViews: Number(r.country_views),
      }))
    } else {
      const dailyRecords = await db.dailyAnalytics.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      })
      timeSeries = dailyRecords.map((r) => ({
        date: r.date.toISOString().substring(0, 10),
        visits: r.qualifyingVisits,
        pageViews: r.pageViews,
        projectViews: r.projectViews,
        countryViews: r.countryViews,
      }))
    }

    // 4. Top Pages Visited
    const topPagesRaw = await db.$queryRaw<
      Array<{
        path: string
        views: number
      }>
    >`
      SELECT 
          "path",
          COUNT(*)::INTEGER AS views
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
        AND "path" IS NOT NULL
      GROUP BY "path"
      ORDER BY views DESC
      LIMIT 10
    `

    const topPages = topPagesRaw.map((p) => ({
      path: p.path,
      views: Number(p.views),
    }))

    return NextResponse.json({
      dateRange: {
        rangeKey,
        startDate: startDate.toISOString().substring(0, 10),
        endDate: endDate.toISOString().substring(0, 10),
        interval,
      },
      summary: {
        metricLabel: 'Website Visits' as const, // Strictly labeled "Website Visits"
        totalQualifyingVisits,
        totalPageViews,
        totalProjectViews,
        totalCountryViews,
        repeatVisitsCount,
        repeatVisitsRatio,
        avgPageViewsPerVisit,
      },
      timeSeries,
      topPages,
    })
  } catch (error) {
    console.error('Error fetching visits analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch visits analytics' }, { status: 500 })
  }
}
