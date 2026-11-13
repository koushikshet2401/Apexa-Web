import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, requirePermission } from '@/lib/rbac'
import { db } from '@/lib/db'
import {
  ALLOWED_MEDIA_FOLDERS,
  assertR2Ready,
  getNormalizedExtension,
  isSafeR2Key,
  isVideoExtension,
  listR2Objects,
  MediaStorageError,
  resolveCanonicalMimeType,
} from '@/lib/mediaStorage'
import { isMissingMediaAssetTableError } from '@/lib/mediaAssetStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function resolveListingPrefix(rawFolder: string | null, rawPrefix: string | null): string | undefined {
  const candidate = (rawPrefix ?? rawFolder ?? '').trim()
  if (!candidate || candidate.toLowerCase() === 'all') {
    return undefined
  }

  const normalized = candidate.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!normalized || normalized.includes('..') || normalized.includes('\\') || /[\0\r\n]/.test(normalized)) {
    throw new MediaStorageError('Invalid or unsafe media folder prefix.', 400, 'INVALID_PREFIX')
  }

  const topSegment = normalized.split('/')[0]
  if (!(ALLOWED_MEDIA_FOLDERS as readonly string[]).includes(topSegment)) {
    throw new MediaStorageError(
      `Unsupported folder prefix "${topSegment}". Allowed folders: ${ALLOWED_MEDIA_FOLDERS.join(', ')}`,
      400,
      'DISALLOWED_PREFIX'
    )
  }

  return normalized.includes('/') ? normalized : `${topSegment}/`
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_READ)
  if (auth instanceof Response) return auth

  try {
    assertR2Ready()

    const { searchParams } = new URL(request.url)
    const effectivePrefix = resolveListingPrefix(
      searchParams.get('folder'),
      searchParams.get('prefix')
    )
    const typeFilter = (searchParams.get('type') || '').toLowerCase().trim()
    const searchQuery = (searchParams.get('search') || '').toLowerCase().trim()

    const r2Objects = await listR2Objects(effectivePrefix)

    const dbMetaByKey = new Map<
      string,
      {
        id: string
        propertyId: string | null
        mediaType: string
        mediaRole: string
        originalFilename: string
        mimeType: string
        description: string | null
        displayOrder: number
      }
    >()

    try {
      const assets = await db.mediaAsset.findMany({
        select: {
          id: true,
          propertyId: true,
          mediaType: true,
          mediaRole: true,
          originalFilename: true,
          mimeType: true,
          description: true,
          displayOrder: true,
          r2Key: true,
        },
      })
      for (const a of assets) {
        dbMetaByKey.set(a.r2Key, a)
      }
    } catch (err) {
      if (!isMissingMediaAssetTableError(err)) {
        throw err
      }
    }

    const items = r2Objects
      .filter((obj) => isSafeR2Key(obj.key))
      .map((obj) => {
        const meta = dbMetaByKey.get(obj.key)
        const ext = getNormalizedExtension(obj.key)
        const contentType = meta?.mimeType || resolveCanonicalMimeType(ext, null)
        const isVideo =
          meta?.mediaType === 'VIDEO' ||
          contentType.startsWith('video/') ||
          isVideoExtension(ext)
        const mediaCategory: 'image' | 'video' = isVideo ? 'video' : 'image'
        const mediaType = isVideo ? 'VIDEO' : 'IMAGE'
        const filename = meta?.originalFilename || obj.key.split('/').pop() || obj.key
        const folder = obj.key.split('/')[0] || 'general'

        return {
          key: obj.key,
          r2Key: obj.key,
          url: obj.publicUrl,
          filename,
          folder,
          size: obj.size,
          lastModified: obj.lastModified ? obj.lastModified.toISOString() : null,
          mediaId: meta?.id || null,
          propertyId: meta?.propertyId || null,
          mediaRole: meta?.mediaRole || null,
          mediaType,
          mediaCategory,
          contentType,
          mimeType: contentType,
          originalFilename: filename,
          description: meta?.description || null,
          tracked: Boolean(meta),
          storage: 'r2' as const,
        }
      })
      .filter((item) => {
        if (typeFilter === 'image' && item.mediaCategory !== 'image') return false
        if (typeFilter === 'video' && item.mediaCategory !== 'video') return false
        if (searchQuery) {
          const haystack = `${item.filename} ${item.key} ${item.contentType} ${item.mediaRole || ''}`.toLowerCase()
          if (!haystack.includes(searchQuery)) return false
        }
        return true
      })

    return NextResponse.json({
      items,
      storage: 'r2',
      count: items.length,
      prefix: effectivePrefix || null,
    })
  } catch (error) {
    if (error instanceof MediaStorageError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }
    console.error('Error listing media:', error)
    return NextResponse.json({ error: 'Failed to list R2 media objects' }, { status: 500 })
  }
}
