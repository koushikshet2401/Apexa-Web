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
    const images = await db.propertyImage.findMany({
      where: { propertyId: id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error('Error fetching property images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

export async function POST(
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

    const body = await request.json()
    const { url, alt, order } = body

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const maxOrder = await db.propertyImage.findFirst({
      where: { propertyId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const newOrder = order !== undefined ? Number(order) : (maxOrder ? maxOrder.order + 1 : 0)

    const newImage = await db.propertyImage.create({
      data: {
        propertyId: id,
        url: url.trim(),
        alt: alt ? alt.trim() : property.name,
        order: newOrder,
      },
    })

    return NextResponse.json(newImage, { status: 201 })
  } catch (error) {
    console.error('Error creating property image:', error)
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 })
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
    const { searchParams } = new URL(request.url)
    let imageId = searchParams.get('imageId')

    if (!imageId) {
      try {
        const body = await request.json()
        imageId = body.imageId
      } catch {}
    }

    if (!imageId) {
      return NextResponse.json({ error: 'imageId is required' }, { status: 400 })
    }

    const existing = await db.propertyImage.findFirst({
      where: { id: imageId, propertyId: id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Image not found for this property' }, { status: 404 })
    }

    await db.propertyImage.delete({
      where: { id: imageId },
    })

    return NextResponse.json({ ok: true, message: 'Image deleted' })
  } catch (error) {
    console.error('Error deleting property image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
