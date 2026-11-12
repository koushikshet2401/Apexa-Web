import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, requirePermission } from '@/lib/rbac'
import {
  ALLOWED_MEDIA_FOLDERS,
  assertR2Ready,
  buildPublicUrlForKey,
  buildR2ObjectKey,
  MediaStorageError,
  normalizeMediaRole,
  validateUploadMetadata,
} from '@/lib/mediaStorage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_UPLOAD)
  if (auth instanceof Response) return auth

  try {
    assertR2Ready()

    const body = await request.json()
    const {
      filename,
      contentType,
      fileSize,
      folder = 'properties',
      countrySlug = null,
      projectSlug = null,
      mediaRole = 'OTHER',
    } = body || {}

    const validated = validateUploadMetadata({
      filename: String(filename || ''),
      contentType: contentType ? String(contentType) : null,
      byteSize: typeof fileSize === 'number' ? fileSize : undefined,
    })

    const targetFolder = (ALLOWED_MEDIA_FOLDERS as readonly string[]).includes(String(folder))
      ? String(folder)
      : 'properties'
    const normalizedRole = normalizeMediaRole(mediaRole)

    const r2Key = buildR2ObjectKey({
      folder: targetFolder,
      countrySlug,
      projectSlug,
      mediaRole: normalizedRole,
      originalFilename: validated.originalFilename,
      ext: validated.ext,
    })

    const publicUrl = buildPublicUrlForKey(r2Key)
    const uploadParams = new URLSearchParams({
      key: r2Key,
      filename: validated.originalFilename,
      mediaRole: normalizedRole,
    })

    return NextResponse.json({
      uploadUrl: `/api/admin/media/upload?${uploadParams.toString()}`,
      publicUrl,
      key: r2Key,
      r2Key,
      maxSizeBytes: validated.maxSizeBytes,
      mediaType: validated.mediaType,
      mediaRole: normalizedRole,
      mimeType: validated.mimeType,
      mode: 'server-r2',
      storage: 'r2',
    })
  } catch (error) {
    if (error instanceof MediaStorageError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }
    console.error('Presign error:', error)
    return NextResponse.json({ error: 'Failed to prepare R2 upload' }, { status: 500 })
  }
}
