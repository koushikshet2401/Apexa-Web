import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const properties = await db.property.findMany({
      where: {
        isPublished: true,
        isSpaceInRound: true,
      },
      orderBy: {
        spaceOrder: 'asc',
      },
      include: {
        country: {
          select: {
            slug: true,
            name: true,
            displayName: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
          take: 1,
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    })

    const data = properties.map((p) => {
      const countrySlug = p.country?.slug || 'dubai'
      const firstService = p.services[0]?.service
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        cardLabel: p.cardLabel || p.name.toUpperCase(),
        tagline: p.tagline,
        shortDescription: p.shortDescription,
        description: p.description,
        type: p.type,
        beds: p.beds,
        baths: p.baths,
        area: p.area,
        price: p.price,
        city: p.cityName || '',
        country: p.country?.displayName || p.country?.name || '',
        locationLine: p.locationLine,
        mainImage: p.mainImage || p.images[0]?.url || '',
        image: p.mainImage || p.images[0]?.url || '',
        mainVideoUrl: p.mainVideoUrl,
        gallery: p.images.map((img) => img.url),
        layoutVariant: p.layoutVariant,
        href: `/properties/${countrySlug}/${p.slug}`,
        services: firstService ? [firstService] : [],
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in /api/public/space-in-round:', error)
    return NextResponse.json({ error: 'Failed to fetch space in round properties' }, { status: 500 })
  }
}
