import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

/**
 * POST /api/admin/enquiries/[id]/assign
 * Assigns or unassigns an enquiry to a designated administrative advisor.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_ASSIGN)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: {
        assignedAdmin: { select: { id: true, name: true, email: true } },
      },
    })

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    const body = await request.json()
    const assignedAdminId = body.assignedAdminId || body.adminId

    let newAdmin: { id: string; name: string | null; email: string } | null = null

    // If an admin ID is provided, verify existence and active status
    if (assignedAdminId) {
      const targetUser = await db.adminUser.findUnique({
        where: { id: assignedAdminId },
        select: { id: true, name: true, email: true, isActive: true },
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: `Administrator with ID "${assignedAdminId}" does not exist.` },
          { status: 404 }
        )
      }

      if (!targetUser.isActive) {
        return NextResponse.json(
          { error: `Cannot assign enquiry to inactive administrator "${targetUser.name || targetUser.email}".` },
          { status: 400 }
        )
      }

      newAdmin = targetUser
    }

    const previousAdminName = enquiry.assignedAdmin
      ? enquiry.assignedAdmin.name || enquiry.assignedAdmin.email
      : 'Unassigned'
    const newAdminName = newAdmin ? newAdmin.name || newAdmin.email : 'Unassigned'

    const updated = await db.enquiry.update({
      where: { id },
      data: {
        assignedAdminId: newAdmin ? newAdmin.id : null,
      },
      include: {
        assignedAdmin: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true } },
      },
    })

    // Audit Log
    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'ENQUIRY_ASSIGNED',
      entityType: 'Enquiry',
      entityId: updated.id,
      summary: `Enquiry ${updated.enquiryRef} assignment changed from [${previousAdminName}] to [${newAdminName}]`,
      metadata: {
        enquiryId: updated.id,
        enquiryRef: updated.enquiryRef,
        previousAdminId: enquiry.assignedAdminId,
        newAdminId: newAdmin ? newAdmin.id : null,
        newAdminEmail: newAdmin ? newAdmin.email : null,
      },
    })

    return NextResponse.json({
      ok: true,
      message: `Enquiry successfully assigned to ${newAdminName}.`,
      enquiry: updated,
    })
  } catch (error) {
    console.error('Error assigning enquiry:', error)
    return NextResponse.json({ error: 'Failed to assign enquiry' }, { status: 500 })
  }
}
