import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.CONTENT_READ)
  if (auth instanceof Response) return auth

  try {
    let content = await db.homepageContent.findFirst()
    if (!content) {
      content = await db.homepageContent.create({
        data: {
          heroVideoUrl: null,
          heroVideoThumb: null,
          unveilHeading: null,
          unveilSubtext: null,
          oneTeamVideoUrl: null,
          advisoryVideoUrl: null,
        },
      })
    }
    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching homepage content:', error)
    return NextResponse.json({ error: 'Failed to fetch homepage content' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.CONTENT_UPDATE)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const {
      heroVideoUrl,
      heroVideoThumb,
      unveilHeading,
      unveilSubtext,
      oneTeamVideoUrl,
      advisoryVideoUrl,
    } = body

    const mediaUrls = [heroVideoUrl, heroVideoThumb, oneTeamVideoUrl, advisoryVideoUrl]
    if (mediaUrls.some((u) => typeof u === 'string' && u.trim().startsWith('/uploads/'))) {
      return NextResponse.json(
        { error: 'Local /uploads/ storage is disabled. Upload homepage media to Cloudflare R2.' },
        { status: 400 }
      )
    }

    let content = await db.homepageContent.findFirst()
    if (!content) {
      content = await db.homepageContent.create({
        data: {
          heroVideoUrl: heroVideoUrl || null,
          heroVideoThumb: heroVideoThumb || null,
          unveilHeading: unveilHeading || null,
          unveilSubtext: unveilSubtext || null,
          oneTeamVideoUrl: oneTeamVideoUrl || null,
          advisoryVideoUrl: advisoryVideoUrl || null,
        },
      })
    } else {
      content = await db.homepageContent.update({
        where: { id: content.id },
        data: {
          ...(heroVideoUrl !== undefined && { heroVideoUrl: heroVideoUrl || null }),
          ...(heroVideoThumb !== undefined && { heroVideoThumb: heroVideoThumb || null }),
          ...(unveilHeading !== undefined && { unveilHeading: unveilHeading || null }),
          ...(unveilSubtext !== undefined && { unveilSubtext: unveilSubtext || null }),
          ...(oneTeamVideoUrl !== undefined && { oneTeamVideoUrl: oneTeamVideoUrl || null }),
          ...(advisoryVideoUrl !== undefined && { advisoryVideoUrl: advisoryVideoUrl || null }),
        },
      })
    }

    try {
      revalidatePath('/')
      revalidatePath('/contact')
      revalidatePath('/admin/homepage-video')
      revalidatePath('/admin/homepage')
      revalidatePath('/admin/one-team')
    } catch (revalidateErr) {
      console.warn('Revalidation warning:', revalidateErr)
    }

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'UPDATE',
      entityType: 'HomepageContent',
      entityId: content.id,
      summary: 'Updated homepage media & copy configuration',
      metadata: {
        heroVideoUrl: content.heroVideoUrl,
        oneTeamVideoUrl: content.oneTeamVideoUrl,
        advisoryVideoUrl: content.advisoryVideoUrl,
      },
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error updating homepage content:', error)
    return NextResponse.json({ error: 'Failed to update homepage content' }, { status: 500 })
  }
}
