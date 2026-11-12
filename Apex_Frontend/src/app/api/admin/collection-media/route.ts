import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { PERMISSIONS, requireAnyPermission } from '@/lib/rbac'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'
import { logAdminActivity } from '@/lib/activityLog'

export const dynamic = 'force-dynamic'

function sanitizeMediaUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  return trimmed ? trimmed : null
}

export async function GET(request: NextRequest) {
  const auth = await requireAnyPermission(request, [
    PERMISSIONS.COLLECTION_MEDIA_READ,
    PERMISSIONS.CONTENT_READ,
  ])
  if (auth instanceof Response) return auth

  try {
    let migrationPending = false
    let countries: any[] = []
    const homepage = await db.homepageContent
      .findFirst({ select: { advisoryVideoUrl: true } })
      .catch(() => null)

    try {
      countries = await db.country.findMany({
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          collectionMedia: true,
          _count: {
            select: { properties: true },
          },
        },
      })
    } catch (err) {
      if (isMissingCmsExtensionError(err)) {
        migrationPending = true
        countries = await db.country.findMany({
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: { properties: true },
            },
          },
        })
      } else {
        throw err
      }
    }

    const items = countries.map((country) => ({
      countryId: country.id,
      slug: country.slug,
      name: country.name,
      displayName: country.displayName,
      region: country.region,
      isPublished: country.isPublished,
      displayOrder: country.displayOrder,
      propertyCount: country._count?.properties ?? 0,
      coverImageUrl: country.collectionMedia?.coverImageUrl ?? country.cardImage ?? country.heroVideoThumb ?? null,
      coverImageMediaAssetId: country.collectionMedia?.coverImageMediaAssetId ?? null,
      heroVideoUrl: country.collectionMedia?.heroVideoUrl ?? country.heroVideoUrl ?? null,
      heroVideoMediaAssetId: country.collectionMedia?.heroVideoMediaAssetId ?? null,
      updatedBy: country.collectionMedia?.updatedBy ?? null,
      updatedAt: country.collectionMedia?.updatedAt ?? country.updatedAt,
    }))

    return NextResponse.json({
      migrationPending,
      advisoryVideoUrl: homepage?.advisoryVideoUrl ?? null,
      countries: items,
    })
  } catch (error) {
    console.error('Error fetching Collection Media:', error)
    return NextResponse.json({ error: 'Failed to load Collection Media' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAnyPermission(request, [
    PERMISSIONS.COLLECTION_MEDIA_UPDATE,
    PERMISSIONS.CONTENT_UPDATE,
  ])
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const advisoryVideoUrl = sanitizeMediaUrl(body.advisoryVideoUrl)

    if (typeof advisoryVideoUrl === 'string' && advisoryVideoUrl.startsWith('/uploads/')) {
      return NextResponse.json(
        { error: 'Local /uploads/ storage is disabled. Upload video to Cloudflare R2.' },
        { status: 400 }
      )
    }

    let content = await db.homepageContent.findFirst()
    if (!content) {
      content = await db.homepageContent.create({
        data: {
          advisoryVideoUrl: advisoryVideoUrl ?? null,
        },
      })
    } else {
      content = await db.homepageContent.update({
        where: { id: content.id },
        data: {
          ...(advisoryVideoUrl !== undefined && { advisoryVideoUrl }),
        },
      })
    }

    try {
      revalidatePath('/')
      revalidatePath('/contact')
      revalidatePath('/api/public/homepage')
      revalidatePath('/admin/collection-media')
      revalidatePath('/admin/homepage')
    } catch (revalidateErr) {
      console.warn('Collection & Contact Video revalidation warning:', revalidateErr)
    }

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'UPDATE',
      entityType: 'HomepageContent',
      entityId: content.id,
      summary: 'Updated Speak With Us / Private Advisory contact background video',
      metadata: {
        advisoryVideoUrl: content.advisoryVideoUrl,
      },
    })

    return NextResponse.json({
      advisoryVideoUrl: content.advisoryVideoUrl ?? null,
      updatedAt: content.updatedAt,
    })
  } catch (error) {
    console.error('Error updating Speak With Us / Contact video:', error)
    return NextResponse.json(
      { error: 'Failed to save Speak With Us / Contact video' },
      { status: 500 }
    )
  }
}
