import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, requirePermission } from '@/lib/rbac'
import {
  assertR2Ready,
  deleteR2Object,
  getR2ObjectStream,
  isSafeR2Key,
  MediaStorageError,
  verifyR2ObjectExists,
} from '@/lib/mediaStorage'
import { findMediaAssetReferences, markMediaAssetDeleted } from '@/lib/mediaAssetStore'
import { logAdminActivity } from '@/lib/activityLog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function decodeKeySegments(segments: string[]): string {
  const joined = segments.map((s) => decodeURIComponent(s)).join('/')
  if (!isSafeR2Key(joined)) {
    throw new MediaStorageError('Invalid or unsafe R2 object key', 400, 'INVALID_R2_KEY')
  }
  return joined
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_READ)
  if (auth instanceof Response) return auth

  try {
    assertR2Ready()
    const { key: keySegments } = await context.params
    const r2Key = decodeKeySegments(keySegments)
    const { searchParams } = new URL(request.url)

    if (searchParams.get('stream') === '1') {
      const range = request.headers.get('range')
      const obj = await getR2ObjectStream(r2Key, range)
      const body = obj.Body?.transformToWebStream()
      if (!body) {
        return NextResponse.json({ error: 'Object body unavailable' }, { status: 404 })
      }

      const headers = new Headers()
      headers.set('Content-Type', obj.ContentType || 'application/octet-stream')
      headers.set('Accept-Ranges', 'bytes')
      if (obj.ContentLength !== undefined) headers.set('Content-Length', String(obj.ContentLength))
      if (obj.ContentRange) headers.set('Content-Range', obj.ContentRange)
      if (obj.ETag) headers.set('ETag', obj.ETag)

      return new NextResponse(body, {
        status: range && obj.ContentRange ? 206 : 200,
        headers,
      })
    }

    const head = await verifyR2ObjectExists(r2Key)
    if (!head.exists) {
      return NextResponse.json({ error: 'R2 object not found', key: r2Key }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      storage: 'r2',
      key: r2Key,
      ...head,
    })
  } catch (error) {
    if (error instanceof MediaStorageError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('Error reading media object:', error)
    return NextResponse.json({ error: 'Failed to retrieve R2 media' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_DELETE)
  if (auth instanceof Response) return auth

  try {
    assertR2Ready()
    const { key: keySegments } = await context.params
    const r2Key = decodeKeySegments(keySegments)

    const { searchParams } = new URL(request.url)
    const isForced = searchParams.get('force') === 'true' || searchParams.get('force') === '1'

    if (!isForced) {
      const activeReferences = await findMediaAssetReferences(r2Key)
      if (activeReferences.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete R2 object while it is still referenced (${activeReferences.join(', ')}). Replace or remove the reference first.`,
            references: activeReferences,
            key: r2Key,
          },
          { status: 409 }
        )
      }
    }

    await deleteR2Object(r2Key)
    await markMediaAssetDeleted(r2Key)

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'DELETE',
      entityType: 'MediaAsset',
      entityId: r2Key,
      summary: `Deleted unreferenced R2 media object "${r2Key}"`,
    })

    return NextResponse.json({
      ok: true,
      storage: 'r2',
      key: r2Key,
    })
  } catch (error) {
    if (error instanceof MediaStorageError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('Error deleting media object:', error)
    return NextResponse.json({ error: 'Failed to delete R2 media object' }, { status: 500 })
  }
}
