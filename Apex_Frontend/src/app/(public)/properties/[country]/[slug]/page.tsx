import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PropertyVariant1 } from '@/components/property-variants/PropertyVariant1'
import { PropertyVariant2 } from '@/components/property-variants/PropertyVariant2'
import { PropertyVariant3 } from '@/components/property-variants/PropertyVariant3'
import { db } from '@/lib/db'
import { SLUG_ALIASES, getPropertyBySlug } from '@/data/properties'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; slug: string }>
}): Promise<Metadata> {
  const { country, slug } = await params
  const resolvedSlug = SLUG_ALIASES[slug] || slug

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
  if (!fallback) return { title: 'Not Found — Apex Pacific Holdings' }

  return {
    title: `${fallback.name} — ${fallback.city} | Apex Pacific Holdings`,
    description: fallback.description,
  }
}

export default async function PropertyCountryPage({
  params,
}: {
  params: Promise<{ country: string; slug: string }>
}) {
  const { country, slug } = await params
  const resolvedSlug = SLUG_ALIASES[slug] || slug

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

  const variants: Record<number, React.ComponentType<any>> = {
    1: PropertyVariant1,
    2: PropertyVariant2,
    3: PropertyVariant3,
  }
  const VariantComponent = variants[property.layoutVariant] ?? PropertyVariant1

  return <VariantComponent property={property} />
}
