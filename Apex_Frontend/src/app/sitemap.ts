import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://apexpacificholdings.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const collectionCountries = [
    'dubai',
    'thailand',
    'malaysia',
    'australia',
    'georgia',
  ]

  const propertyPages = [
    { country: 'dubai', slug: 'the-meridian', lastModified: new Date() },
    { country: 'dubai', slug: 'aurelia-villa', lastModified: new Date() },
    { country: 'thailand', slug: 'the-peninsula-reserve', lastModified: new Date() },
    { country: 'malaysia', slug: 'horizon-pavilion', lastModified: new Date() },
    { country: 'dubai', slug: 'verdant-house', lastModified: new Date() },
    { country: 'dubai', slug: 'marble-sanctuary', lastModified: new Date() },
    { country: 'australia', slug: 'ivory-residences', lastModified: new Date() },
  ]

  const servicePages = [
    'luxury-villas',
    'sky-residences',
    'commercial-properties',
    'waterfront-residences',
  ]

  return [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE_URL}/collection`, lastModified: new Date(), priority: 0.9 },
    ...collectionCountries.map((c) => ({
      url: `${BASE_URL}/collection/${c}`,
      lastModified: new Date(),
      priority: 0.85,
    })),
    ...propertyPages.map((p) => ({
      url: `${BASE_URL}/collection/${p.country}/${p.slug}`,
      lastModified: p.lastModified,
      priority: 0.8,
    })),
    ...servicePages.map((s) => ({
      url: `${BASE_URL}/services/${s}`,
      lastModified: new Date(),
      priority: 0.75,
    })),
    { url: `${BASE_URL}/contact`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), priority: 0.3 },
  ]
}
