import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CinematicPropertyDetail } from '@/components/property-detail/CinematicPropertyDetail'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SLUG_ALIASES: Record<string, string> = {
  'horizon-villa': 'horizon-pavilion',
  'sky-penthouse': 'one-sky-penthouse',
  'palm-villa': 'palm-frond-signature',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const resolvedSlug = SLUG_ALIASES[slug] || slug

  let dbProperty: any = null

  try {
    const record = await db.property.findUnique({
      where: { slug: resolvedSlug },
      select: {
        isPublished: true,
        isPubliclyVisible: true,
        isArchived: true,
        name: true,
        cityName: true,
        description: true,
        shortDescription: true,
        mainImage: true,
        images: { take: 1, select: { url: true } },
      },
    })
    if (record && record.isPublished && record.isPubliclyVisible && !record.isArchived) {
      dbProperty = record
    }
  } catch {
    // Database connection error
  }

  if (!dbProperty) {
    notFound()
  }

  const coverImg = dbProperty.mainImage || dbProperty.images[0]?.url
  return {
    title: `${dbProperty.name}${dbProperty.cityName ? ` — ${dbProperty.cityName}` : ''} | Apex Pacific Holdings`,
    description: dbProperty.description || dbProperty.shortDescription || '',
    ...(coverImg
      ? {
          openGraph: {
            title: `${dbProperty.name} | Apex Pacific Holdings`,
            description: dbProperty.description || '',
            images: [{ url: coverImg, width: 1200, height: 630 }],
          },
        }
      : {}),
  }
}

export default async function CollectionPropertyPage({
  params,
}: {
  params: Promise<{ country: string; slug: string }>
}) {
  const { country, slug } = await params
  const resolvedSlug = SLUG_ALIASES[slug] || slug

  let dbProperty: any = null

  try {
    const record = await db.property.findUnique({
      where: { slug: resolvedSlug },
      include: {
        country: true,
        images: { orderBy: { order: 'asc' } },
        services: { include: { service: true } },
        deals: {
          where: { status: 'COMPLETED' },
          select: { id: true, keepPubliclyVisible: true },
        },
      },
    })

    if (record && record.isPublished && record.isPubliclyVisible && !record.isArchived) {
      dbProperty = record
    }
  } catch {
    // Database connection error
  }

  if (!dbProperty) {
    notFound()
  }

  const isAcquired = Boolean(dbProperty.hasCompletedDeal || (dbProperty.deals && dbProperty.deals.length > 0))

  const property = {
    id: dbProperty.id,
    slug: dbProperty.slug,
    name: dbProperty.name,
    cardLabel: isAcquired ? 'ACQUIRED' : (dbProperty.cardLabel || dbProperty.name.toUpperCase()),
    country: dbProperty.country?.displayName || dbProperty.country?.name || country.toUpperCase(),
    city: dbProperty.cityName || '',
    type: dbProperty.type || '',
    beds: dbProperty.beds || '',
    baths: dbProperty.baths || '',
    area: dbProperty.area || '',
    price: isAcquired ? 'Acquired' : (dbProperty.price || ''),
    isAcquired,
    isFeaturedLaunch: Boolean(dbProperty.isFeaturedLaunch),
    tagline: dbProperty.tagline || '',
    shortDescription: dbProperty.shortDescription || '',
    description: dbProperty.description || '',
    highlights: Array.isArray(dbProperty.highlights) ? dbProperty.highlights : [],
    image: dbProperty.mainImage || dbProperty.images[0]?.url || '',
    gallery: dbProperty.images.map((img: any) => img.url),
    galleryItems: dbProperty.images.map((img: any) => ({
      url: img.url,
      alt: img.alt || '',
      description: img.description || '',
    })),
    mainVideoUrl: dbProperty.mainVideoUrl || null,
    mainVideoThumb: dbProperty.mainVideoThumb || null,
    layoutVariant: dbProperty.layoutVariant || 1,
    mapUrl: dbProperty.mapUrl || null,
    locationLine: dbProperty.locationLine || null,
    cityName: dbProperty.cityName || null,
    latitude: dbProperty.latitude || null,
    longitude: dbProperty.longitude || null,
    services: dbProperty.services.map((ps: any) => ps.service),
  }

  return (
    <CinematicPropertyDetail
      property={property}
      backHref={`/collection/${country}`}
    />
  )
}
