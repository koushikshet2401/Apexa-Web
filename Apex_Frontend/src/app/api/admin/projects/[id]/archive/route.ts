import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { reconcileFeaturedLaunches } from '@/lib/launchesQueue'

/**
 * POST /api/admin/projects/[id]/archive
 * Explicit non-destructive archive endpoint.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_DELETE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const project = await db.property.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.isArchived) {
      return NextResponse.json({ error: 'Project is already archived.' }, { status: 400 })
    }

    let reason = 'Administrative archive'
    try {
      const body = await request.json()
      if (body?.reason && typeof body.reason === 'string') {
        reason = body.reason.trim()
      }
    } catch {
      // Body optional
    }

    const archived = await db.property.update({
      where: { id },
      data: {
        isArchived: true,
        isPublished: false,
        isPubliclyVisible: false,
        archivedAt: new Date(),
        archivedById: auth.id,
        archivedReason: reason,
      },
    })

    // Reconcile featured launches queue: if this archived project was featured, promote last-in project to fill slot
    const updatedLaunches = await reconcileFeaturedLaunches(id, true)

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'PROJECT_ARCHIVED',
      entityType: 'Property',
      entityId: archived.id,
      summary: `Project "${archived.name}" moved to Deleted Projects archive: ${reason}`,
      metadata: {
        projectId: archived.id,
        reason,
        archivedAt: archived.archivedAt?.toISOString(),
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Project safely archived to Deleted Projects section.',
      project: archived,
      updatedLaunches,
    })
  } catch (error) {
    console.error('Error archiving project:', error)
    return NextResponse.json({ error: 'Failed to archive project' }, { status: 500 })
  }
}
