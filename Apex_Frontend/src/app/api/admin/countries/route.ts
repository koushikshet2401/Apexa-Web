import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const countries = await db.country.findMany({
      include: {
        _count: { select: { properties: true } },
      },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json(countries)
  } catch (error) {
    console.error('Error fetching countries:', error)
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const {
      name,
      displayName,
      slug,
      region,
      cities,
      tagline,
      description,
      heroVideoUrl,
      heroVideoThumb,
      cardImage,
      displayOrder,
      isPublished,
    } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Country name is required' }, { status: 400 })
    }

    const cleanSlug = (slug && slug.trim()) || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    const existing = await db.country.findUnique({
      where: { slug: cleanSlug },
    })

    if (existing) {
      return NextResponse.json({ error: `Country with slug "${cleanSlug}" already exists.` }, { status: 400 })
    }

    const country = await db.country.create({
      data: {
        name: name.trim(),
        displayName: displayName ? displayName.trim() : name.trim(),
        slug: cleanSlug,
        region: region ? region.trim() : 'Global',
        cities: cities ? cities.trim() : name.toUpperCase(),
        tagline: tagline || null,
        description: description || null,
        heroVideoUrl: heroVideoUrl || null,
        heroVideoThumb: heroVideoThumb || null,
        cardImage: cardImage || null,
        displayOrder: displayOrder !== undefined && displayOrder !== '' ? parseInt(displayOrder, 10) : 0,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      },
    })

    return NextResponse.json(country, { status: 201 })
  } catch (error) {
    console.error('Error creating country:', error)
    return NextResponse.json({ error: 'Failed to create country' }, { status: 500 })
  }
}
