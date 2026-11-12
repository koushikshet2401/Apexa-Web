import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, requirePermission } from '@/lib/rbac'
import { db } from '@/lib/db'
import {
  assertR2Ready,
  buildR2ObjectKey,
  deleteR2Object,
  isSafeR2Key,
  MediaStorageError,
  normalizeMediaRole,
  uploadBufferToR2AndVerify,
  validateUploadMetadata,
  verifyMagicBytes,
} from '@/lib/mediaStorage'
import { recordUploadedMediaAsset } from '@/lib/mediaAssetStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseOptionalInt(val: unknown, fallback = 0): number {
  const num = Number(val)
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : fallback
}

function errorResponse(err: unknown) {
  if (err instanceof MediaStorageError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    )
  }
  const message = err instanceof Error ? err.message : 'Media upload failed'
  return NextResponse.json(
    { error: message, code: 'MEDIA_UPLOAD_FAILED' },
    { status: 500 }
  )
}

async function processR2UploadAndPersist(params: {
  r2Key: string
  buffer: Buffer
  originalFilename: string
  contentType: string | null
  mediaRole: string | null
  propertyId?: string | null
  description?: string | null
  displayOrder?: number
  uploadedById?: string | null
}) {
  assertR2Ready()

  const validated = validateUploadMetadata({
    filename: params.originalFilename,
    contentType: params.contentType,
    byteSize: params.buffer.length,
  })

  if (!verifyMagicBytes(params.buffer, validated.ext)) {
    throw new MediaStorageError(
      `File content signature does not match ${validated.ext} (${validated.mediaType}) format.`,
      400,
      'INVALID_FILE_SIGNATURE'
    )
  }

  if (!isSafeR2Key(params.r2Key)) {
    throw new MediaStorageError('Invalid or unsafe R2 object key.', 400, 'INVALID_R2_KEY')
  }

  const uploaded = await uploadBufferToR2AndVerify({
    key: params.r2Key,
    buffer: params.buffer,
    contentType: validated.mimeType,
    originalFilename: validated.originalFilename,
  })

  const normalizedRole = normalizeMediaRole(params.mediaRole)

  // Validate propertyId exists if provided so foreign key constraints fail cleanly & trigger R2 rollback
  const propertyId = params.propertyId?.trim() || null
  let dbAsset = null
  try {
    dbAsset = await recordUploadedMediaAsset(db, {
      propertyId,
      mediaType: validated.mediaType,
      mediaRole: normalizedRole,
      originalFilename: validated.originalFilename,
      r2Key: uploaded.key,
      publicUrl: uploaded.publicUrl,
      mimeType: validated.mimeType,
      fileSize: uploaded.byteSize,
      displayOrder: params.displayOrder ?? 0,
      description: params.description || null,
      uploadedById: params.uploadedById || null,
    })
  } catch (dbError) {
    // Compensating rollback: do not leave orphaned permanent objects in R2 if PostgreSQL metadata fails
    try {
      await deleteR2Object(uploaded.key)
    } catch (cleanupErr) {
      console.error('[media/upload] R2 compensation cleanup failed:', cleanupErr)
    }
    throw new MediaStorageError(
      `Database media metadata persistence failed; R2 upload was rolled back: ${
        dbError instanceof Error ? dbError.message : 'DB error'
      }`,
      500,
      'DB_METADATA_FAILED'
    )
  }

  return {
    ok: true,
    storage: 'r2' as const,
    verified: true,
    mediaId: dbAsset?.id || null,
    key: uploaded.key,
    r2Key: uploaded.key,
    publicUrl: uploaded.publicUrl,
    originalFilename: validated.originalFilename,
    mimeType: validated.mimeType,
    fileSize: uploaded.byteSize,
    mediaType: validated.mediaType,
    mediaRole: normalizedRole,
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_UPLOAD)
  if (auth instanceof Response) return auth

  try {
    assertR2Ready()

    const { searchParams } = new URL(request.url)
    const rawKey = searchParams.get('key')
    if (!rawKey) {
      throw new MediaStorageError('Missing R2 object key query parameter.', 400, 'MISSING_KEY')
    }

    const r2Key = decodeURIComponent(rawKey).replace(/^\/+/, '')
    if (!isSafeR2Key(r2Key)) {
      throw new MediaStorageError('Invalid or unsafe R2 object key.', 400, 'INVALID_R2_KEY')
    }

    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const fallbackName = r2Key.split('/').pop() || 'upload.bin'
    const originalFilename =
      searchParams.get('filename') ||
      request.headers.get('x-upload-filename') ||
      fallbackName

    const result = await processR2UploadAndPersist({
      r2Key,
      buffer,
      originalFilename,
      contentType: request.headers.get('content-type'),
      mediaRole: searchParams.get('mediaRole') || request.headers.get('x-media-role'),
      propertyId: searchParams.get('propertyId'),
      description: searchParams.get('description'),
      displayOrder: parseOptionalInt(searchParams.get('displayOrder'), 0),
      uploadedById: auth.id,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[media/upload PUT] Error:', err)
    return errorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_UPLOAD)
  if (auth instanceof Response) return auth

  try {
    assertR2Ready()

    const formData = await request.formData()
    const fileEntry = formData.get('file')
    if (!(fileEntry instanceof File)) {
      throw new MediaStorageError('No file provided in multipart upload.', 400, 'MISSING_FILE')
    }

    const folder = String(formData.get('folder') || 'properties').trim()
    const countrySlug = formData.get('countrySlug') ? String(formData.get('countrySlug')) : null
    const projectSlug = formData.get('projectSlug') ? String(formData.get('projectSlug')) : null
    const mediaRole = formData.get('mediaRole')
      ? String(formData.get('mediaRole'))
      : folder === 'homepage'
        ? fileEntry.type.startsWith('video/')
          ? 'HOMEPAGE_VIDEO'
          : 'HOMEPAGE_POSTER'
        : 'OTHER'
    const propertyId = formData.get('propertyId') ? String(formData.get('propertyId')) : null
    const description = formData.get('description') ? String(formData.get('description')) : null
    const displayOrder = parseOptionalInt(formData.get('displayOrder'), 0)
    const explicitKey = formData.get('key') ? String(formData.get('key')).replace(/^\/+/, '') : null

    const arrayBuffer = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const meta = validateUploadMetadata({
      filename: fileEntry.name,
      contentType: fileEntry.type,
      byteSize: buffer.length,
    })

    const r2Key = explicitKey
      ? explicitKey
      : buildR2ObjectKey({
          folder,
          countrySlug,
          projectSlug,
          mediaRole,
          originalFilename: fileEntry.name,
          ext: meta.ext,
        })

    const result = await processR2UploadAndPersist({
      r2Key,
      buffer,
      originalFilename: fileEntry.name,
      contentType: fileEntry.type,
      mediaRole,
      propertyId,
      description,
      displayOrder,
      uploadedById: auth.id,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[media/upload POST] Error:', err)
    return errorResponse(err)
  }
}
