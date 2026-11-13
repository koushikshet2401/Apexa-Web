import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { revalidateHomepageCms } from '@/lib/revalidate'

const HOMEPAGE_TEXT_FIELDS = [
  'unveilLabel',
  'unveilHeading',
  'unveilSubtext',
  'collectionEyebrow',
  'collectionHeading',
  'collectionDescription',
  'spacesHeading',
  'spacesDescription',
  'advisoryEyebrow',
  'advisoryHeading',
  'advisoryDescription',
  'advisoryFooterNote',
  'contactEyebrow',
  'contactHeading',
  'contactDescription',
  'contactPhone',
  'contactEmail',
  'contactOfficeAddress',
  'contactWhatsappNumber',
  'contactFormHeading',
  'contactFormSubtext',
  'contactSuccessHeading',
  'contactSuccessSubtext',
] as const

const HOMEPAGE_MEDIA_FIELDS = [
  'heroVideoUrl',
  'heroVideoThumb',
  'oneTeamVideoUrl',
  'advisoryVideoUrl',
] as const

function cleanOptionalString(val: unknown): string | null | undefined {
  if (val === undefined) return undefined
  if (val === null) return null
  const trimmed = String(val).trim()
  return trimmed ? trimmed : null
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.CONTENT_READ)
  if (auth instanceof Response) return auth

  try {
    let content: any = null
    try {
      content = await db.homepageContent.findFirst()
    } catch (err) {
      if (isMissingCmsExtensionError(err)) {
        const rows = await db.$queryRawUnsafe<any[]>('SELECT * FROM "HomepageContent" LIMIT 1')
        content = rows?.[0] || null
      } else {
        throw err
      }
    }

    if (!content) {
      try {
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
      } catch {
        content = { id: 'fallback', heroVideoUrl: null, heroVideoThumb: null }
      }
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
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const patchData: Record<string, string | null> = {}

    for (const field of HOMEPAGE_MEDIA_FIELDS) {
      if (field in body) {
        const cleaned = cleanOptionalString(body[field])
        if (cleaned !== undefined) {
          if (cleaned && cleaned.startsWith('/uploads/')) {
            return NextResponse.json(
              { error: 'Local /uploads/ storage is disabled. Upload homepage media to Cloudflare R2.' },
              { status: 400 }
            )
          }
          patchData[field] = cleaned
        }
      }
    }

    for (const field of HOMEPAGE_TEXT_FIELDS) {
      if (field in body) {
        const cleaned = cleanOptionalString(body[field])
        if (cleaned !== undefined) {
          if (field === 'contactEmail' && cleaned && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
            return NextResponse.json({ error: 'Invalid contact email format.' }, { status: 400 })
          }
          patchData[field] = cleaned
        }
      }
    }

    let content = await db.homepageContent.findFirst()
    if (!content) {
      content = await db.homepageContent.create({
        data: patchData,
      })
    } else {
      content = await db.homepageContent.update({
        where: { id: content.id },
        data: patchData,
      })
    }

    revalidateHomepageCms()

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'UPDATE',
      entityType: 'HomepageContent',
      entityId: content.id,
      summary: 'Updated homepage media & copy configuration',
      metadata: {
        updatedFields: Object.keys(patchData),
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
