import { db } from '@/lib/db'
import {
  LaunchesCinematicStack,
  VideoLaunch,
  CollectionCountry,
} from './LaunchesCinematicStack'
import { PropertyItem } from '@/data/properties'

export async function LaunchesCinematicStackServer() {
  // 1. Fetch top 3 featured launches
  const dbLaunches = await db.property.findMany({
    where: {
      isPublished: true,
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
  })

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

  // 2. Fetch collection countries
  const dbCountries = await db.country.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: 'asc' },
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

  // 3. Fetch space in round properties
  const dbSpaceProps = await db.property.findMany({
    where: {
      isPublished: true,
      isSpaceInRound: true,
    },
    orderBy: { spaceOrder: 'asc' },
    include: {
      country: true,
      images: { orderBy: { order: 'asc' } },
    },
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
      image: p.mainImage || p.images[0]?.url || '',
      gallery: p.images.map((img) => img.url),
      layoutVariant: p.layoutVariant || 1,
      lat: 0,
      lng: 0,
      href: `/collection/${countrySlug}/${p.slug}`,
    } as PropertyItem
  })

  // 4. Fetch homepage content
  const dbHomepageContent = await db.homepageContent.findFirst()

  return (
    <LaunchesCinematicStack
      launches={launches.length > 0 ? launches : undefined}
      countries={countries.length > 0 ? countries : undefined}
      spaceProperties={spaceProperties.length > 0 ? spaceProperties : undefined}
      homepageContent={dbHomepageContent}
    />
  )
}
