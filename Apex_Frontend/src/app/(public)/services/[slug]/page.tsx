import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { SERVICES, ServiceItem } from '@/data/services'
import { db } from '@/lib/db'
import { ServiceDetailClient } from '@/components/pages/ServiceDetailClient'
import { ScrollingProjectItem } from '@/components/ui/images-scrolling-animation'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  try {
    const dbServices = await db.serviceCategory.findMany({
      where: { isPublished: true },
      select: { slug: true },
    })
    if (dbServices.length > 0) {
      return dbServices.map((s) => ({ slug: s.slug }))
    }
  } catch {}
  return SERVICES.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let dbService = null
  try {
    dbService = await db.serviceCategory.findUnique({
      where: { slug },
    })
  } catch {}
  const fallback = SERVICES.find((s) => s.slug === slug)

  if (!dbService && !fallback) {
    notFound()
  }

  const title = dbService?.name || fallback?.title || 'Service'
  const description = dbService?.heroDescription || dbService?.description || fallback?.heroDescription || ''

  return {
    title: `${title} — Apex Pacific Holdings`,
    description,
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let dbService = null
  try {
    dbService = await db.serviceCategory.findUnique({
      where: { slug },
      include: {
        properties: {
          include: {
            property: {
              include: {
                images: { orderBy: { order: 'asc' } },
                country: true,
              },
            },
          },
        },
      },
    })
  } catch {}

  const fallbackService = SERVICES.find((s) => s.slug === slug)

  if (!dbService && !fallbackService) {
    notFound()
  }

  // Construct normalized service object
  const service: ServiceItem = {
    id: dbService?.id || fallbackService?.id || slug,
    number: dbService ? `0${dbService.displayOrder || 1}` : fallbackService?.number || '01',
    slug,
    title: dbService?.name || fallbackService?.title || '',
    subtitle: dbService?.subtitle || fallbackService?.subtitle || '',
    tagline: dbService?.tagline || fallbackService?.tagline || '',
    description: dbService?.description || fallbackService?.description || '',
    heroDescription:
      dbService?.heroDescription || dbService?.description || fallbackService?.heroDescription || '',
    image: dbService?.image || fallbackService?.image || '/images/laxuryVillaImage.png',
    iconType: (fallbackService?.iconType || 'villa') as ServiceItem['iconType'],
    route: fallbackService?.route || `/services/${slug}`,
    architecturalFocus: fallbackService?.architecturalFocus || [
      'Microclimate & Sun Orientation',
      'Artisanal Stone & Timber Joinery',
      'Integrated Native Landscapes',
      'Multi-Generational Spatial Flow',
    ],
    deliverables: fallbackService?.deliverables || [
      {
        title: 'Topographic & Solar Orientation',
        detail: 'Deep site-specific study maximizing prevailing breezes, privacy sightlines, and morning light angles.',
      },
      {
        title: 'Bespoke Architectural Engineering',
        detail: 'Comprehensive structural, MEP, and building envelope design with zero compromise on structural purity.',
      },
      {
        title: 'Courtyard & Water Architecture',
        detail: 'Seamless integration of reflecting pools, cascading water features, and climate-moderating internal atriums.',
      },
      {
        title: 'Turnkey Construction & Handover',
        detail: 'Direct execution by our dedicated master craftsmen, ensuring uninterrupted continuity from blueprint to keys.',
      },
    ],
  }

  // Find next service for bottom navigation
  const currentIndex = SERVICES.findIndex((s) => s.slug === slug)
  const nextService = SERVICES[(currentIndex + 1) % SERVICES.length]

  // Map properties for Section 2
  let propertiesList: ScrollingProjectItem[] = []

  if (dbService?.properties && dbService.properties.length > 0) {
    propertiesList = dbService.properties
      .map((ps: any) => ps.property)
      .filter((p: any) => p && p.isPublished)
      .map((p: any) => {
        const countrySlug =
          p.country?.slug ||
          (p.cityName?.toLowerCase() === 'mumbai' || p.cityName?.toLowerCase() === 'hyderabad'
            ? 'india'
            : p.cityName?.toLowerCase() === 'milan'
            ? 'italy'
            : 'dubai')
        return {
          id: p.id,
          title: p.name,
          src: p.mainImage || p.images?.[0]?.url || '/images/DuabiCoolection.png',
          href: `/collection/${countrySlug}/${p.slug}`,
          type: p.type || 'Residence',
          city: p.cityName || p.country?.name || 'Dubai',
          price: p.price || undefined,
          beds: p.beds || undefined,
        }
      })
  }

  // Fallback curated residences if database has no assigned properties
  if (propertiesList.length === 0) {
    if (slug === 'luxury-villas') {
      propertiesList = [
        {
          title: 'Aurelia Villa',
          src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/dubai/aurelia-villa',
          type: 'Contemporary Estate',
          city: 'Dubai',
          price: '₹ 12.5 Cr',
          beds: '5 Bedrooms',
        },
        {
          title: 'Verdant House',
          src: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/dubai/verdant-house',
          type: 'Biophilic Villa',
          city: 'Dubai',
          price: '₹ 28.0 Cr',
          beds: '6 Bedrooms',
        },
        {
          title: 'The Marble Sanctuary',
          src: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/dubai/marble-sanctuary',
          type: 'Private Sanctuary',
          city: 'Dubai',
          price: '€ 4.2M',
          beds: '4 Bedrooms',
        },
        {
          title: 'The Peninsula Reserve',
          src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/thailand/the-peninsula-reserve',
          type: 'Coastal Estate',
          city: 'Thailand',
          price: 'THB 68M',
          beds: '5 Bedrooms',
        },
      ]
    } else if (slug === 'sky-residences') {
      propertiesList = [
        {
          title: 'The Meridian',
          src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/dubai/the-meridian',
          type: 'Signature Sky Residence',
          city: 'Dubai',
          price: 'AED 8.2M',
          beds: '3–4 Bedrooms',
        },
        {
          title: 'Horizon Pavilion',
          src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/malaysia/horizon-pavilion',
          type: 'Penthouse Sky Tower',
          city: 'Malaysia',
          price: 'MYR 4.6M',
          beds: '4 Bedrooms',
        },
        {
          title: 'Ivory Residences',
          src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/dubai/the-meridian',
          type: 'Architectural Sky Loft',
          city: 'Dubai',
          price: 'AED 6.5M',
          beds: '3 Bedrooms',
        },
      ]
    } else if (slug === 'commercial-properties') {
      propertiesList = [
        {
          title: 'Apex Commercial Galleria',
          src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
          href: '/contact',
          type: 'Prime Flagship & Mixed-Use',
          city: 'Dubai',
          price: 'AED 45M',
          beds: 'Retail & Commercial',
        },
        {
          title: 'Horizon Pavilion Cultural Center',
          src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/malaysia/horizon-pavilion',
          type: 'Mixed-Use Galleria',
          city: 'Malaysia',
          price: 'MYR 18.5M',
          beds: 'Cultural & Commercial',
        },
        {
          title: 'The Monolith Business Pavilion',
          src: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1600&auto=format&fit=crop',
          href: '/contact',
          type: 'Landmark Galleria',
          city: 'Thailand',
          price: 'THB 120M',
          beds: 'Flagship Spaces',
        },
      ]
    } else {
      // waterfront-residences
      propertiesList = [
        {
          title: 'The Peninsula Reserve',
          src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/thailand/the-peninsula-reserve',
          type: 'Waterfront Sanctuary',
          city: 'Thailand',
          price: 'THB 68M',
          beds: '4–6 Bedrooms',
        },
        {
          title: 'Verdant House Harbourfront',
          src: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/dubai/verdant-house',
          type: 'Coastal Estate & Berth',
          city: 'Dubai',
          price: '₹ 28.0 Cr',
          beds: '6 Bedrooms',
        },
        {
          title: 'Horizon Pavilion Marina',
          src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
          href: '/collection/malaysia/horizon-pavilion',
          type: 'Private Marina Villa',
          city: 'Malaysia',
          price: 'MYR 5.8M',
          beds: '4 Bedrooms',
        },
      ]
    }
  }

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
