import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { parseAnalyticsDateRange } from '@/lib/analytics'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/analytics/dashboard
 * Computes and returns the complete executive dashboard metrics:
 * 1. Website Visits (qualifying visits, monthly, daily trends, repeat visits)
 * 2. Total Published Projects
 * 3. Total Portfolio Valuation (All Lifecycle States, grouped by currency)
 * 4. Active Published Listings Valuation (Live Customer Showcase, grouped by currency)
 * 5. Completed Deal Sales Volume (Original & Effective Adjusted, grouped by currency)
 * 6. Completed Deal Counts, Visibility (Option A vs Option B) & Ratios (Win Rate, Throughput)
 * 7. Asset Inventory & Pricing Structure Counts (Priced, POA, Unpriced)
 * 8. Spaces in the Round Count
 * 9. Pending Deals Pipeline Breakdown
 * 
 * Supports query parameters: ?range=today|7d|30d|90d|ytd|custom&startDate=...&endDate=...
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.ANALYTICS_READ)
  if (auth instanceof Response) return auth

  try {
    // -------------------------------------------------------------------------
    // 0. Date Range Parsing
    // -------------------------------------------------------------------------
    let parsedRange
    try {
      parsedRange = parseAnalyticsDateRange(request.nextUrl.searchParams)
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    // -------------------------------------------------------------------------
    // METRIC 1: Total Corporate Portfolio Valuation (All Lifecycle States)
    // Scope: Published + Draft + Sold + Recoverably Archived
    // -------------------------------------------------------------------------
    const metric1Raw = await db.$queryRaw<
      Array<{
        currency: string
        property_count: number
        total_amount: Prisma.Decimal
      }>
    >`
      SELECT 
          "askingCurrency" AS currency,
          COUNT(*)::INTEGER AS property_count,
          SUM("askingPriceNumeric") AS total_amount
      FROM "Property"
      WHERE "askingPriceNumeric" IS NOT NULL 
        AND "isPOA" = false
      GROUP BY "askingCurrency"
      ORDER BY total_amount DESC
    `

    const totalPortfolioValuation = {
      byCurrency: metric1Raw.map((row) => ({
        currency: row.currency,
        totalAmount: row.total_amount ? Number(row.total_amount).toFixed(2) : '0.00',
        propertyCount: Number(row.property_count),
      })),
      scopeDescription: 'Includes Published, Draft, Sold, and Recoverably Archived projects' as const,
    }

    // -------------------------------------------------------------------------
    // METRIC 2: Active Published Listings Valuation (Live Customer Showcase)
    // Scope: isPublished = true AND isArchived = false AND isPubliclyVisible = true
    // -------------------------------------------------------------------------
    const metric2Raw = await db.$queryRaw<
      Array<{
        currency: string
        active_listing_count: number
        active_amount: Prisma.Decimal
      }>
    >`
      SELECT 
          "askingCurrency" AS currency,
          COUNT(*)::INTEGER AS active_listing_count,
          SUM("askingPriceNumeric") AS active_amount
      FROM "Property"
      WHERE "isPublished" = true 
        AND "isArchived" = false 
        AND "isPubliclyVisible" = true
        AND "askingPriceNumeric" IS NOT NULL
        AND "isPOA" = false
      GROUP BY "askingCurrency"
      ORDER BY active_amount DESC
    `

    const activePublishedValuation = {
      byCurrency: metric2Raw.map((row) => ({
        currency: row.currency,
        totalAmount: row.active_amount ? Number(row.active_amount).toFixed(2) : '0.00',
        activeListingCount: Number(row.active_listing_count),
      })),
      scopeDescription: 'Includes only properties currently live on public website' as const,
    }

    // -------------------------------------------------------------------------
    // METRIC 3: Completed Deal Sales Volume (Original & Effective Adjusted)
    // -------------------------------------------------------------------------
    let metric3Raw: Array<{
      currency: string
      original_sales_volume: Prisma.Decimal
      effective_sales_volume: Prisma.Decimal
      closed_deals_count: number
      adjusted_deals_count: number
    }> = []

    try {
      metric3Raw = await db.$queryRaw`
        WITH LatestAdjustments AS (
            SELECT DISTINCT ON ("dealId")
                "dealId",
                "adjustedSalePrice",
                "adjustedCurrency"
            FROM "DealFinancialAdjustment"
            ORDER BY "dealId", "adjustmentSequence" DESC
        ),
        EffectiveDeals AS (
            SELECT 
                d.id,
                d."saleCurrency" AS original_currency,
                d."actualSalePrice" AS original_price,
                COALESCE(adj."adjustedCurrency", d."saleCurrency") AS effective_currency,
                COALESCE(adj."adjustedSalePrice", d."actualSalePrice") AS effective_price,
                CASE WHEN adj."dealId" IS NOT NULL THEN 1 ELSE 0 END AS is_adjusted
            FROM "Deal" d
            LEFT JOIN LatestAdjustments adj ON d.id = adj."dealId"
            WHERE d."status" = 'COMPLETED'
              AND d."actualSalePrice" IS NOT NULL
        )
        SELECT 
            effective_currency AS currency,
            SUM(original_price) FILTER (WHERE original_currency = effective_currency) AS original_sales_volume,
            SUM(effective_price) AS effective_sales_volume,
            COUNT(id)::INTEGER AS closed_deals_count,
            SUM(is_adjusted)::INTEGER AS adjusted_deals_count
        FROM EffectiveDeals
        GROUP BY effective_currency
        ORDER BY effective_sales_volume DESC
      `
    } catch {
      const fallback = await db.$queryRaw<
        Array<{
          currency: string
          closed_deals_count: number
          total_sales_volume: Prisma.Decimal
        }>
      >`
        SELECT 
            "saleCurrency" AS currency,
            COUNT(*)::INTEGER AS closed_deals_count,
            SUM("actualSalePrice") AS total_sales_volume
        FROM "Deal"
        WHERE "status" = 'COMPLETED'
          AND "actualSalePrice" IS NOT NULL
        GROUP BY "saleCurrency"
        ORDER BY total_sales_volume DESC
      `
      metric3Raw = fallback.map((f) => ({
        currency: f.currency,
        original_sales_volume: f.total_sales_volume,
        effective_sales_volume: f.total_sales_volume,
        closed_deals_count: f.closed_deals_count,
        adjusted_deals_count: 0,
      }))
    }

    const completedDealVolume = {
      byCurrency: metric3Raw.map((row) => ({
        currency: row.currency,
        originalSalesVolume: row.original_sales_volume ? Number(row.original_sales_volume).toFixed(2) : '0.00',
        effectiveSalesVolume: row.effective_sales_volume ? Number(row.effective_sales_volume).toFixed(2) : '0.00',
        closedDealsCount: Number(row.closed_deals_count || 0),
        adjustedDealsCount: Number(row.adjusted_deals_count || 0),
      })),
    }

    // -------------------------------------------------------------------------
    // METRIC 4: Completed Deal Counts, Visibility & Canonical Ratios
    // -------------------------------------------------------------------------
    const metric4Raw = await db.$queryRaw<
      Array<{
        total_completed_deals: number
        option_a_visible_count: number
        option_b_unlisted_count: number
        total_lost_deals: number
        total_active_pipeline_deals: number
        total_deals_count: number
        win_rate_percentage: number | null
        pipeline_throughput_percentage: number | null
      }>
    >`
      SELECT 
          COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::INTEGER AS total_completed_deals,
          COUNT(*) FILTER (WHERE "status" = 'COMPLETED' AND "keepPubliclyVisible" = true)::INTEGER AS option_a_visible_count,
          COUNT(*) FILTER (WHERE "status" = 'COMPLETED' AND "keepPubliclyVisible" = false)::INTEGER AS option_b_unlisted_count,
          COUNT(*) FILTER (WHERE "status" = 'LOST')::INTEGER AS total_lost_deals,
          COUNT(*) FILTER (WHERE "status" IN ('INQUIRY', 'CONTACTED', 'OFFER_MADE', 'UNDER_CONTRACT'))::INTEGER AS total_active_pipeline_deals,
          COUNT(*)::INTEGER AS total_deals_count,
          CASE 
              WHEN COUNT(*) FILTER (WHERE "status" IN ('COMPLETED', 'LOST')) > 0 
              THEN ROUND(
                  (COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::DECIMAL / 
                   COUNT(*) FILTER (WHERE "status" IN ('COMPLETED', 'LOST'))::DECIMAL) * 100, 
                  2
              )
              ELSE NULL 
          END AS win_rate_percentage,
          CASE 
              WHEN COUNT(*) > 0 
              THEN ROUND(
                  (COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::DECIMAL / COUNT(*)::DECIMAL) * 100, 
                  2
              )
              ELSE NULL 
          END AS pipeline_throughput_percentage
      FROM "Deal"
    `

    const m4 = metric4Raw[0] || {
      total_completed_deals: 0,
      option_a_visible_count: 0,
      option_b_unlisted_count: 0,
      total_lost_deals: 0,
      total_active_pipeline_deals: 0,
      total_deals_count: 0,
      win_rate_percentage: null,
      pipeline_throughput_percentage: null,
    }

    const totalCompleted = Number(m4.total_completed_deals || 0)
    const totalLost = Number(m4.total_lost_deals || 0)
    const totalDeals = Number(m4.total_deals_count || 0)
    const winRateDenominator = totalCompleted + totalLost

    const completedDealMetrics = {
      totalCompletedDeals: totalCompleted,
      optionAVisibleCount: Number(m4.option_a_visible_count || 0),
      optionBUnlistedCount: Number(m4.option_b_unlisted_count || 0),
      totalLostDeals: totalLost,
      totalActivePipelineDeals: Number(m4.total_active_pipeline_deals || 0),
      totalDealsCount: totalDeals,
      winRate: {
        ratioPercent: m4.win_rate_percentage !== null ? Number(m4.win_rate_percentage) : null,
        numerator: totalCompleted,
        denominator: winRateDenominator,
        formula: 'COMPLETED / (COMPLETED + LOST) * 100' as const,
        eligibilityDescription: 'Terminal / resolved deals only; excludes in-flight pipeline deals' as const,
      },
      pipelineThroughputRate: {
        ratioPercent: m4.pipeline_throughput_percentage !== null ? Number(m4.pipeline_throughput_percentage) : null,
        numerator: totalCompleted,
        denominator: totalDeals,
        formula: 'COMPLETED / TOTAL_DEALS * 100' as const,
        eligibilityDescription: 'All deals across all 6 pipeline stages' as const,
      },
    }

    // -------------------------------------------------------------------------
    // METRIC 5: Asset Inventory & Pricing Structure Counts
    // -------------------------------------------------------------------------
    const metric5Raw = await db.$queryRaw<
      Array<{
        total_properties_count: number
        active_public_listings_count: number
        total_published_count: number
        draft_count: number
        archived_count: number
        poa_count: number
        unpriced_count: number
      }>
    >`
      SELECT 
          COUNT(*)::INTEGER AS total_properties_count,
          COUNT(*) FILTER (WHERE "isPublished" = true AND "isArchived" = false AND "isPubliclyVisible" = true)::INTEGER AS active_public_listings_count,
          COUNT(*) FILTER (WHERE "isPublished" = true AND "isArchived" = false)::INTEGER AS total_published_count,
          COUNT(*) FILTER (WHERE "isDraft" = true AND "isArchived" = false)::INTEGER AS draft_count,
          COUNT(*) FILTER (WHERE "isArchived" = true)::INTEGER AS archived_count,
          COUNT(*) FILTER (WHERE "isPOA" = true)::INTEGER AS poa_count,
          COUNT(*) FILTER (WHERE "askingPriceNumeric" IS NULL AND "isPOA" = false)::INTEGER AS unpriced_count
      FROM "Property"
    `

    const m5 = metric5Raw[0] || {
      total_properties_count: 0,
      active_public_listings_count: 0,
      total_published_count: 0,
      draft_count: 0,
      archived_count: 0,
      poa_count: 0,
      unpriced_count: 0,
    }

    const assetInventoryCounts = {
      totalPropertiesCount: Number(m5.total_properties_count || 0),
      activePublicListingsCount: Number(m5.active_public_listings_count || 0),
      totalPublishedCount: Number(m5.total_published_count || 0),
      draftCount: Number(m5.draft_count || 0),
      archivedCount: Number(m5.archived_count || 0),
      poaCount: Number(m5.poa_count || 0),
      unpricedCount: Number(m5.unpriced_count || 0),
    }

    // Total Projects (per Phase 1 business rule: count published projects; exclude draft and archived)
    const totalProjects = Number(m5.total_published_count || 0)

    // -------------------------------------------------------------------------
    // METRIC 6: Spaces in the Round Count
    // Scope: isSpaceInRound = true AND isPublished = true AND isArchived = false
    // -------------------------------------------------------------------------
    const spacesInRoundRaw = await db.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::INTEGER AS count
      FROM "Property"
      WHERE "isSpaceInRound" = true
        AND "isPublished" = true
        AND "isArchived" = false
    `
    const spacesInRoundCount = Number(spacesInRoundRaw[0]?.count || 0)

    // -------------------------------------------------------------------------
    // METRIC 7: Deal Pipeline (Pending Deals) Breakdown
    // -------------------------------------------------------------------------
    const pipelineRaw = await db.$queryRaw<
      Array<{
        inquiry_count: number
        contacted_count: number
        offer_made_count: number
        under_contract_count: number
        lost_count: number
      }>
    >`
      SELECT 
          COUNT(*) FILTER (WHERE "status" = 'INQUIRY')::INTEGER AS inquiry_count,
          COUNT(*) FILTER (WHERE "status" = 'CONTACTED')::INTEGER AS contacted_count,
          COUNT(*) FILTER (WHERE "status" = 'OFFER_MADE')::INTEGER AS offer_made_count,
          COUNT(*) FILTER (WHERE "status" = 'UNDER_CONTRACT')::INTEGER AS under_contract_count,
          COUNT(*) FILTER (WHERE "status" = 'LOST')::INTEGER AS lost_count
      FROM "Deal"
    `
    const pl = pipelineRaw[0] || {
      inquiry_count: 0,
      contacted_count: 0,
      offer_made_count: 0,
      under_contract_count: 0,
      lost_count: 0,
    }

    const pendingDeals = {
      inquiry: Number(pl.inquiry_count || 0),
      contacted: Number(pl.contacted_count || 0),
      offerMade: Number(pl.offer_made_count || 0),
      underContract: Number(pl.under_contract_count || 0),
      lost: Number(pl.lost_count || 0),
      totalPending:
        Number(pl.inquiry_count || 0) +
        Number(pl.contacted_count || 0) +
        Number(pl.offer_made_count || 0) +
        Number(pl.under_contract_count || 0),
    }

    // -------------------------------------------------------------------------
    // METRIC 8: Website Visits Analytics (Module I Integration)
    // Strictly labeled "Website Visits", never "Unique Visitors"
    // -------------------------------------------------------------------------
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0)

    const todayUtc = new Date()
    todayUtc.setUTCHours(0, 0, 0, 0)

    let totalQualifyingVisits = 0
    let monthlyVisits = 0
    let todayVisits = 0
    let repeatVisitsCount = 0

    try {
      // Sum of qualifying visits from DailyAnalytics
      const visitsSummary = await db.$queryRaw<
        Array<{
          total_qualifying: number
          monthly_visits: number
          today_visits: number
        }>
      >`
        SELECT 
            COALESCE(SUM("qualifyingVisits"), 0)::INTEGER AS total_qualifying,
            COALESCE(SUM("qualifyingVisits") FILTER (WHERE "date" >= ${thirtyDaysAgo}), 0)::INTEGER AS monthly_visits,
            COALESCE(SUM("qualifyingVisits") FILTER (WHERE "date" = ${todayUtc}), 0)::INTEGER AS today_visits
        FROM "DailyAnalytics"
      `
      if (visitsSummary.length > 0) {
        totalQualifyingVisits = Number(visitsSummary[0].total_qualifying || 0)
        monthlyVisits = Number(visitsSummary[0].monthly_visits || 0)
        todayVisits = Number(visitsSummary[0].today_visits || 0)
      }

      // Count repeat visitors (hashes with > 1 event)
      const repeatRaw = await db.$queryRaw<Array<{ repeat_count: number }>>`
        SELECT COUNT(*)::INTEGER AS repeat_count
        FROM (
          SELECT "visitorHash"
          FROM "AnalyticsEvent"
          WHERE "visitorHash" IS NOT NULL
            AND "visitorHash" != 'anon_visitor'
          GROUP BY "visitorHash"
          HAVING COUNT(*) > 1
        ) t
      `
      repeatVisitsCount = Number(repeatRaw[0]?.repeat_count || 0)
    } catch {
      // Graceful fallback if DailyAnalytics or AnalyticsEvent are newly migrated
    }

    // Time-series trend over the selected date range
    let dailyTrend: Array<{ date: string; visits: number; pageViews: number }> = []
    try {
      const trendRecords = await db.dailyAnalytics.findMany({
        where: {
          date: {
            gte: parsedRange.startDate,
            lte: parsedRange.endDate,
          },
        },
        orderBy: { date: 'asc' },
      })
      dailyTrend = trendRecords.map((r) => ({
        date: r.date.toISOString().substring(0, 10),
        visits: r.qualifyingVisits,
        pageViews: r.pageViews,
      }))
    } catch {
      dailyTrend = []
    }

    const repeatVisitsRatio =
      totalQualifyingVisits > 0
        ? Number(((repeatVisitsCount / totalQualifyingVisits) * 100).toFixed(2))
        : 0

    const websiteVisits = {
      metricLabel: 'Website Visits' as const, // Strictly labeled "Website Visits"
      totalQualifyingVisits,
      monthlyVisits,
      todayVisits,
      repeatVisitsCount,
      repeatVisitsRatio,
      dailyTrend,
    }

    return NextResponse.json({
      dateRange: {
        rangeKey: parsedRange.rangeKey,
        startDate: parsedRange.startDate.toISOString().substring(0, 10),
        endDate: parsedRange.endDate.toISOString().substring(0, 10),
        interval: parsedRange.interval,
      },
      websiteVisits,
      totalProjects,
      spacesInRoundCount,
      pendingDeals,
      totalPortfolioValuation,
      activePublishedValuation,
      completedDealVolume,
      completedDealMetrics,
      assetInventoryCounts,
    })
  } catch (error) {
    console.error('Error computing dashboard analytics:', error)
    return NextResponse.json({ error: 'Failed to compute dashboard analytics' }, { status: 500 })
  }
}
