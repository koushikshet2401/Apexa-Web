import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

/**
 * POST /api/admin/enquiries/[id]/reopen
 * Reopens a previously closed enquiry, restoring status to IN_PROGRESS.
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

    if (!enquiry.isClosed && enquiry.status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'Enquiry is not closed.' },
        { status: 400 }
      )
    }

    let reason = 'Reopened for client follow-up'
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

    const reopened = await db.$transaction(async (tx) => {
      const updated = await tx.enquiry.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          isClosed: false,
          closedAt: null,
          closedById: null,
        },
        include: {
          assignedAdmin: { select: { id: true, name: true, email: true } },
        },
      })

      if (internalNote) {
        await tx.enquiryNote.create({
          data: {
            enquiryId: updated.id,
            authorId: auth.id,
            note: `[REOPEN NOTE]: ${internalNote}`,
          },
        })
      }

      return updated
    })

    // Audit Log
    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'ENQUIRY_REOPENED',
      entityType: 'Enquiry',
      entityId: reopened.id,
      summary: `Enquiry ${reopened.enquiryRef} reopened by ${auth.name || auth.email}: ${reason}`,
      metadata: {
        enquiryId: reopened.id,
        enquiryRef: reopened.enquiryRef,
        reason,
        hasInternalNote: Boolean(internalNote),
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Enquiry reopened successfully.',
      enquiry: reopened,
    })
  } catch (error) {
    console.error('Error reopening enquiry:', error)
    return NextResponse.json({ error: 'Failed to reopen enquiry' }, { status: 500 })
  }
}
