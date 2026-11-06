import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { parseAnalyticsDateRange } from '@/lib/analytics'

/**
 * GET /api/admin/analytics/projects
 * Returns comprehensive project and inventory analytics, additions over time,
 * pricing state breakdowns, and country-level inventory distribution.
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

    // 1. Current inventory overview
    const inventoryRaw = await db.$queryRaw<
      Array<{
        total_properties_count: number
        total_published_count: number
        active_public_listings_count: number
        draft_count: number
        archived_count: number
        spaces_in_round_count: number
        poa_count: number
        unpriced_count: number
        priced_count: number
      }>
    >`
      SELECT 
          COUNT(*)::INTEGER AS total_properties_count,
          COUNT(*) FILTER (WHERE "isPublished" = true AND "isArchived" = false)::INTEGER AS total_published_count,
          COUNT(*) FILTER (WHERE "isPublished" = true AND "isArchived" = false AND "isPubliclyVisible" = true)::INTEGER AS active_public_listings_count,
          COUNT(*) FILTER (WHERE "isDraft" = true AND "isArchived" = false)::INTEGER AS draft_count,
          COUNT(*) FILTER (WHERE "isArchived" = true)::INTEGER AS archived_count,
          COUNT(*) FILTER (WHERE "isSpaceInRound" = true AND "isPublished" = true AND "isArchived" = false)::INTEGER AS spaces_in_round_count,
          COUNT(*) FILTER (WHERE "isPOA" = true)::INTEGER AS poa_count,
          COUNT(*) FILTER (WHERE "askingPriceNumeric" IS NULL AND "isPOA" = false)::INTEGER AS unpriced_count,
          COUNT(*) FILTER (WHERE "askingPriceNumeric" IS NOT NULL AND "isPOA" = false)::INTEGER AS priced_count
      FROM "Property"
    `

    const inv = inventoryRaw[0] || {
      total_properties_count: 0,
      total_published_count: 0,
      active_public_listings_count: 0,
      draft_count: 0,
      archived_count: 0,
      spaces_in_round_count: 0,
      poa_count: 0,
      unpriced_count: 0,
      priced_count: 0,
    }

    const inventorySummary = {
      totalProjects: Number(inv.total_published_count || 0), // Phase 1 rule: count published projects
      totalPropertiesCount: Number(inv.total_properties_count || 0),
      activePublicListingsCount: Number(inv.active_public_listings_count || 0),
      draftCount: Number(inv.draft_count || 0),
      archivedCount: Number(inv.archived_count || 0),
      spacesInRoundCount: Number(inv.spaces_in_round_count || 0),
      pricingBreakdown: {
        priced: Number(inv.priced_count || 0),
        poa: Number(inv.poa_count || 0),
        unpriced: Number(inv.unpriced_count || 0),
      },
      lifecycleDistribution: {
        published: Number(inv.total_published_count || 0),
        draft: Number(inv.draft_count || 0),
        archived: Number(inv.archived_count || 0),
      },
    }

    // 2. Project additions time series within date range
    let additionsTimeSeries: Array<{ date: string; additionsCount: number }> = []

    if (interval === 'month') {
      const additionsMonthly = await db.$queryRaw<
        Array<{
          month_str: string
          additions_count: number
        }>
      >`
        SELECT 
            TO_CHAR("createdAt", 'YYYY-MM') AS month_str,
            COUNT(*)::INTEGER AS additions_count
        FROM "Property"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month_str ASC
      `
      additionsTimeSeries = additionsMonthly.map((m) => ({
        date: m.month_str,
        additionsCount: Number(m.additions_count),
      }))
    } else {
      const additionsDaily = await db.$queryRaw<
        Array<{
          date_str: string
          additions_count: number
        }>
      >`
        SELECT 
            TO_CHAR("createdAt", 'YYYY-MM-DD') AS date_str,
            COUNT(*)::INTEGER AS additions_count
        FROM "Property"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY date_str ASC
      `
      additionsTimeSeries = additionsDaily.map((d) => ({
        date: d.date_str,
        additionsCount: Number(d.additions_count),
      }))
    }

    // 3. Country-level project distribution
    const countryRaw = await db.$queryRaw<
      Array<{
        country: string
        total_count: number
        published_count: number
        draft_count: number
        archived_count: number
        poa_count: number
      }>
    >`
      SELECT 
          COALESCE(c."name", 'Unspecified') AS country,
          COUNT(p.id)::INTEGER AS total_count,
          COUNT(p.id) FILTER (WHERE p."isPublished" = true AND p."isArchived" = false)::INTEGER AS published_count,
          COUNT(p.id) FILTER (WHERE p."isDraft" = true AND p."isArchived" = false)::INTEGER AS draft_count,
          COUNT(p.id) FILTER (WHERE p."isArchived" = true)::INTEGER AS archived_count,
          COUNT(p.id) FILTER (WHERE p."isPOA" = true)::INTEGER AS poa_count
      FROM "Property" p
      LEFT JOIN "Country" c ON p."countryId" = c.id
      GROUP BY c."name"
      ORDER BY total_count DESC
    `

    const countryDistribution = countryRaw.map((c) => ({
      country: c.country,
      total: Number(c.total_count),
      published: Number(c.published_count),
      draft: Number(c.draft_count),
      archived: Number(c.archived_count),
      poa: Number(c.poa_count),
    }))

    return NextResponse.json({
      dateRange: {
        rangeKey,
        startDate: startDate.toISOString().substring(0, 10),
        endDate: endDate.toISOString().substring(0, 10),
        interval,
      },
      inventorySummary,
      additionsTimeSeries,
      countryDistribution,
    })
  } catch (error) {
    console.error('Error fetching project analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch project analytics' }, { status: 500 })
  }
}
