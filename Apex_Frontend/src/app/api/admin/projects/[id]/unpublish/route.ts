import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

/**
 * POST /api/admin/projects/[id]/unpublish
 * Transitions project to DRAFT state (isPublished=false, isDraft=true, isPubliclyVisible=false).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_PUBLISH)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const project = await db.property.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.isArchived) {
      return NextResponse.json(
        { error: 'Cannot unpublish an archived project.' },
        { status: 400 }
      )
    }

    const updated = await db.property.update({
      where: { id },
      data: {
        isPublished: false,
        isDraft: true,
        isPubliclyVisible: false,
      },
    })

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'PROJECT_UNPUBLISHED',
      entityType: 'Property',
      entityId: updated.id,
      summary: `Project "${updated.name}" unpublished and returned to draft pipeline`,
      metadata: {
        projectId: updated.id,
        isPublished: false,
        isDraft: true,
        isPubliclyVisible: false,
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Project unpublished and returned to draft.',
      project: updated,
    })
  } catch (error) {
    console.error('Error unpublishing project:', error)
    return NextResponse.json({ error: 'Failed to unpublish project' }, { status: 500 })
  }
}
