import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { r2, isR2Configured, getR2BucketName, getR2PublicUrl } from '@/lib/r2'

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4']
const ALLOWED_FOLDERS = ['properties', 'countries', 'services', 'homepage', 'general']

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_UPLOAD)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const { filename, contentType, folder } = body

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: 'Content-Type is required' }, { status: 400 })
    }

    // Validate Content-Type
    const isImage = contentType.startsWith('image/')
    const isVideo = contentType === 'video/mp4' || contentType === 'video/quicktime'

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Only images (JPEG, PNG, WebP, GIF) and MP4 videos are allowed.' },
        { status: 400 }
      )
    }

    // Validate extension
    const extMatch = filename.toLowerCase().match(/\.[a-z0-9]+$/)
    const ext = extMatch ? extMatch[0] : ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File extension "${ext}" is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate folder
    const targetFolder = ALLOWED_FOLDERS.includes(folder) ? folder : 'general'

    // Max size hint (20MB for images, 500MB for video)
    const maxSizeBytes = isVideo ? 500 * 1024 * 1024 : 20 * 1024 * 1024

    // Generate unique key
    const sanitizedBase = filename
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    const uniqueKey = `${targetFolder}/${Date.now()}-${sanitizedBase || 'asset'}${ext}`

    // Always route through the same-origin server upload endpoint to avoid
    // browser CORS preflight restrictions on Cloudflare R2 direct endpoints.
    // The server handler (/api/admin/media/upload-local) writes to disk and
    // immediately uploads server-to-server to Cloudflare R2 without CORS limits.
    const publicBase = getR2PublicUrl()
    const expectedPublicUrl = isR2Configured() && publicBase
      ? `${publicBase}/${uniqueKey}`
      : `/uploads/${uniqueKey}`

    return NextResponse.json({
      uploadUrl: `/api/admin/media/upload-local?key=${encodeURIComponent(uniqueKey)}`,
      publicUrl: expectedPublicUrl,
      key: uniqueKey,
      maxSizeBytes,
      mode: isR2Configured() ? 'server-r2' : 'local',
    })
  } catch (error) {
    console.error('Error generating presigned upload:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
