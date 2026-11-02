import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CinematicPropertyDetail } from '@/components/property-detail/CinematicPropertyDetail'
import { db } from '@/lib/db'
import { SLUG_ALIASES, getPropertyBySlug } from '@/data/properties'
import { DESTINATIONS } from '@/data/destinations'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  try {
    const properties = await db.property.findMany({
      where: { isPublished: true },
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

  // If unpublished in DB, trigger notFound
  const unpublished = await db.property.findFirst({
    where: { slug: resolvedSlug, isPublished: false },
    select: { id: true },
  })
  if (unpublished) notFound()

  const dbProperty = await db.property.findFirst({
    where: {
      slug: resolvedSlug,
      isPublished: true,
      OR: [
        { country: { slug: country } },
        { countryId: null },
      ],
    },
    include: { country: true, images: true },
  })

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

  // If explicitly unpublished in database, trigger 404
  const unpublished = await db.property.findFirst({
    where: { slug: resolvedSlug, isPublished: false },
    select: { id: true },
  })
  if (unpublished) {
    notFound()
  }

  const dbProperty = await db.property.findFirst({
    where: {
      slug: resolvedSlug,
      isPublished: true,
      OR: [
        { country: { slug: country } },
        { countryId: null },
      ],
    },
    include: {
      country: true,
      images: { orderBy: { order: 'asc' } },
      services: { include: { service: true } },
    },
  })

  let property: any = null

  if (dbProperty) {
    property = {
      id: dbProperty.id,
      slug: dbProperty.slug,
      name: dbProperty.name,
      cardLabel: dbProperty.cardLabel || dbProperty.name.toUpperCase(),
      country: dbProperty.country?.displayName || dbProperty.country?.name || country.toUpperCase(),
      city: dbProperty.cityName || '',
      type: dbProperty.type || 'residential',
      beds: dbProperty.beds || '3–4',
      baths: dbProperty.baths || '3',
      area: dbProperty.area || '',
      price: dbProperty.price || 'Price on Application',
      tagline: dbProperty.tagline || '',
      shortDescription: dbProperty.shortDescription || '',
      description: dbProperty.description || '',
      highlights: dbProperty.highlights || [],
      image: dbProperty.mainImage || dbProperty.images[0]?.url || '',
      gallery: dbProperty.images.map((img) => img.url),
      mainVideoUrl: dbProperty.mainVideoUrl,
      mainVideoThumb: dbProperty.mainVideoThumb,
      layoutVariant: dbProperty.layoutVariant || 1,
      services: dbProperty.services.map((ps) => ps.service),
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
