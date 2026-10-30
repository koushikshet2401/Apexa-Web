import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CinematicPropertyDetail } from '@/components/property-detail/CinematicPropertyDetail'
import { PROPERTIES_DATA, SLUG_ALIASES, getPropertyBySlug } from '@/data/properties'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const property = getPropertyBySlug(slug)
  if (!property) return { title: 'Not Found — Apex Pacific Holdings' }
  return {
    title: `${property.name} — ${property.city} | Apex Pacific Holdings`,
    description: property.description,
    openGraph: {
      title: `${property.name} | Apex Pacific Holdings`,
      description: property.description,
      images: [{ url: property.image, width: 1200, height: 630 }],
    },
  }
}

export async function generateStaticParams() {
  const keys = Object.keys(PROPERTIES_DATA)
  const aliasKeys = Object.keys(SLUG_ALIASES)
  return [...keys, ...aliasKeys].map((slug) => ({ slug }))
}

export default async function ResidencePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const property = getPropertyBySlug(slug)
  if (!property) notFound()

  return <CinematicPropertyDetail property={property} />
}
