import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { SLUG_ALIASES, getPropertyBySlug } from '@/data/properties'

export default async function LegacyPropertyOrCountryRedirect({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country: paramValue } = await params
  const resolvedSlug = SLUG_ALIASES[paramValue] || paramValue

  // 1. Check if paramValue is a property slug
  const property = await db.property.findUnique({
    where: { slug: resolvedSlug },
    include: { country: true },
  })

  if (property) {
    const countrySlug =
      property.country?.slug ||
      (property.cityName?.toLowerCase() === 'mumbai' || property.cityName?.toLowerCase() === 'hyderabad'
        ? 'india'
        : property.cityName?.toLowerCase() === 'milan'
        ? 'italy'
        : 'dubai')
    redirect(`/properties/${countrySlug}/${property.slug}`)
  }

  // Check fallback data
  const fallback = getPropertyBySlug(resolvedSlug)
  if (fallback) {
    const countrySlug = fallback.country?.toLowerCase().replace(/\s+/g, '-') || 'international'
    redirect(`/properties/${countrySlug}/${fallback.slug}`)
  }

  // 2. Check if paramValue is a country slug
  const countryRecord = await db.country.findUnique({
    where: { slug: paramValue },
  })
  if (countryRecord) {
    redirect(`/collection/${countryRecord.slug}`)
  }

  notFound()
}
