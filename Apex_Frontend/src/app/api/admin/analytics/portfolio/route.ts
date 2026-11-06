import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/analytics/portfolio
 * Returns total corporate portfolio valuation across all lifecycle states,
 * active published valuation, lifecycle valuation breakdowns, and pricing structure counts.
 * Strictly preserves multi-currency separation (no direct cross-currency summation).
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.ANALYTICS_READ)
  if (auth instanceof Response) return auth

  try {
    // 1. Total Corporate Portfolio Valuation (All Lifecycle States: Published, Draft, Sold, Recoverably Archived)
    const totalValuationRaw = await db.$queryRaw<
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
      byCurrency: totalValuationRaw.map((row) => ({
        currency: row.currency,
        totalAmount: row.total_amount ? Number(row.total_amount).toFixed(2) : '0.00',
        propertyCount: Number(row.property_count),
      })),
      scopeDescription: 'Includes Published, Draft, Sold, and Recoverably Archived projects' as const,
    }

    // 2. Active Published Listings Valuation (Live Customer Showcase)
    const activeValuationRaw = await db.$queryRaw<
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
      byCurrency: activeValuationRaw.map((row) => ({
        currency: row.currency,
        totalAmount: row.active_amount ? Number(row.active_amount).toFixed(2) : '0.00',
        activeListingCount: Number(row.active_listing_count),
      })),
      scopeDescription: 'Includes only properties currently live on public website' as const,
    }

    // 3. Lifecycle state valuation breakdown
    const lifecycleRaw = await db.$queryRaw<
      Array<{
        lifecycle_state: string
        currency: string
        count: number
        total_amount: Prisma.Decimal
      }>
    >`
      SELECT 
          CASE 
              WHEN "isArchived" = true THEN 'ARCHIVED'
              WHEN "isPublished" = true THEN 'PUBLISHED'
              ELSE 'DRAFT'
          END AS lifecycle_state,
          "askingCurrency" AS currency,
          COUNT(*)::INTEGER AS count,
          SUM("askingPriceNumeric") AS total_amount
      FROM "Property"
      WHERE "askingPriceNumeric" IS NOT NULL 
        AND "isPOA" = false
      GROUP BY lifecycle_state, "askingCurrency"
      ORDER BY lifecycle_state, total_amount DESC
    `

    const lifecycleValuation: Record<
      string,
      Array<{ currency: string; totalAmount: string; count: number }>
    > = {
      PUBLISHED: [],
      DRAFT: [],
      ARCHIVED: [],
    }

    for (const row of lifecycleRaw) {
      if (lifecycleValuation[row.lifecycle_state]) {
        lifecycleValuation[row.lifecycle_state].push({
          currency: row.currency,
          totalAmount: row.total_amount ? Number(row.total_amount).toFixed(2) : '0.00',
          count: Number(row.count),
        })
      }
    }

    // 4. Pricing structure inventory counts
    const pricingCountsRaw = await db.$queryRaw<
      Array<{
        priced_count: number
        poa_count: number
        unpriced_count: number
        total_count: number
      }>
    >`
      SELECT 
          COUNT(*) FILTER (WHERE "askingPriceNumeric" IS NOT NULL AND "isPOA" = false)::INTEGER AS priced_count,
          COUNT(*) FILTER (WHERE "isPOA" = true)::INTEGER AS poa_count,
          COUNT(*) FILTER (WHERE "askingPriceNumeric" IS NULL AND "isPOA" = false)::INTEGER AS unpriced_count,
          COUNT(*)::INTEGER AS total_count
      FROM "Property"
    `

    const pc = pricingCountsRaw[0] || {
      priced_count: 0,
      poa_count: 0,
      unpriced_count: 0,
      total_count: 0,
    }

    const pricingStructureCounts = {
      totalPropertiesCount: Number(pc.total_count || 0),
      pricedCount: Number(pc.priced_count || 0),
      poaCount: Number(pc.poa_count || 0),
      unpricedCount: Number(pc.unpriced_count || 0),
    }

    return NextResponse.json({
      totalPortfolioValuation,
      activePublishedValuation,
      lifecycleValuation,
      pricingStructureCounts,
      integrityPolicy: {
        multiCurrencyEnforced: true,
        directCrossCurrencySummation: false,
        note: 'All monetary amounts remain strictly partitioned by their ISO 4217 currency. Cross-currency summation is strictly forbidden.',
      },
    })
  } catch (error) {
    console.error('Error fetching portfolio analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch portfolio analytics' }, { status: 500 })
  }
}
