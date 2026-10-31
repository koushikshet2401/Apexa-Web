import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CinematicPropertyDetail } from '@/components/property-detail/CinematicPropertyDetail'
import { db } from '@/lib/db'
import { SLUG_ALIASES, getPropertyBySlug } from '@/data/properties'

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

  const fallback = getPropertyBySlug(resolvedSlug)
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
