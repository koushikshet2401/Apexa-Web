import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const properties = await db.property.findMany({
      where: {
        isPublished: true,
        isFeaturedLaunch: true,
      },
      orderBy: [
        { launchOrder: 'asc' },
        { launchDate: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 3,
      include: {
        country: {
          select: {
            slug: true,
            name: true,
            displayName: true,
          },
        },
      },
    })

    const data = properties.map((p, index) => {
      const countrySlug = p.country?.slug || 'dubai'
      return {
        id: p.id,
        number: `0${index + 1}`,
        tag: `FEATURED LAUNCH · 0${index + 1} OF 0${properties.length}`,
        slug: p.slug,
        title: p.name,
        name: p.name,
        location: p.locationLine || p.cityName || 'INTERNATIONAL',
        type: p.type || 'Residence',
        beds: p.beds || 'Bespoke',
        price: p.price || 'Price on Application',
        videoSrc: p.mainVideoUrl || '/videos/luxury-palm-beach.mp4',
        mainVideoUrl: p.mainVideoUrl || '/videos/luxury-palm-beach.mp4',
        mainImage: p.mainImage || '',
        href: `/properties/${countrySlug}/${p.slug}`,
        country: p.country,
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in /api/public/launches:', error)
    return NextResponse.json({ error: 'Failed to fetch launches' }, { status: 500 })
  }
}
