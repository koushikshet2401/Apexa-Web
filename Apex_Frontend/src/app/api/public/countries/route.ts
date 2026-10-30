import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const countries = await db.country.findMany({
      where: { isPublished: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        properties: {
          where: { isPublished: true },
          select: {
            id: true,
            slug: true,
            name: true,
            type: true,
            cityName: true,
            beds: true,
            price: true,
            mainImage: true,
          },
        },
      },
    })

    return NextResponse.json(countries)
  } catch (error) {
    console.error('Error in /api/public/countries:', error)
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
  }
}
