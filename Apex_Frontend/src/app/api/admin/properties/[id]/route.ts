import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const property = await db.property.findUnique({
      where: { id },
      include: {
        country: true,
        images: { orderBy: { order: 'asc' } },
        services: {
          include: { service: true },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const existing = await db.property.findUnique({
      where: { id },
      include: { services: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

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

    let newSlug = existing.slug
    if (slug && slug.trim() !== existing.slug) {
      newSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      const duplicate = await db.property.findUnique({
        where: { slug: newSlug },
      })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { error: `Slug "${newSlug}" is already taken by another property.` },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      ...(name !== undefined && { name: name.trim() }),
      ...(slug !== undefined && { slug: newSlug }),
      ...(countryId !== undefined && { countryId: countryId || null }),
      ...(cardLabel !== undefined && { cardLabel: cardLabel || null }),
      ...(tagline !== undefined && { tagline: tagline || null }),
      ...(shortDescription !== undefined && { shortDescription: shortDescription || null }),
      ...(description !== undefined && { description: description || null }),
      ...(type !== undefined && { type }),
      ...(beds !== undefined && { beds: beds || null }),
      ...(baths !== undefined && { baths: baths || null }),
      ...(area !== undefined && { area: area || null }),
      ...(price !== undefined && { price: price || null }),
      ...(cityName !== undefined && { cityName: cityName || null }),
      ...(locationLine !== undefined && { locationLine: locationLine || null }),
      ...(mainVideoUrl !== undefined && { mainVideoUrl: mainVideoUrl || null }),
      ...(mainVideoThumb !== undefined && { mainVideoThumb: mainVideoThumb || null }),
      ...(mainImage !== undefined && { mainImage: mainImage || null }),
      ...(highlights !== undefined && {
        highlights: Array.isArray(highlights) ? highlights : [],
      }),
      ...(layoutVariant !== undefined && {
        layoutVariant: typeof layoutVariant === 'number' ? layoutVariant : parseInt(layoutVariant || '1', 10),
      }),
      ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      ...(isDraft !== undefined && { isDraft: Boolean(isDraft) }),
      ...(isFeaturedLaunch !== undefined && { isFeaturedLaunch: Boolean(isFeaturedLaunch) }),
      ...(launchOrder !== undefined && {
        launchOrder: launchOrder !== null && launchOrder !== '' ? parseInt(launchOrder, 10) : null,
      }),
      ...(launchDate !== undefined && {
        launchDate: launchDate ? new Date(launchDate) : null,
      }),
      ...(isSpaceInRound !== undefined && { isSpaceInRound: Boolean(isSpaceInRound) }),
      ...(spaceOrder !== undefined && {
        spaceOrder: spaceOrder !== null && spaceOrder !== '' ? parseInt(spaceOrder, 10) : null,
      }),
    }

    // Auto synchronize isDraft when isPublished toggled if isDraft not explicitly provided
    if (isPublished !== undefined && isDraft === undefined) {
      updateData.isDraft = !isPublished
    }

    // Reconcile services if provided
    if (Array.isArray(serviceIds)) {
      await db.propertyService.deleteMany({
        where: { propertyId: id },
      })
      if (serviceIds.length > 0) {
        await db.propertyService.createMany({
          data: serviceIds.map((sid: string) => ({
            propertyId: id,
            serviceId: sid,
          })),
        })
      }
    }

    const updated = await db.property.update({
      where: { id },
      data: updateData,
      include: {
        country: true,
        images: { orderBy: { order: 'asc' } },
        services: { include: { service: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const property = await db.property.findUnique({ where: { id } })
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Delete property (cascades to images and propertyServices)
    await db.property.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true, message: 'Property deleted successfully' })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
