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
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: {
        property: true,
      },
    })

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    return NextResponse.json(enquiry)
  } catch (error) {
    console.error('Error fetching enquiry:', error)
    return NextResponse.json({ error: 'Failed to fetch enquiry' }, { status: 500 })
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
    const body = await request.json()
    const { status } = body

    if (!status || !['new', 'read', 'replied'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (new, read, replied)' },
        { status: 400 }
      )
    }

    const updated = await db.enquiry.update({
      where: { id },
      data: { status },
      include: { property: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating enquiry:', error)
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 })
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
    await db.enquiry.delete({ where: { id } })
    return NextResponse.json({ ok: true, message: 'Enquiry deleted' })
  } catch (error) {
    console.error('Error deleting enquiry:', error)
    return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 })
  }
}
