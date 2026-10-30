import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireAdmin } from '@/lib/adminAuth'
import { r2, isR2Configured, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4']
const ALLOWED_FOLDERS = ['properties', 'countries', 'services', 'homepage', 'general']

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
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

    // Check if Cloudflare R2 is configured
    if (isR2Configured()) {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: uniqueKey,
        ContentType: contentType,
      })

      const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 })
      const publicUrl = R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}/${uniqueKey}`
        : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${uniqueKey}`

      return NextResponse.json({
        uploadUrl,
        publicUrl,
        key: uniqueKey,
        maxSizeBytes,
        mode: 'r2',
      })
    }

    // Fallback when Cloudflare R2 credentials are not yet configured
    // Directs client to local server upload endpoint
    const fallbackPublicUrl = `/uploads/${uniqueKey}`
    return NextResponse.json({
      uploadUrl: `/api/admin/media/upload-local?key=${encodeURIComponent(uniqueKey)}`,
      publicUrl: fallbackPublicUrl,
      key: uniqueKey,
      maxSizeBytes,
      mode: 'local',
      note: 'R2 credentials not provided; using local storage fallback.',
    })
  } catch (error) {
    console.error('Error generating presigned upload:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
