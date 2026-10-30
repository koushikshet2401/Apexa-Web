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
    const country = await db.country.findUnique({
      where: { id },
      include: {
        properties: {
          select: { id: true, name: true, slug: true, isPublished: true },
        },
      },
    })

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    return NextResponse.json(country)
  } catch (error) {
    console.error('Error fetching country:', error)
    return NextResponse.json({ error: 'Failed to fetch country' }, { status: 500 })
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
    const existing = await db.country.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

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

    let newSlug = existing.slug
    if (slug && slug.trim() !== existing.slug) {
      newSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      const duplicate = await db.country.findUnique({
        where: { slug: newSlug },
      })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: `Slug "${newSlug}" is already in use.` }, { status: 400 })
      }
    }

    const updated = await db.country.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(displayName !== undefined && { displayName: displayName.trim() }),
        ...(slug !== undefined && { slug: newSlug }),
        ...(region !== undefined && { region: region.trim() }),
        ...(cities !== undefined && { cities: cities.trim() }),
        ...(tagline !== undefined && { tagline: tagline || null }),
        ...(description !== undefined && { description: description || null }),
        ...(heroVideoUrl !== undefined && { heroVideoUrl: heroVideoUrl || null }),
        ...(heroVideoThumb !== undefined && { heroVideoThumb: heroVideoThumb || null }),
        ...(cardImage !== undefined && { cardImage: cardImage || null }),
        ...(displayOrder !== undefined && {
          displayOrder: displayOrder !== '' ? parseInt(displayOrder, 10) : 0,
        }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating country:', error)
    return NextResponse.json({ error: 'Failed to update country' }, { status: 500 })
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
    const propertyCount = await db.property.count({
      where: { countryId: id },
    })

    if (propertyCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete country: it still has ${propertyCount} assigned properties. Reassign or delete those properties first.` },
        { status: 400 }
      )
    }

    await db.country.delete({ where: { id } })
    return NextResponse.json({ ok: true, message: 'Country deleted' })
  } catch (error) {
    console.error('Error deleting country:', error)
    return NextResponse.json({ error: 'Failed to delete country' }, { status: 500 })
  }
}
