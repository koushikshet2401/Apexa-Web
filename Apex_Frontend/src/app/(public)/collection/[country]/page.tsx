import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { DESTINATIONS } from '@/data/destinations'
import { PROPERTIES_DATA } from '@/data/properties'
import { CollectionCountryClient, CountryData, CountryProjectData } from '@/components/pages/CollectionCountryClient'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  try {
    const countries = await db.country.findMany({
      where: { isPublished: true },
      select: { slug: true },
    })
    return countries.map((c) => ({
      country: c.slug,
    }))
  } catch {
    return [
      { country: 'dubai' },
      { country: 'thailand' },
      { country: 'malaysia' },
      { country: 'australia' },
      { country: 'georgia' },
    ]
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>
}): Promise<Metadata> {
  const { country: countrySlug } = await params
  let country: any = null
  try {
    country = await db.country.findUnique({
      where: { slug: countrySlug },
    })
  } catch {
    // Database connection offline
  }

  const legacyDest = DESTINATIONS.find(
    (d) => d.slug === countrySlug || (countrySlug === 'dubai' && d.slug === 'uae')
  )

  if (!country && !legacyDest) {
    notFound()
  }

  const titleName =
    country?.displayName ||
    country?.name ||
    (countrySlug === 'dubai' ? 'Dubai / UAE' : legacyDest?.country || countrySlug.toUpperCase())

  const description =
    country?.description ||
    country?.tagline ||
    legacyDest?.description ||
    legacyDest?.tagline ||
    'Private architecture and luxury residences.'

  return {
    title: `${titleName} Collection — Apex Pacific Holdings`,
    description,
  }
}

export default async function CollectionCountryPage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country: countrySlug } = await params
  let country: any = null

  try {
    country = await db.country.findUnique({
      where: { slug: countrySlug },
      include: {
        properties: {
          where: { isPublished: true },
          include: {
            images: { orderBy: { order: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  } catch {
    // Database connection offline
  }

  // Find destination matching projects as fallback if DB is offline or has no record
  const legacyDest = DESTINATIONS.find(
    (d) => d.slug === countrySlug || (countrySlug === 'dubai' && d.slug === 'uae')
  )

  if (!country && !legacyDest) {
    notFound()
  }

  const displayedProjects: CountryProjectData[] =
    country && country.properties && country.properties.length > 0
      ? country.properties.map((p: any) => ({
          id: p.id,
          title: p.name,
          type: p.type || 'Residence',
          city: p.cityName || country.name,
          beds: p.beds || 'Bespoke',
          baths: p.baths || undefined,
          area: p.area || undefined,
          price: p.price || undefined,
          description:
            p.description ||
            p.shortDescription ||
            p.tagline ||
            'Ultra-prime architectural residence curated by Apex Pacific Holdings.',
          shortDescription: p.shortDescription || p.tagline || undefined,
          highlights: p.highlights || [],
          image: p.images[0]?.url || p.mainImage || country.cardImage || '/images/DuabiCoolection.png',
          slug: p.slug,
        }))
      : (legacyDest?.projects || []).map((lp) => {
          const detail = PROPERTIES_DATA[lp.slug]
          return {
            id: lp.id,
            title: lp.title,
            type: lp.type,
            city: lp.city,
            beds: detail?.beds != null ? `${detail.beds} Bedrooms` : lp.beds,
            baths: detail?.baths != null ? `${detail.baths} Baths` : undefined,
            area: detail?.area,
            price: detail?.price,
            description:
              detail?.shortDescription ||
              detail?.description ||
              'Ultra-prime architectural residence curated by Apex Pacific Holdings.',
            shortDescription: detail?.shortDescription || detail?.tagline,
            highlights: detail?.highlights || [],
            image: detail?.image || lp.image,
            slug: lp.slug,
          }
        })

  const countryData: CountryData = {
    id: country?.id || legacyDest?.id || countrySlug,
    slug: countrySlug,
    name: country?.name || legacyDest?.country || countrySlug,
    displayName:
      country?.displayName ||
      country?.name ||
      (countrySlug === 'dubai' ? 'Dubai / UAE' : legacyDest?.country || countrySlug.toUpperCase()),
    region: country?.region || legacyDest?.region || undefined,
    cities: country?.cities || legacyDest?.cities || undefined,
    tagline: country?.tagline || legacyDest?.tagline || undefined,
    description: country?.description || legacyDest?.description || undefined,
    heroVideoUrl:
      country?.heroVideoUrl ||
      (countrySlug === 'dubai' ? '/videos/VID02.mp4' : '/videos/luxury-palm-beach.mp4'),
    heroVideoThumb:
      country?.heroVideoThumb ||
      legacyDest?.image ||
      (countrySlug === 'thailand' ? '/images/Thailand.png' : '/images/DuabiCoolection.png'),
    cardImage:
      country?.cardImage ||
      legacyDest?.image ||
      (countrySlug === 'thailand' ? '/images/Thailand.png' : '/images/DuabiCoolection.png'),
  }

  return (
    <CollectionCountryClient
      country={countryData}
      projects={displayedProjects}
    />
  )
}
