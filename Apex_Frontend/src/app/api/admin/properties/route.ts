import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'all', 'published', 'draft'

    const where: any = {}
    if (status === 'published') {
      where.isPublished = true
    } else if (status === 'draft') {
      where.isDraft = true
    }

    const properties = await db.property.findMany({
      where,
      include: {
        country: {
          select: { id: true, name: true, displayName: true, slug: true },
        },
        services: {
          include: {
            service: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: {
          select: { images: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Error listing properties:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const {
      name,
      slug,
      countryId,
      cardLabel,
      tagline,
      shortDescription,
      description,
      type,
      beds,
      baths,
      area,
      price,
      cityName,
      locationLine,
      mainVideoUrl,
      mainVideoThumb,
      mainImage,
      highlights,
      layoutVariant,
      isPublished,
      isDraft,
      isFeaturedLaunch,
      launchOrder,
      launchDate,
      isSpaceInRound,
      spaceOrder,
      serviceIds,
    } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Property name is required' }, { status: 400 })
    }

    const generatedSlug = (slug && slug.trim()) || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    const existing = await db.property.findUnique({
      where: { slug: generatedSlug },
    })

    if (existing) {
      return NextResponse.json({ error: `Slug "${generatedSlug}" is already in use.` }, { status: 400 })
    }

    const property = await db.property.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        countryId: countryId || null,
        cardLabel: cardLabel || null,
        tagline: tagline || null,
        shortDescription: shortDescription || null,
        description: description || null,
        type: type || 'residential',
        beds: beds || null,
        baths: baths || null,
        area: area || null,
        price: price || null,
        cityName: cityName || null,
        locationLine: locationLine || null,
        mainVideoUrl: mainVideoUrl || null,
        mainVideoThumb: mainVideoThumb || null,
        mainImage: mainImage || null,
        highlights: Array.isArray(highlights) ? highlights : [],
        layoutVariant: typeof layoutVariant === 'number' ? layoutVariant : parseInt(layoutVariant || '1', 10),
        isPublished: Boolean(isPublished),
        isDraft: isDraft !== undefined ? Boolean(isDraft) : !Boolean(isPublished),
        isFeaturedLaunch: Boolean(isFeaturedLaunch),
        launchOrder: launchOrder !== null && launchOrder !== undefined && launchOrder !== '' ? parseInt(launchOrder, 10) : null,
        launchDate: launchDate ? new Date(launchDate) : null,
        isSpaceInRound: Boolean(isSpaceInRound),
        spaceOrder: spaceOrder !== null && spaceOrder !== undefined && spaceOrder !== '' ? parseInt(spaceOrder, 10) : null,
        services: Array.isArray(serviceIds) && serviceIds.length > 0
          ? {
              create: serviceIds.map((sid: string) => ({
                service: { connect: { id: sid } },
              })),
            }
          : undefined,
      },
      include: {
        country: true,
        services: { include: { service: true } },
      },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}
