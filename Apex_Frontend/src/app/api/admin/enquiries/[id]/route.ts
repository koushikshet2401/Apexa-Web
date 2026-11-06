import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

/**
 * GET /api/admin/enquiries/[id]
 * Retrieves comprehensive details for an enquiry, including property context,
 * assignment, conversation history (replies), internal notes, and activity history.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_READ)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            askingPriceNumeric: true,
            askingCurrency: true,
            locationLine: true,
            mainImage: true,
          },
        },
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
        closedBy: {
          select: { id: true, name: true, email: true },
        },
        notes: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        replies: {
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
          orderBy: { sentAt: 'desc' },
        },
      },
    })

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    // Fetch complete audit and activity history for this enquiry
    const activityHistory = await db.adminActivityLog.findMany({
      where: {
        entityType: 'Enquiry',
        entityId: enquiry.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      ...enquiry,
      activityHistory,
    })
  } catch (error) {
    console.error('Error fetching enquiry details:', error)
    return NextResponse.json({ error: 'Failed to fetch enquiry details' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/enquiries/[id]
 * Updates enquiry status, read state, country, or interest details.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_UPDATE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const existing = await db.enquiry.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    const body = await request.json()
    const { status, isRead, country, serviceInterest, subject } = body

    const updateData: any = {}
    let auditAction: string | null = null
    let auditSummary: string | null = null

    // 1. Status update
    if (status !== undefined) {
      const normalizedStatus = String(status).toUpperCase()
      const allowed = ['NEW', 'READ', 'IN_PROGRESS', 'CLOSED']
      if (!allowed.includes(normalizedStatus)) {
        return NextResponse.json(
          { error: `Invalid status "${status}". Allowed statuses: ${allowed.join(', ')}.` },
          { status: 400 }
        )
      }
      updateData.status = normalizedStatus
      if (normalizedStatus === 'READ' && !existing.isRead) {
        updateData.isRead = true
        updateData.readAt = new Date()
      } else if (normalizedStatus === 'NEW') {
        updateData.isRead = false
        updateData.readAt = null
      }

      auditAction = 'ENQUIRY_STATUS_CHANGED'
      auditSummary = `Enquiry ${existing.enquiryRef} status changed from ${existing.status} to ${normalizedStatus}`
    }

    // 2. Explicit Read / Unread toggle
    if (isRead !== undefined) {
      const readBool = Boolean(isRead)
      updateData.isRead = readBool
      updateData.readAt = readBool ? new Date() : null
      if (readBool && existing.status === 'NEW') {
        updateData.status = 'READ'
      } else if (!readBool && existing.status === 'READ') {
        updateData.status = 'NEW'
      }
      if (!auditAction) {
        auditAction = readBool ? 'ENQUIRY_MARKED_READ' : 'ENQUIRY_MARKED_UNREAD'
        auditSummary = `Enquiry ${existing.enquiryRef} marked as ${readBool ? 'Read' : 'Unread'}`
      }
    }

    // 3. Metadata updates
    if (country !== undefined) updateData.country = country ? String(country).trim() : null
    if (serviceInterest !== undefined) updateData.serviceInterest = serviceInterest ? String(serviceInterest).trim() : null
    if (subject !== undefined) updateData.subject = subject ? String(subject).trim() : null

    const updated = await db.enquiry.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } },
        assignedAdmin: { select: { id: true, name: true, email: true } },
      },
    })

    // Log administrative action
    if (auditAction) {
      await logAdminActivity({
        adminId: auth.id,
        adminEmail: auth.email,
        action: auditAction,
        entityType: 'Enquiry',
        entityId: updated.id,
        summary: auditSummary || `Enquiry ${updated.enquiryRef} updated`,
        metadata: {
          previousStatus: existing.status,
          newStatus: updated.status,
          updatedFields: Object.keys(updateData),
        },
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Enquiry updated successfully.',
      enquiry: updated,
    })
  } catch (error) {
    console.error('Error updating enquiry:', error)
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/enquiries/[id]
 * Enforces compliance policy: permanent physical deletion of customer enquiries is prohibited.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_DELETE)
  if (auth instanceof Response) return auth

  // Compliance Policy: Permanent deletion is blocked to protect customer correspondence audit trails
  return NextResponse.json(
    {
      error:
        'Compliance Policy: Permanent deletion of client enquiry records is prohibited. Use the Close endpoint to retire completed enquiries.',
    },
    { status: 403 }
  )
}
