import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ country: string; slug: string }> }
) {
  try {
    const { country, slug } = await params

    const property = await db.property.findFirst({
      where: {
        slug,
        isPublished: true,
        OR: [
          { country: { slug: country } },
          { countryId: null },
        ],
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        country: true,
        services: {
          include: { service: true },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const data = {
      ...property,
      countryName: property.country?.displayName || property.country?.name || country.toUpperCase(),
      image: property.mainImage || property.images[0]?.url || '',
      gallery: property.images.map((img) => img.url),
      services: property.services.map((ps) => ps.service),
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in /api/public/properties/[country]/[slug]:', error)
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 })
  }
}
