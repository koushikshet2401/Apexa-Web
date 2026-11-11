import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { validateUploadPath, safeWriteUploadFile } from '@/lib/pathSecurity'
import { r2, isR2Configured, getR2BucketName, getR2PublicUrl } from '@/lib/r2'

export const dynamic = 'force-dynamic'

async function handleUpload(request: NextRequest, key: string, buffer: Buffer, contentType?: string) {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const pathCheck = await validateUploadPath(key, uploadsDir)

  if (!pathCheck.valid) {
    return NextResponse.json(
      { error: pathCheck.error || 'Invalid file path traversal attempt.' },
      { status: 400 }
    )
  }

  const safePath = pathCheck.safePath

  // 1. Always write locally for fast, resilient availability
  await safeWriteUploadFile(safePath, buffer, uploadsDir)
  const normalizedKey = key.replace(/\\/g, '/')
  let publicUrl = `/uploads/${normalizedKey}`

  // 2. If Cloudflare R2 is configured, upload server-side (immune to browser CORS)
  if (isR2Configured()) {
    try {
      const bucketName = getR2BucketName()
      const publicBase = getR2PublicUrl()

      const ext = path.extname(normalizedKey).toLowerCase()
      const resolvedContentType =
        contentType ||
        (ext === '.mp4'
          ? 'video/mp4'
          : ext === '.png'
          ? 'image/png'
          : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg')

      await r2.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: normalizedKey,
          Body: buffer,
          ContentType: resolvedContentType,
        })
      )

      if (publicBase) {
        publicUrl = `${publicBase}/${normalizedKey}`
      }
    } catch (r2Err) {
      console.warn('[R2 Server Upload Warning] Direct R2 sync failed, using local disk copy:', r2Err)
    }
  }

  return NextResponse.json({
    ok: true,
    publicUrl,
    key: normalizedKey,
  })
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_UPLOAD)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
    }

    const contentType = request.headers.get('content-type') || undefined
    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return await handleUpload(request, key, buffer, contentType)
  } catch (error) {
    console.error('Error in media upload:', error)
    return NextResponse.json({ error: 'Failed to save uploaded file' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_UPLOAD)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const keyParam = searchParams.get('key')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'properties'

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 })
    }

    const extMatch = file.name.toLowerCase().match(/\.[a-z0-9]+$/)
    const ext = extMatch ? extMatch[0] : '.jpg'
    const sanitizedBase = file.name
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const key = keyParam || `${folder}/${Date.now()}-${sanitizedBase || 'asset'}${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return await handleUpload(request, key, buffer, file.type)
  } catch (error) {
    console.error('Error in media POST upload:', error)
    return NextResponse.json({ error: 'Failed to process multipart upload' }, { status: 500 })
  }
}
