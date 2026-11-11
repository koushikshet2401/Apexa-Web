import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

/**
 * POST /api/admin/enquiries/[id]/close
 * Closes an enquiry, recording closure timestamp, closing administrator, and optional reason.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_CLOSE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      select: { id: true, enquiryRef: true, status: true, isClosed: true },
    })

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    if (enquiry.isClosed) {
      return NextResponse.json(
        { ok: true, message: 'Enquiry is already closed.', enquiry },
        { status: 200 }
      )
    }

    let reason = 'Administrative closure'
    let internalNote: string | null = null
    try {
      const body = await request.json()
      if (body?.reason && typeof body.reason === 'string') {
        reason = body.reason.trim()
      }
      if (body?.note && typeof body.note === 'string') {
        internalNote = body.note.trim()
      }
    } catch {
      // Empty body is acceptable
    }

    const closed = await db.$transaction(async (tx) => {
      const updated = await tx.enquiry.update({
        where: { id },
        data: {
          status: 'CLOSED',
          isClosed: true,
          closedAt: new Date(),
          closedById: auth.id,
        },
        include: {
          closedBy: { select: { id: true, name: true, email: true } },
          assignedAdmin: { select: { id: true, name: true, email: true } },
        },
      })

      if (internalNote) {
        await tx.enquiryNote.create({
          data: {
            enquiryId: updated.id,
            authorId: auth.id,
            note: `[CLOSURE NOTE]: ${internalNote}`,
          },
        })
      }

      return updated
    })

    // Audit Log
    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'ENQUIRY_CLOSED',
      entityType: 'Enquiry',
      entityId: closed.id,
      summary: `Enquiry ${closed.enquiryRef} closed by ${auth.name || auth.email}: ${reason}`,
      metadata: {
        enquiryId: closed.id,
        enquiryRef: closed.enquiryRef,
        reason,
        closedAt: closed.closedAt?.toISOString(),
        hasInternalNote: Boolean(internalNote),
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Enquiry closed successfully.',
      enquiry: closed,
    })
  } catch (error) {
    console.error('Error closing enquiry:', error)
    return NextResponse.json({ error: 'Failed to close enquiry' }, { status: 500 })
  }
}
