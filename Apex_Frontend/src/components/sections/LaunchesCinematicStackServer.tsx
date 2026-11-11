import { db } from '@/lib/db'
import {
  LaunchesCinematicStack,
  VideoLaunch,
  CollectionCountry,
} from './LaunchesCinematicStack'
import { PropertyItem, PERSPECTIVE_GALLERY_PROPERTIES } from '@/data/properties'

export async function LaunchesCinematicStackServer() {
  let dbLaunches: any[] = []
  let dbCountries: any[] = []
  let dbSpaceProps: any[] = []
  let dbHomepageContent: any = null
  const startTime = performance.now()

  try {
    const results = await Promise.all([
      // 1. Fetch top 3 featured launches (strictly enforced canonical visibility)
      db.property.findMany({
        where: {
          isPublished: true,
          isPubliclyVisible: true,
          isArchived: false,
          isFeaturedLaunch: true,
        },
        orderBy: [
          { launchOrder: 'asc' },
          { launchDate: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 3,
        include: {
          country: {
            select: {
              slug: true,
              displayName: true,
              name: true,
            },
          },
        },
      }),

      // 2. Fetch collection countries
      db.country.findMany({
        where: { isPublished: true },
        orderBy: { displayOrder: 'asc' },
      }),

      // 3. Fetch space in round properties (strictly enforced canonical visibility)
      db.property.findMany({
        where: {
          isPublished: true,
          isPubliclyVisible: true,
          isArchived: false,
          isSpaceInRound: true,
        },
        orderBy: { spaceOrder: 'asc' },
        include: {
          country: true,
          images: { orderBy: { order: 'asc' } },
        },
      }),

      // 4. Fetch homepage content
      db.homepageContent.findFirst(),
    ])

    const elapsed = Math.round(performance.now() - startTime)
    console.log(`[Database Timing] Homepage data fetched in ${elapsed}ms (Launches: ${results[0]?.length || 0}, Countries: ${results[1]?.length || 0}, Spaces: ${results[2]?.length || 0})`)
    dbLaunches = results[0]
    dbCountries = results[1]
    dbSpaceProps = results[2]
    dbHomepageContent = results[3]
  } catch (error) {
    // Database connection offline or credentials not set; seamlessly fall back to static data
    const elapsed = Math.round(performance.now() - startTime)
    console.warn(
      `[Database Timing] Homepage DB query failed after ${elapsed}ms, falling back to static data:`,
      error instanceof Error ? error.message : error
    )
  }

  const launches: VideoLaunch[] = dbLaunches.map((p, idx) => {
    const countrySlug = p.country?.slug || 'dubai'
    return {
      id: p.id,
      number: `0${idx + 1}`,
      tag: `FEATURED LAUNCH · 0${idx + 1} OF 0${dbLaunches.length}`,
      title: p.name,
      location: p.locationLine || p.cityName || 'INTERNATIONAL',
      type: p.type || 'Signature Residence',
      beds: p.beds || '3–5 Bedrooms',
      price: p.price || 'Price on Application',
      videoSrc: p.mainVideoUrl || '/videos/luxury-palm-beach.mp4',
      href: `/collection/${countrySlug}/${p.slug}`,
    }
  })

  const countries: CollectionCountry[] = dbCountries.map((c) => {
    let countryKey: 'UAE' | 'Thailand' | 'Georgia' | 'Australia' | 'Malaysia' = 'UAE'
    if (c.slug === 'thailand') countryKey = 'Thailand'
    else if (c.slug === 'georgia') countryKey = 'Georgia'
    else if (c.slug === 'australia') countryKey = 'Australia'
    else if (c.slug === 'malaysia') countryKey = 'Malaysia'
    else if (c.slug === 'dubai' || c.slug === 'uae') countryKey = 'UAE'

    return {
      id: c.id,
      countryCode: c.slug === 'dubai' ? 'AE' : c.slug.slice(0, 2).toUpperCase(),
      countryKey,
      countryName: c.name,
      region: c.region,
      title: `${c.displayName || c.name} Portfolio`,
      category: c.tagline ? c.tagline.toUpperCase() : 'WATERFRONT VILLAS & SKY RESIDENCES',
      location: `${c.cities}, ${c.name}`.toUpperCase(),
      specs: `${c.cities} · 3–6 BEDROOMS`,
      image: c.cardImage || '/images/DuabiCoolection.png',
      href: `/collection/${c.slug}`,
      cities: c.cities,
      description: c.description || '',
    }
  })

  const spaceProperties: PropertyItem[] = dbSpaceProps.map((p) => {
    const countrySlug = p.country?.slug || 'dubai'

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      cardLabel: p.cardLabel || p.name.toUpperCase(),
      category: p.type || 'Architectural Landmark',
      country: p.country?.displayName || p.country?.name || (countrySlug ? countrySlug.toUpperCase() : ''),
      city: p.cityName || '',
      type: p.type || 'residential',
      beds: p.beds ? (parseInt(p.beds) || p.beds) : 3,
      baths: p.baths ? (parseInt(p.baths) || p.baths) : 3,
      area: p.area || '',
      price: p.price || '',
      tagline: p.tagline || '',
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      highlights: p.highlights || [],
      image: p.spaceRoundImage || p.mainImage || p.images[0]?.url || '',
      gallery: p.images.map((img: { url: string }) => img.url),
      layoutVariant: p.layoutVariant || 1,
      lat: 0,
      lng: 0,
      href: `/collection/${countrySlug}/${p.slug}`,
    } as PropertyItem
  })

  // Ensure Spaces in the Round maintains full 3D cylinder geometry (minimum 6 properties).
  // Curated database properties take first priority, and remaining slots are seamlessly padded
  // with default portfolio items (deduplicated by slug or name).
  const combinedSpaceProperties: PropertyItem[] = [...spaceProperties]
  if (combinedSpaceProperties.length < 6) {
    const existingSlugs = new Set(combinedSpaceProperties.map((p) => p.slug || p.id))
    const existingNames = new Set(combinedSpaceProperties.map((p) => p.name?.trim().toLowerCase()))
    for (const def of PERSPECTIVE_GALLERY_PROPERTIES) {
      const nameLower = def.name?.trim().toLowerCase()
      if (!existingSlugs.has(def.slug) && !existingSlugs.has(def.id) && !existingNames.has(nameLower)) {
        combinedSpaceProperties.push(def)
        existingSlugs.add(def.slug || def.id)
        if (nameLower) existingNames.add(nameLower)
      }
      if (combinedSpaceProperties.length >= 6) break
    }
  }

  return (
    <LaunchesCinematicStack
      launches={launches.length > 0 ? launches : undefined}
      countries={countries.length > 0 ? countries : undefined}
      spaceProperties={combinedSpaceProperties.length > 0 ? combinedSpaceProperties : undefined}
      homepageContent={dbHomepageContent}
    />
  )
}
