import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { ServiceDetailClient } from '@/components/pages/ServiceDetailClient'
import { ScrollingProjectItem } from '@/components/ui/images-scrolling-animation'
import {
  fetchPublishedServicesFromDb,
  fetchServiceBySlugFromDb,
  mapDbServiceToItem,
  type ServiceItem,
} from '@/lib/services-cms'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const dbService = await fetchServiceBySlugFromDb(slug)

  if (!dbService || !dbService.isPublished) {
    notFound()
  }

  return {
    title: `${dbService.name} — Apex Pacific Holdings`,
    description: dbService.heroDescription || dbService.description || '',
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [dbService, allPublishedServices] = await Promise.all([
    fetchServiceBySlugFromDb(slug),
    fetchPublishedServicesFromDb(),
  ])

  if (!dbService || !dbService.isPublished) {
    notFound()
  }

  const service: ServiceItem = mapDbServiceToItem(dbService)

  const currentIndex = allPublishedServices.findIndex((s) => s.slug === slug)
  const nextService: ServiceItem | null =
    allPublishedServices.length > 1
      ? allPublishedServices[(currentIndex >= 0 ? currentIndex + 1 : 0) % allPublishedServices.length]
      : null

  const propertiesList: ScrollingProjectItem[] = (dbService.properties || [])
    .map((ps: any) => ps.property)
    .filter((p: any) => p && p.isPublished && p.isPubliclyVisible && !p.isArchived)
    .map((p: any) => {
      const countrySlug = p.country?.slug || ''
      const primaryImage =
        p.mainImage ||
        p.images?.find((img: any) => img.type === 'HERO')?.url ||
        p.images?.[0]?.url ||
        ''

      return {
        id: p.id,
        title: p.name,
        src: primaryImage,
        href: countrySlug ? `/collection/${countrySlug}/${p.slug}` : undefined,
        type: p.type || undefined,
        city: p.cityName || p.country?.name || undefined,
        price: p.price || undefined,
        beds: p.beds || undefined,
      }
    })

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <ServiceDetailClient
          service={service}
          nextService={nextService}
          properties={propertiesList}
        />
      </main>
      <Footer />
    </>
  )
}
