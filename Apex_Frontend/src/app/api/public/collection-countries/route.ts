import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const countries = await db.country.findMany({
      where: { isPublished: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        displayName: true,
        region: true,
        cities: true,
        tagline: true,
        description: true,
        cardImage: true,
        heroVideoUrl: true,
        heroVideoThumb: true,
        displayOrder: true,
      },
    })

    const data = countries.map((c) => ({
      ...c,
      href: `/collection/${c.slug}`,
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in /api/public/collection-countries:', error)
    return NextResponse.json({ error: 'Failed to fetch collection countries' }, { status: 500 })
  }
}
