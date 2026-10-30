import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PropertyVariant1 } from '@/components/property-variants/PropertyVariant1'
import { PropertyVariant2 } from '@/components/property-variants/PropertyVariant2'
import { PropertyVariant3 } from '@/components/property-variants/PropertyVariant3'
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

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const property = getPropertyBySlug(slug)
  if (!property) notFound()

  const variants: Record<number, React.ComponentType<any>> = {
    1: PropertyVariant1,
    2: PropertyVariant2,
    3: PropertyVariant3,
  }
  const VariantComponent = variants[property.layoutVariant] ?? PropertyVariant1

  return <VariantComponent property={property} />
}
