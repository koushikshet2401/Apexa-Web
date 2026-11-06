import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

/**
 * GET /api/admin/enquiries/[id]/notes
 * Lists all internal administrative notes for the specified enquiry.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_READ)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const enquiry = await db.enquiry.findUnique({ where: { id }, select: { id: true } })
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    const notes = await db.enquiryNote.findMany({
      where: { enquiryId: id },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching enquiry notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

/**
 * POST /api/admin/enquiries/[id]/notes
 * Appends an internal administrative note to the enquiry.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_NOTES)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      select: { id: true, enquiryRef: true },
    })
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    const body = await request.json()
    const { note } = body

    if (!note || typeof note !== 'string' || note.trim().length < 2) {
      return NextResponse.json(
        { error: 'Note text is required (minimum 2 characters).' },
        { status: 400 }
      )
    }

    const createdNote = await db.enquiryNote.create({
      data: {
        enquiryId: enquiry.id,
        authorId: auth.id,
        note: note.trim(),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    })

    // Audit log entry
    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'ENQUIRY_NOTE_ADDED',
      entityType: 'Enquiry',
      entityId: enquiry.id,
      summary: `Internal note added to enquiry ${enquiry.enquiryRef} by ${auth.name || auth.email}`,
      metadata: {
        enquiryId: enquiry.id,
        enquiryRef: enquiry.enquiryRef,
        noteId: createdNote.id,
        notePreview: createdNote.note.substring(0, 100),
      },
    })

    return NextResponse.json(
      {
        ok: true,
        message: 'Internal note added successfully.',
        note: createdNote,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding enquiry note:', error)
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}
