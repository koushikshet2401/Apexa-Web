import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/analytics/countries
 * Returns geographic destination analytics: property counts, active published listings,
 * valuation by currency, enquiry interest, and closed deal volume per country.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.ANALYTICS_READ)
  if (auth instanceof Response) return auth

  try {
    // 1. Property inventory & active listings per country
    const propertyGeoRaw = await db.$queryRaw<
      Array<{
        country: string
        total_properties: number
        active_published: number
      }>
    >`
      SELECT 
          COALESCE(c."name", 'Unspecified') AS country,
          COUNT(p.id)::INTEGER AS total_properties,
          COUNT(p.id) FILTER (WHERE p."isPublished" = true AND p."isArchived" = false AND p."isPubliclyVisible" = true)::INTEGER AS active_published
      FROM "Property" p
      LEFT JOIN "Country" c ON p."countryId" = c.id
      GROUP BY c."name"
      ORDER BY total_properties DESC
    `

    // 2. Valuation by currency per country
    const valuationGeoRaw = await db.$queryRaw<
      Array<{
        country: string
        currency: string
        total_amount: Prisma.Decimal
      }>
    >`
      SELECT 
          COALESCE(c."name", 'Unspecified') AS country,
          p."askingCurrency" AS currency,
          SUM(p."askingPriceNumeric") AS total_amount
      FROM "Property" p
      LEFT JOIN "Country" c ON p."countryId" = c.id
      WHERE p."askingPriceNumeric" IS NOT NULL
        AND p."isPOA" = false
      GROUP BY c."name", p."askingCurrency"
      ORDER BY c."name", total_amount DESC
    `

    const valuationMap = new Map<string, Array<{ currency: string; totalAmount: string }>>()
    for (const row of valuationGeoRaw) {
      if (!valuationMap.has(row.country)) {
        valuationMap.set(row.country, [])
      }
      valuationMap.get(row.country)!.push({
        currency: row.currency,
        totalAmount: row.total_amount ? Number(row.total_amount).toFixed(2) : '0.00',
      })
    }

    // 3. Enquiries count per country
    const enquiryGeoRaw = await db.$queryRaw<
      Array<{
        country: string
        enquiry_count: number
      }>
    >`
      SELECT 
          country,
          COUNT(*)::INTEGER AS enquiry_count
      FROM (
        SELECT COALESCE(e."country", c."name", 'Unspecified') AS country
        FROM "Enquiry" e
        LEFT JOIN "Property" p ON e."propertyId" = p.id
        LEFT JOIN "Country" c ON p."countryId" = c.id
      ) sub
      WHERE country != 'Unspecified'
      GROUP BY country
    `
    const enquiryMap = new Map<string, number>()
    for (const row of enquiryGeoRaw) {
      enquiryMap.set(row.country, Number(row.enquiry_count))
    }

    // 4. Closed deals per country (via Property -> Country relation)
    const dealGeoRaw = await db.$queryRaw<
      Array<{
        country: string
        closed_deals_count: number
      }>
    >`
      SELECT 
          COALESCE(c."name", 'Unspecified') AS country,
          COUNT(d.id)::INTEGER AS closed_deals_count
      FROM "Deal" d
      JOIN "Property" p ON d."propertyId" = p.id
      LEFT JOIN "Country" c ON p."countryId" = c.id
      WHERE d."status" = 'COMPLETED'
      GROUP BY c."name"
    `
    const dealMap = new Map<string, number>()
    for (const row of dealGeoRaw) {
      dealMap.set(row.country, Number(row.closed_deals_count))
    }

    // 5. Views per country from AnalyticsEvent
    const viewsGeoRaw = await db.$queryRaw<
      Array<{
        country: string
        views_count: number
      }>
    >`
      SELECT 
          "country",
          COUNT(*)::INTEGER AS views_count
      FROM "AnalyticsEvent"
      WHERE "country" IS NOT NULL AND "country" != ''
      GROUP BY "country"
    `
    const viewsMap = new Map<string, number>()
    for (const row of viewsGeoRaw) {
      viewsMap.set(row.country, Number(row.views_count))
    }

    // Combine all unique countries
    const allCountryNames = new Set<string>([
      ...propertyGeoRaw.map((p) => p.country),
      ...enquiryGeoRaw.map((e) => e.country),
      ...dealGeoRaw.map((d) => d.country),
      ...viewsGeoRaw.map((v) => v.country),
    ])

    const countries = Array.from(allCountryNames).map((country) => {
      const prop = propertyGeoRaw.find((p) => p.country === country)
      return {
        country,
        propertiesCount: prop ? Number(prop.total_properties) : 0,
        activePublishedCount: prop ? Number(prop.active_published) : 0,
        valuationByCurrency: valuationMap.get(country) || [],
        enquiriesCount: enquiryMap.get(country) || 0,
        dealsClosedCount: dealMap.get(country) || 0,
        viewsCount: viewsMap.get(country) || 0,
      }
    })

    // Sort by properties count descending
    countries.sort((a, b) => b.propertiesCount - a.propertiesCount)

    return NextResponse.json({
      totalCountriesCount: countries.length,
      countries,
    })
  } catch (error) {
    console.error('Error fetching country analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch country analytics' }, { status: 500 })
  }
}
