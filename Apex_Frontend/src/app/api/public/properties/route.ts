import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/public/properties
 * Returns all active publicly eligible properties for search & exploration.
 * Strictly enforces canonical visibility: isPublished=true, isPubliclyVisible=true, isArchived=false.
 */
export async function GET() {
  try {
    const properties = await db.property.findMany({
      where: {
        isPublished: true,
        isPubliclyVisible: true,
        isArchived: false,
      },
      include: {
        country: {
          select: {
            id: true,
            slug: true,
            name: true,
            displayName: true,
          },
        },
        services: {
          include: {
            service: { select: { id: true, name: true, slug: true } },
          },
        },
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        deals: {
          where: { status: 'COMPLETED' },
          select: { id: true, keepPubliclyVisible: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const results = properties.map((p) => {
      const countrySlug = p.country?.slug || 'dubai'
      const isAcquired = Boolean(p.hasCompletedDeal || (p.deals && p.deals.length > 0))
      const firstService = p.services[0]?.service?.name

      const category = firstService || (p.type === 'commercial' ? 'Commercial Properties' : p.type || '')

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        destinationId: countrySlug,
        countryLabel: p.country?.displayName || p.country?.name || countrySlug.toUpperCase(),
        location: p.locationLine || p.cityName || '',
        category,
        price: isAcquired ? 'Acquired' : (p.price || ''),
        image: p.mainImage || p.images[0]?.url || '',
        href: `/collection/${countrySlug}/${p.slug}`,
        isAcquired,
      }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching public properties:', error)
    return NextResponse.json({ error: 'Failed to fetch public properties' }, { status: 500 })
  }
}
