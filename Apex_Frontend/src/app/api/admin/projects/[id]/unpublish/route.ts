import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { reconcileFeaturedLaunches } from '@/lib/launchesQueue'
import { revalidatePropertyCms } from '@/lib/revalidate'

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
    const project = await db.property.findUnique({
      where: { id },
      include: { country: { select: { slug: true } } },
    })
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

    // If unpublished project was a featured launch, demote and backfill
    let updatedLaunches = null
    if (project.isFeaturedLaunch) {
      updatedLaunches = await reconcileFeaturedLaunches(id, true)
    }

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

    revalidatePropertyCms({
      slug: updated.slug,
      countrySlug: project.country?.slug,
    })

    return NextResponse.json({
      ok: true,
      message: 'Project unpublished and returned to draft.',
      project: updated,
      updatedLaunches,
    })
  } catch (error) {
    console.error('Error unpublishing project:', error)
    return NextResponse.json({ error: 'Failed to unpublish project' }, { status: 500 })
  }
}
