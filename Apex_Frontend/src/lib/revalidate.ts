import { revalidatePath } from 'next/cache'

function safeRevalidate(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type)
  } catch (err) {
    // Non-fatal outside Next.js request lifecycle or during standalone scripts
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Revalidate] Warning for "${path}":`, err instanceof Error ? err.message : err)
    }
  }
}

/**
 * Revalidates homepage, global shell, public CMS endpoints, and core admin CMS pages.
 */
export function revalidateHomepageCms() {
  safeRevalidate('/')
  safeRevalidate('/collection')
  safeRevalidate('/services')
  safeRevalidate('/contact')
  safeRevalidate('/sitemap.xml')
  safeRevalidate('/api/public/homepage')
  safeRevalidate('/admin/homepage-video')
  safeRevalidate('/admin/homepage')
  safeRevalidate('/admin/one-team')
  safeRevalidate('/admin/collection-media')
}

/**
 * Revalidates One Team section on homepage and Services landing/detail routes.
 */
export function revalidateOneTeamAndServices(serviceSlugs: string[] = []) {
  const defaultSlugs = [
    'luxury-villas',
    'commercial-properties',
    'sky-residences',
    'waterfront-residences',
  ]
  const slugs = Array.from(new Set([...defaultSlugs, ...serviceSlugs.filter(Boolean)]))

  safeRevalidate('/')
  safeRevalidate('/services')
  safeRevalidate('/sitemap.xml')
  safeRevalidate('/api/public/homepage')
  safeRevalidate('/api/public/services')
  safeRevalidate('/admin/one-team')
  safeRevalidate('/admin/services')

  for (const slug of slugs) {
    safeRevalidate(`/services/${slug}`)
    safeRevalidate(`/api/public/services/${slug}`)
  }
}

/**
 * Revalidates Collection showcase on homepage and Country collection routes.
 */
export function revalidateCollectionAndCountries(countrySlugs: string[] = []) {
  const slugs = Array.from(new Set(countrySlugs.filter(Boolean)))

  safeRevalidate('/')
  safeRevalidate('/collection')
  safeRevalidate('/sitemap.xml')
  safeRevalidate('/api/public/homepage')
  safeRevalidate('/api/public/collection-countries')
  safeRevalidate('/api/public/countries')
  safeRevalidate('/admin/countries')
  safeRevalidate('/admin/collection-media')

  for (const slug of slugs) {
    safeRevalidate(`/collection/${slug}`)
  }
}

/**
 * Revalidates homepage, Launches, Spaces in the Round, country pages, property detail pages,
 * and linked services whenever a property changes.
 */
export function revalidatePropertyCms(params: {
  slug?: string | null
  previousSlug?: string | null
  countrySlug?: string | null
  previousCountrySlug?: string | null
  serviceSlugs?: string[]
}) {
  const countrySlugs = Array.from(
    new Set([params.countrySlug, params.previousCountrySlug].filter((s): s is string => Boolean(s)))
  )
  const propertySlugs = Array.from(
    new Set([params.slug, params.previousSlug].filter((s): s is string => Boolean(s)))
  )

  safeRevalidate('/')
  safeRevalidate('/collection')
  safeRevalidate('/launches')
  safeRevalidate('/services')
  safeRevalidate('/sitemap.xml')
  safeRevalidate('/api/public/homepage')
  safeRevalidate('/api/public/launches')
  safeRevalidate('/api/public/space-in-round')
  safeRevalidate('/api/public/properties')
  safeRevalidate('/admin/properties')
  safeRevalidate('/admin/launches')
  safeRevalidate('/admin/space-in-round')

  for (const cSlug of countrySlugs) {
    safeRevalidate(`/collection/${cSlug}`)
    for (const pSlug of propertySlugs) {
      safeRevalidate(`/collection/${cSlug}/${pSlug}`)
    }
  }

  for (const sSlug of params.serviceSlugs || []) {
    if (sSlug) {
      safeRevalidate(`/services/${sSlug}`)
    }
  }
}
