import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { parseAnalyticsDateRange } from '@/lib/analytics'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/analytics/deals
 * Returns deal closure revenue, multi-currency volume breakdown (original vs effective),
 * deal closure time series, pipeline distribution across all stages, and win rates.
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

    // 1. Completed deal volume by effective currency (handling financial adjustments)
    let volumeRaw: Array<{
      currency: string
      original_sales_volume: Prisma.Decimal
      effective_sales_volume: Prisma.Decimal
      closed_deals_count: number
      adjusted_deals_count: number
    }> = []

    try {
      volumeRaw = await db.$queryRaw`
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
      volumeRaw = fallback.map((f) => ({
        currency: f.currency,
        original_sales_volume: f.total_sales_volume,
        effective_sales_volume: f.total_sales_volume,
        closed_deals_count: f.closed_deals_count,
        adjusted_deals_count: 0,
      }))
    }

    const salesVolume = {
      byCurrency: volumeRaw.map((row) => ({
        currency: row.currency,
        originalSalesVolume: row.original_sales_volume ? Number(row.original_sales_volume).toFixed(2) : '0.00',
        effectiveSalesVolume: row.effective_sales_volume ? Number(row.effective_sales_volume).toFixed(2) : '0.00',
        closedDealsCount: Number(row.closed_deals_count || 0),
        adjustedDealsCount: Number(row.adjusted_deals_count || 0),
      })),
    }

    // 2. Completed deal counts and visibility choice (Option A vs Option B)
    const metricsRaw = await db.$queryRaw<
      Array<{
        total_completed_deals: number
        option_a_visible_count: number
        option_b_unlisted_count: number
        total_lost_deals: number
        total_deals_count: number
        inquiry_count: number
        contacted_count: number
        offer_made_count: number
        under_contract_count: number
      }>
    >`
      SELECT 
          COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::INTEGER AS total_completed_deals,
          COUNT(*) FILTER (WHERE "status" = 'COMPLETED' AND "keepPubliclyVisible" = true)::INTEGER AS option_a_visible_count,
          COUNT(*) FILTER (WHERE "status" = 'COMPLETED' AND "keepPubliclyVisible" = false)::INTEGER AS option_b_unlisted_count,
          COUNT(*) FILTER (WHERE "status" = 'LOST')::INTEGER AS total_lost_deals,
          COUNT(*)::INTEGER AS total_deals_count,
          COUNT(*) FILTER (WHERE "status" = 'INQUIRY')::INTEGER AS inquiry_count,
          COUNT(*) FILTER (WHERE "status" = 'CONTACTED')::INTEGER AS contacted_count,
          COUNT(*) FILTER (WHERE "status" = 'OFFER_MADE')::INTEGER AS offer_made_count,
          COUNT(*) FILTER (WHERE "status" = 'UNDER_CONTRACT')::INTEGER AS under_contract_count
      FROM "Deal"
    `

    const m = metricsRaw[0] || {
      total_completed_deals: 0,
      option_a_visible_count: 0,
      option_b_unlisted_count: 0,
      total_lost_deals: 0,
      total_deals_count: 0,
      inquiry_count: 0,
      contacted_count: 0,
      offer_made_count: 0,
      under_contract_count: 0,
    }

    const totalCompleted = Number(m.total_completed_deals || 0)
    const totalLost = Number(m.total_lost_deals || 0)
    const totalDeals = Number(m.total_deals_count || 0)
    const terminalDeals = totalCompleted + totalLost

    const winRatePercentage =
      terminalDeals > 0 ? Number(((totalCompleted / terminalDeals) * 100).toFixed(2)) : null

    const throughputPercentage =
      totalDeals > 0 ? Number(((totalCompleted / totalDeals) * 100).toFixed(2)) : null

    const completedDealsSummary = {
      totalCompletedDeals: totalCompleted,
      optionAVisibleCount: Number(m.option_a_visible_count || 0),
      optionBUnlistedCount: Number(m.option_b_unlisted_count || 0),
      totalLostDeals: totalLost,
      totalDealsCount: totalDeals,
      winRate: {
        ratioPercent: winRatePercentage,
        completed: totalCompleted,
        lost: totalLost,
        formula: 'COMPLETED / (COMPLETED + LOST) * 100' as const,
      },
      pipelineThroughput: {
        ratioPercent: throughputPercentage,
        completed: totalCompleted,
        total: totalDeals,
        formula: 'COMPLETED / TOTAL_DEALS * 100' as const,
      },
    }

    // 3. Pipeline breakdown
    const pipelineBreakdown = {
      inquiry: Number(m.inquiry_count || 0),
      contacted: Number(m.contacted_count || 0),
      offerMade: Number(m.offer_made_count || 0),
      underContract: Number(m.under_contract_count || 0),
      completed: totalCompleted,
      lost: totalLost,
      totalPending:
        Number(m.inquiry_count || 0) +
        Number(m.contacted_count || 0) +
        Number(m.offer_made_count || 0) +
        Number(m.under_contract_count || 0),
    }

    // 4. Closures time series within date range
    let closuresTimeSeries: Array<{ date: string; closuresCount: number }> = []

    if (interval === 'month') {
      const closuresMonthly = await db.$queryRaw<
        Array<{
          month_str: string
          closures_count: number
        }>
      >`
        SELECT 
            TO_CHAR("updatedAt", 'YYYY-MM') AS month_str,
            COUNT(*)::INTEGER AS closures_count
        FROM "Deal"
        WHERE "status" = 'COMPLETED'
          AND "updatedAt" >= ${startDate} AND "updatedAt" <= ${endDate}
        GROUP BY TO_CHAR("updatedAt", 'YYYY-MM')
        ORDER BY month_str ASC
      `
      closuresTimeSeries = closuresMonthly.map((r) => ({
        date: r.month_str,
        closuresCount: Number(r.closures_count),
      }))
    } else {
      const closuresDaily = await db.$queryRaw<
        Array<{
          date_str: string
          closures_count: number
        }>
      >`
        SELECT 
            TO_CHAR("updatedAt", 'YYYY-MM-DD') AS date_str,
            COUNT(*)::INTEGER AS closures_count
        FROM "Deal"
        WHERE "status" = 'COMPLETED'
          AND "updatedAt" >= ${startDate} AND "updatedAt" <= ${endDate}
        GROUP BY TO_CHAR("updatedAt", 'YYYY-MM-DD')
        ORDER BY date_str ASC
      `
      closuresTimeSeries = closuresDaily.map((r) => ({
        date: r.date_str,
        closuresCount: Number(r.closures_count),
      }))
    }

    return NextResponse.json({
      dateRange: {
        rangeKey,
        startDate: startDate.toISOString().substring(0, 10),
        endDate: endDate.toISOString().substring(0, 10),
        interval,
      },
      completedDealsSummary,
      salesVolume,
      pipelineBreakdown,
      closuresTimeSeries,
    })
  } catch (error) {
    console.error('Error fetching deals analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch deals analytics' }, { status: 500 })
  }
}
