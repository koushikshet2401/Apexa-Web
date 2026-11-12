import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, requirePermission } from '@/lib/rbac'
import { db } from '@/lib/db'
import { assertR2Ready, listR2Objects, MediaStorageError } from '@/lib/mediaStorage'
import { isMissingMediaAssetTableError } from '@/lib/mediaAssetStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_READ)
  if (auth instanceof Response) return auth

  try {
    assertR2Ready()

    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') || undefined

    const r2Objects = await listR2Objects(prefix)

    let dbMetaByKey = new Map<
      string,
      {
        id: string
        propertyId: string | null
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

    const items = r2Objects.map((obj) => {
      const meta = dbMetaByKey.get(obj.key)
      return {
        key: obj.key,
        r2Key: obj.key,
        url: obj.publicUrl,
        size: obj.size,
        lastModified: obj.lastModified,
        mediaId: meta?.id || null,
        propertyId: meta?.propertyId || null,
        mediaRole: meta?.mediaRole || null,
        originalFilename: meta?.originalFilename || obj.key.split('/').pop() || obj.key,
        mimeType: meta?.mimeType || null,
        description: meta?.description || null,
        storage: 'r2',
      }
    })

    return NextResponse.json({
      items,
      storage: 'r2',
      count: items.length,
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
