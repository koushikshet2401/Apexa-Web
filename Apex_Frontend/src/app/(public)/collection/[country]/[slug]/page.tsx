import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CinematicPropertyDetail } from '@/components/property-detail/CinematicPropertyDetail'
import { db } from '@/lib/db'
import { SLUG_ALIASES, getPropertyBySlug } from '@/data/properties'
import { DESTINATIONS } from '@/data/destinations'

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const properties = await db.property.findMany({
      where: {
        isPublished: true,
        isPubliclyVisible: true,
        isArchived: true,
      },
      select: {
        slug: true,
        country: { select: { slug: true } },
      },
    })
    return properties.map((p) => ({
      country: p.country?.slug || 'dubai',
      slug: p.slug,
    }))
  } catch {
    return [
      { country: 'dubai', slug: 'the-meridian' },
      { country: 'dubai', slug: 'aurelia-villa' },
      { country: 'thailand', slug: 'the-peninsula-reserve' },
    ]
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; slug: string }>
}): Promise<Metadata> {
  const { country, slug } = await params
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
    if (record) {
      if (!record.isPublished || !record.isPubliclyVisible || record.isArchived) {
        notFound()
      }
      dbProperty = record
    }
  } catch {
    // Database connection offline or failed, seamlessly fall back to static data
  }

  if (dbProperty) {
    return {
      title: `${dbProperty.name} — ${dbProperty.cityName || ''} | Apex Pacific Holdings`,
      description: dbProperty.description || dbProperty.shortDescription || '',
      openGraph: {
        title: `${dbProperty.name} | Apex Pacific Holdings`,
        description: dbProperty.description || '',
        images: [{ url: dbProperty.mainImage || dbProperty.images[0]?.url || '', width: 1200, height: 630 }],
      },
    }
  }

  let fallback = getPropertyBySlug(resolvedSlug)
  if (!fallback) {
    for (const dest of DESTINATIONS) {
      const match = dest.projects.find((p) => p.slug === resolvedSlug || p.id === resolvedSlug)
      if (match) {
        fallback = {
          name: match.title,
          city: match.city,
          description: `${match.title} in ${match.city}, ${dest.country}`,
        } as any
        break
      }
    }
  }
  if (!fallback) notFound()

  return {
    title: `${fallback.name} — ${fallback.city} | Apex Pacific Holdings`,
    description: fallback.description,
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

    if (record) {
      // Canonical public visibility rule: only active published projects or visible acquired
      if (!record.isPublished || !record.isPubliclyVisible || record.isArchived) {
        notFound()
      }
      dbProperty = record
    }
  } catch {
    // Database connection offline or failed, seamlessly fall back to static data
  }

  let property: any = null

  if (dbProperty) {
    const isAcquired = dbProperty.hasCompletedDeal || (dbProperty.deals && dbProperty.deals.length > 0)

    property = {
      id: dbProperty.id,
      slug: dbProperty.slug,
      name: dbProperty.name,
      cardLabel: isAcquired ? 'ACQUIRED' : (dbProperty.cardLabel || dbProperty.name.toUpperCase()),
      country: dbProperty.country?.displayName || dbProperty.country?.name || country.toUpperCase(),
      city: dbProperty.cityName || '',
      type: dbProperty.type || 'residential',
      beds: dbProperty.beds || '3–4',
      baths: dbProperty.baths || '3',
      area: dbProperty.area || '',
      price: isAcquired ? 'Acquired' : (dbProperty.price || 'Price on Application'),
      isAcquired,
      tagline: dbProperty.tagline || '',
      shortDescription: dbProperty.shortDescription || '',
      description: dbProperty.description || '',
      highlights: dbProperty.highlights || [],
      image: dbProperty.mainImage || dbProperty.images[0]?.url || '',
      gallery: dbProperty.images.map((img: any) => img.url),
      mainVideoUrl: dbProperty.mainVideoUrl,
      mainVideoThumb: dbProperty.mainVideoThumb,
      layoutVariant: dbProperty.layoutVariant || 1,
      services: dbProperty.services.map((ps: any) => ps.service),
    }
  } else {
    const fallback = getPropertyBySlug(resolvedSlug)
    if (fallback) {
      property = fallback
    } else {
      // Robust safety net: locate property across DESTINATIONS
      for (const dest of DESTINATIONS) {
        const match = dest.projects.find((p) => p.slug === resolvedSlug || p.id === resolvedSlug)
        if (match) {
          property = {
            id: match.id,
            slug: match.slug,
            name: match.title,
            cardLabel: match.title.toUpperCase(),
            country: dest.country,
            city: match.city,
            type: match.type,
            beds: match.beds || '3–5 Bedrooms',
            baths: '3–5 Baths',
            area: '5,000 – 8,000 sq ft',
            price: 'Price on Application',
            tagline: `${match.type} in ${match.city}, ${dest.country}.`,
            shortDescription: `Curated luxury ${match.type.toLowerCase()} located in ${match.city}.`,
            description: `An exceptional architectural residence located in ${match.city}, ${dest.country}. Crafted with meticulous attention to natural light, indoor-outdoor fluidity, and bespoke finishes curated by Apex Pacific Holdings.`,
            highlights: [
              `Prime ${match.city} location with uninterrupted vistas`,
              'Architectural design with custom artisan finishes',
              'Private infinity pool & landscaped grounds',
              '24/7 dedicated concierge & security',
              'Smart home automation throughout',
            ],
            image: match.image,
            gallery: [
              match.image,
              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80&auto=format&fit=crop',
            ],
            layoutVariant: 1,
            services: [],
          }
          break
        }
      }
    }
  }

  if (!property) {
    notFound()
  }

  return (
    <CinematicPropertyDetail
      property={property}
      backHref={`/collection/${country}`}
    />
  )
}
