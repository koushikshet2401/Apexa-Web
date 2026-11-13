import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://apexpacificholdings.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let countries: Array<{ slug: string; updatedAt: Date }> = []
  let properties: Array<{ slug: string; updatedAt: Date; country: { slug: string } | null }> = []
  let services: Array<{ slug: string; updatedAt: Date }> = []

  try {
    const [dbCountries, dbProperties, dbServices] = await Promise.all([
      db.country.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      db.property.findMany({
        where: { isPublished: true, isPubliclyVisible: true, isArchived: false },
        select: { slug: true, updatedAt: true, country: { select: { slug: true } } },
      }),
      db.serviceCategory.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
    ])
    countries = dbCountries
    properties = dbProperties
    services = dbServices
  } catch (err) {
    console.error('[Sitemap] Database query failed, returning fallback static routes:', err)
  }

  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE_URL}/collection`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), priority: 0.3 },
  ]

  const countryEntries: MetadataRoute.Sitemap = countries.map((c) => ({
    url: `${BASE_URL}/collection/${c.slug}`,
    lastModified: c.updatedAt || new Date(),
    priority: 0.85,
  }))

  const propertyEntries: MetadataRoute.Sitemap = properties.map((p) => {
    const countrySlug = p.country?.slug || 'dubai'
    return {
      url: `${BASE_URL}/collection/${countrySlug}/${p.slug}`,
      lastModified: p.updatedAt || new Date(),
      priority: 0.8,
    }
  })

  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${BASE_URL}/services/${s.slug}`,
    lastModified: s.updatedAt || new Date(),
    priority: 0.75,
  }))

  return [
    ...staticEntries,
    ...countryEntries,
    ...propertyEntries,
    ...serviceEntries,
  ]
}
