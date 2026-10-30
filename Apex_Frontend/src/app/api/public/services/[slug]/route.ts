import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const service = await db.serviceCategory.findUnique({
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

    if (!service || !service.isPublished) {
      return NextResponse.json({ error: 'Service category not found' }, { status: 404 })
    }

    const publishedProperties = service.properties
      .map((ps) => ps.property)
      .filter((p) => p && p.isPublished)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        type: p.type,
        beds: p.beds,
        price: p.price,
        city: p.cityName,
        country: p.country?.displayName || p.country?.name || '',
        countrySlug: p.country?.slug || 'dubai',
        image: p.mainImage || p.images[0]?.url || '',
        href: `/properties/${p.country?.slug || 'dubai'}/${p.slug}`,
      }))

    return NextResponse.json({
      ...service,
      properties: publishedProperties,
    })
  } catch (error) {
    console.error('Error in /api/public/services/[slug]:', error)
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 })
  }
}
