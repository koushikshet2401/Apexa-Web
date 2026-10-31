import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { DESTINATIONS } from '@/data/destinations'
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
  const country = await db.country.findUnique({
    where: { slug: countrySlug },
  })

  if (!country) {
    notFound()
  }

  return {
    title: `${country.displayName || country.name} Collection — Apex Pacific Holdings`,
    description: country.description || country.tagline || 'Private architecture and luxury residences.',
  }
}

export default async function CollectionCountryPage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country: countrySlug } = await params
  const country = await db.country.findUnique({
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

  if (!country) {
    notFound()
  }

  // Find destination matching projects as fallback if DB has no properties for this country yet
  const legacyDest = DESTINATIONS.find(
    (d) => d.slug === countrySlug || (countrySlug === 'dubai' && d.slug === 'uae')
  )

  const displayedProjects: CountryProjectData[] =
    country.properties.length > 0
      ? country.properties.map((p) => ({
          id: p.id,
          title: p.name,
          type: p.type || 'Residence',
          city: p.cityName || country.name,
          beds: p.beds || 'Bespoke',
          image: p.images[0]?.url || p.mainImage || country.cardImage || '/images/DuabiCoolection.png',
          slug: p.slug,
        }))
      : (legacyDest?.projects || []).map((lp) => ({
          id: lp.id,
          title: lp.title,
          type: lp.type,
          city: lp.city,
          beds: lp.beds,
          image: lp.image,
          slug: lp.slug,
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
    heroVideoUrl: country.heroVideoUrl || undefined,
    heroVideoThumb: country.heroVideoThumb || undefined,
    cardImage: country.cardImage || undefined,
  }

  return (
    <CollectionCountryClient
      country={countryData}
      projects={displayedProjects}
    />
  )
}
