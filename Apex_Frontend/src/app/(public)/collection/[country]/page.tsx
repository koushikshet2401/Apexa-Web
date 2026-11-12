import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'
import { CollectionCountryClient, CountryData, CountryProjectData } from '@/components/pages/CollectionCountryClient'

export const dynamic = 'force-dynamic'

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
    // Database connection error
  }

  if (!country || !country.isPublished) {
    notFound()
  }

  const titleName = country.displayName || country.name || countrySlug.toUpperCase()
  const description =
    country.description ||
    country.tagline ||
    `${titleName} Portfolio — Apex Pacific Holdings.`

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

  const propertyInclude = {
    where: {
      isPublished: true,
      isPubliclyVisible: true,
      isArchived: false,
    },
    include: {
      images: { orderBy: { order: 'asc' as const } },
    },
    orderBy: { createdAt: 'desc' as const },
  }

  try {
    country = await db.country.findUnique({
      where: { slug: countrySlug },
      include: {
        collectionMedia: true,
        properties: propertyInclude,
      },
    })
  } catch (err) {
    if (isMissingCmsExtensionError(err)) {
      country = await db.country.findUnique({
        where: { slug: countrySlug },
        include: {
          properties: propertyInclude,
        },
      })
    } else {
      throw err
    }
  }

  if (!country || !country.isPublished) {
    notFound()
  }

  const resolvedCoverImage =
    country.collectionMedia?.coverImageUrl ?? country.cardImage ?? country.heroVideoThumb ?? undefined
  const resolvedHeroVideoUrl =
    country.collectionMedia?.heroVideoUrl ?? country.heroVideoUrl ?? undefined

  const displayedProjects: CountryProjectData[] = (country.properties || []).map((p: any) => ({
    id: p.id,
    title: p.name,
    type: p.type || '',
    city: p.cityName || country.name,
    beds: p.beds ? (p.beds.toLowerCase().includes('bed') ? p.beds : `${p.beds} Bedrooms`) : '',
    baths: p.baths ? (p.baths.toLowerCase().includes('bath') ? p.baths : `${p.baths} Baths`) : undefined,
    area: p.area || undefined,
    price: p.price || undefined,
    description: p.description || p.shortDescription || p.tagline || '',
    shortDescription: p.shortDescription || p.tagline || undefined,
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
    image: p.mainImage || p.images[0]?.url || resolvedCoverImage || '',
    slug: p.slug,
  }))

  const countryData: CountryData = {
    id: country.id,
    slug: country.slug,
    name: country.name,
    displayName: country.displayName || country.name,
    region: country.region || undefined,
    cities: country.cities || undefined,
    tagline: country.tagline || undefined,
    description: country.description || undefined,
    heroVideoUrl: resolvedHeroVideoUrl,
    heroVideoThumb: resolvedCoverImage,
    cardImage: resolvedCoverImage,
  }

  return (
    <CollectionCountryClient
      country={countryData}
      projects={displayedProjects}
    />
  )
}
