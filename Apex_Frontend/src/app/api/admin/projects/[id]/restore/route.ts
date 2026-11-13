import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { revalidatePropertyCms } from '@/lib/revalidate'

/**
 * POST /api/admin/projects/[id]/restore
 * Restores an archived project back to DRAFT state for review before republishing.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_UPDATE)
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

    if (!project.isArchived) {
      return NextResponse.json({ error: 'Project is not archived.' }, { status: 400 })
    }

    const restored = await db.property.update({
      where: { id },
      data: {
        isArchived: false,
        isDraft: false,
        isPublished: true,
        isPubliclyVisible: true,
        restoredAt: new Date(),
        restoredById: auth.id,
      },
    })

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'PROJECT_RESTORED',
      entityType: 'Property',
      entityId: restored.id,
      summary: `Project "${restored.name}" restored from Deleted Projects to active published portfolio`,
      metadata: {
        projectId: restored.id,
        restoredAt: restored.restoredAt?.toISOString(),
        isDraft: false,
        isPublished: true,
        isArchived: false,
      },
    })

    revalidatePropertyCms({
      slug: restored.slug,
      countrySlug: project.country?.slug,
    })

    return NextResponse.json({
      ok: true,
      message: 'Project restored and published successfully.',
      project: restored,
    })
  } catch (error) {
    console.error('Error restoring project:', error)
    return NextResponse.json({ error: 'Failed to restore project' }, { status: 500 })
  }
}
