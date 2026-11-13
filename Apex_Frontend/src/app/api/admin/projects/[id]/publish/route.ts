import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { revalidatePropertyCms } from '@/lib/revalidate'

/**
 * POST /api/admin/projects/[id]/publish
 * Transitions project to PUBLISHED state (isPublished=true, isDraft=false, isPubliclyVisible=true).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_PUBLISH)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const project = await db.property.findUnique({
      where: { id },
      include: { country: { select: { slug: true } } },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.isArchived) {
      return NextResponse.json(
        { error: 'Cannot publish an archived project. Restore it first.' },
        { status: 400 }
      )
    }

    const updated = await db.property.update({
      where: { id },
      data: {
        isPublished: true,
        isDraft: false,
        isPubliclyVisible: true,
      },
    })

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'PROJECT_PUBLISHED',
      entityType: 'Property',
      entityId: updated.id,
      summary: `Project "${updated.name}" published to live customer showcase`,
      metadata: {
        projectId: updated.id,
        isPublished: true,
        isDraft: false,
        isPubliclyVisible: true,
      },
    })

    revalidatePropertyCms({
      slug: updated.slug,
      countrySlug: project.country?.slug,
    })

    return NextResponse.json({
      ok: true,
      message: 'Project published successfully.',
      project: updated,
    })
  } catch (error) {
    console.error('Error publishing project:', error)
    return NextResponse.json({ error: 'Failed to publish project' }, { status: 500 })
  }
}
