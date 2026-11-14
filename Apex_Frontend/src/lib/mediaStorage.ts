import crypto from 'crypto'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getR2BucketName, getR2Client, getR2PublicUrl, isR2Configured } from './r2'

export const ALLOWED_MEDIA_FOLDERS = [
  'properties',
  'space-in-round',
  'countries',
  'services',
  'homepage',
  'one-team',
  'collection-media',
  'general',
] as const
export type AllowedMediaFolder = (typeof ALLOWED_MEDIA_FOLDERS)[number]

export const ALLOWED_MEDIA_ROLES = [
  'THUMBNAIL',
  'HERO_VIDEO',
  'VIDEO_THUMB',
  'GALLERY_IMAGE',
  'SPACE_IN_ROUND',
  'HOMEPAGE_VIDEO',
  'HOMEPAGE_THUMB',
  'COUNTRY_MEDIA',
  'SERVICE_MEDIA',
  'ONE_TEAM_VILLA',
  'ONE_TEAM_COMMERCIAL',
  'ONE_TEAM_SKY',
  'ONE_TEAM_WATERFRONT',
  'ONE_TEAM_VIDEO',
  'COLLECTION_COVER',
  'COLLECTION_HERO_VIDEO',
  'GENERAL',
] as const
export type MediaRoleType = (typeof ALLOWED_MEDIA_ROLES)[number]

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v'] as const
export const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS] as const

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20 MB
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB

export class MediaStorageError extends Error {
  status: number
  code: string

  constructor(message: string, status = 400, code = 'MEDIA_STORAGE_ERROR') {
    super(message)
    this.name = 'MediaStorageError'
    this.status = status
    this.code = code
  }
}

export function assertR2Ready(): { bucket: string; publicUrl: string } {
  const bucket = getR2BucketName()
  const publicUrl = getR2PublicUrl()

  if (!isR2Configured() || !bucket || !publicUrl) {
    throw new MediaStorageError(
      'Cloudflare R2 storage is not configured. Local disk fallback is disabled for permanent uploads.',
      503,
      'R2_NOT_CONFIGURED'
    )
  }

  return { bucket, publicUrl }
}

export function sanitizePathSegment(input: string | null | undefined, fallback = 'asset'): string {
  const cleaned = String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

  return cleaned || fallback
}

export function getNormalizedExtension(filename: string): string {
  const match = String(filename || '').trim().toLowerCase().match(/(\.[a-z0-9]+)$/)
  return match ? match[1] : ''
}

export function resolveCanonicalMimeType(ext: string, providedMime?: string | null): string {
  const mime = (providedMime || '').toLowerCase().trim()
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.mp4':
    case '.m4v':
      return 'video/mp4'
    case '.mov':
      return mime === 'video/mp4' ? 'video/mp4' : 'video/quicktime'
    case '.webm':
      return 'video/webm'
    default:
      return mime || 'application/octet-stream'
  }
}

export function isImageExtension(ext: string): boolean {
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)
}

export function isVideoExtension(ext: string): boolean {
  return (ALLOWED_VIDEO_EXTENSIONS as readonly string[]).includes(ext)
}

export function verifyMagicBytes(buffer: Buffer, ext: string): boolean {
  if (!buffer || buffer.length < 4) return false

  // Reject HTML / SVG / executable payloads even if renamed to an image/video extension
  const headAscii = buffer.subarray(0, Math.min(64, buffer.length)).toString('utf8').trimStart().toLowerCase()
  if (
    headAscii.startsWith('<!doctype') ||
    headAscii.startsWith('<html') ||
    headAscii.startsWith('<script') ||
    headAscii.startsWith('<svg') ||
    headAscii.startsWith('<?xml') ||
    headAscii.startsWith('#!/') ||
    (buffer[0] === 0x4d && buffer[1] === 0x5a) // PE executable MZ
  ) {
    return false
  }

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    case '.png':
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      )
    case '.gif':
      return (
        buffer.length >= 6 &&
        (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
          buffer.subarray(0, 6).toString('ascii') === 'GIF89a')
      )
    case '.webp':
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      )
    case '.mp4':
    case '.m4v':
    case '.mov': {
      if (buffer.length < 8) return false
      const boxType = buffer.subarray(4, 8).toString('ascii')
      return ['ftyp', 'moov', 'mdat', 'free', 'wide', 'skip', 'pnot'].includes(boxType)
    }
    case '.webm':
      return (
        buffer.length >= 4 &&
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      )
    default:
      return false
  }
}

export interface ValidatedUploadDescriptor {
  originalFilename: string
  ext: string
  mediaType: 'image' | 'video'
  mimeType: string
  maxSizeBytes: number
}

export function validateUploadMetadata(input: {
  filename: string
  contentType?: string | null
  byteSize?: number | null
}): ValidatedUploadDescriptor {
  const originalFilename = String(input.filename || '').trim()
  if (!originalFilename) {
    throw new MediaStorageError('Filename is required', 400, 'INVALID_FILENAME')
  }

  const ext = getNormalizedExtension(originalFilename)
  if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new MediaStorageError(
      `Unsupported file extension "${ext || 'none'}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      400,
      'UNSUPPORTED_EXTENSION'
    )
  }

  const isImage = isImageExtension(ext)
  const isVideo = isVideoExtension(ext)
  const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image'
  const maxSizeBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES

  const rawMime = (input.contentType || '').toLowerCase().trim()
  if (rawMime) {
    const allowedMime =
      (isImage && rawMime.startsWith('image/') && !rawMime.includes('svg')) ||
      (isVideo && (rawMime.startsWith('video/') || rawMime === 'application/octet-stream'))

    if (!allowedMime) {
      throw new MediaStorageError(
        `MIME type "${rawMime}" does not match ${mediaType} upload requirements.`,
        400,
        'MIME_MISMATCH'
      )
    }
  }

  if (typeof input.byteSize === 'number') {
    if (input.byteSize <= 0) {
      throw new MediaStorageError('Uploaded file cannot be empty (0 bytes).', 400, 'EMPTY_FILE')
    }
    if (input.byteSize > maxSizeBytes) {
      throw new MediaStorageError(
        `File size exceeds ${Math.round(maxSizeBytes / (1024 * 1024))}MB limit for ${mediaType}s.`,
        413,
        'FILE_TOO_LARGE'
      )
    }
  }

  return {
    originalFilename,
    ext,
    mediaType,
    mimeType: resolveCanonicalMimeType(ext, rawMime),
    maxSizeBytes,
  }
}

export function isSafeR2Key(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  if (key.startsWith('/') || key.includes('\\') || key.includes('..') || /[\0\r\n]/.test(key)) {
    return false
  }
  const segments = key.split('/')
  if (segments.some((seg) => !seg || seg === '.' || seg === '..')) {
    return false
  }
  return (ALLOWED_MEDIA_FOLDERS as readonly string[]).includes(segments[0])
}

export function normalizeMediaRole(role?: string | null): MediaRoleType {
  const upper = String(role || 'GENERAL').toUpperCase().trim()
  if (upper === 'GALLERY') return 'GALLERY_IMAGE'
  if (upper === 'SPACE_ROUND') return 'SPACE_IN_ROUND'
  if (upper === 'HOMEPAGE_POSTER') return 'HOMEPAGE_THUMB'
  if (upper === 'OTHER') return 'GENERAL'
  if ((ALLOWED_MEDIA_ROLES as readonly string[]).includes(upper)) {
    return upper as MediaRoleType
  }
  return 'GENERAL'
}

export function buildR2ObjectKey(params: {
  folder?: string | null
  countrySlug?: string | null
  projectSlug?: string | null
  mediaRole?: string | null
  originalFilename: string
  ext: string
}): string {
  const folder = (ALLOWED_MEDIA_FOLDERS as readonly string[]).includes(String(params.folder || ''))
    ? (params.folder as AllowedMediaFolder)
    : 'properties'

  const baseNoExt = params.originalFilename.replace(/\.[^/.]+$/, '')
  const safeBase = sanitizePathSegment(baseNoExt, 'asset')
  const role = normalizeMediaRole(params.mediaRole)
  const timestamp = Date.now()
  const uniqueSuffix = crypto.randomBytes(4).toString('hex')

  if (folder === 'properties') {
    const country = sanitizePathSegment(params.countrySlug, 'general')
    const project = sanitizePathSegment(params.projectSlug, 'unassigned')

    if (role === 'GALLERY_IMAGE') {
      return `properties/${country}/${project}/gallery/${timestamp}-${uniqueSuffix}-${safeBase}${params.ext}`
    }

    const rolePrefixMap: Record<MediaRoleType, string> = {
      THUMBNAIL: 'thumbnail',
      HERO_VIDEO: 'hero-video',
      VIDEO_THUMB: 'video-thumb',
      SPACE_IN_ROUND: 'space-round',
      GALLERY_IMAGE: 'gallery',
      HOMEPAGE_VIDEO: 'homepage-video',
      HOMEPAGE_THUMB: 'homepage-thumb',
      COUNTRY_MEDIA: 'country',
      SERVICE_MEDIA: 'service',
      ONE_TEAM_VILLA: 'luxury-villas',
      ONE_TEAM_COMMERCIAL: 'commercial',
      ONE_TEAM_SKY: 'sky-residences',
      ONE_TEAM_WATERFRONT: 'waterfront-residences',
      ONE_TEAM_VIDEO: 'middle-video',
      COLLECTION_COVER: 'cover',
      COLLECTION_HERO_VIDEO: 'hero-video',
      GENERAL: 'asset',
    }
    const prefix = rolePrefixMap[role] || 'asset'
    return `properties/${country}/${project}/${prefix}-${timestamp}-${uniqueSuffix}-${safeBase}${params.ext}`
  }

  if (folder === 'collection-media') {
    const country = sanitizePathSegment(params.countrySlug, 'general')
    const prefix = role === 'COLLECTION_COVER' ? 'cover' : role === 'COLLECTION_HERO_VIDEO' ? 'hero-video' : 'media'
    return `collection-media/${country}/${prefix}-${timestamp}-${uniqueSuffix}-${safeBase}${params.ext}`
  }

  if (folder === 'space-in-round') {
    return `space-in-round/space-round-${timestamp}-${uniqueSuffix}-${safeBase}${params.ext}`
  }

  if (folder === 'one-team') {
    const prefix =
      role === 'ONE_TEAM_VILLA'
        ? 'luxury-villas'
        : role === 'ONE_TEAM_COMMERCIAL'
          ? 'commercial'
          : role === 'ONE_TEAM_SKY'
            ? 'sky-residences'
            : role === 'ONE_TEAM_WATERFRONT'
              ? 'waterfront-residences'
              : role === 'ONE_TEAM_VIDEO'
                ? 'middle-video'
                : 'media'
    return `one-team/${prefix}-${timestamp}-${uniqueSuffix}-${safeBase}${params.ext}`
  }

  return `${folder}/${timestamp}-${uniqueSuffix}-${safeBase}${params.ext}`
}

export function buildPublicUrlForKey(key: string): string {
  const { publicUrl } = assertR2Ready()
  return `${publicUrl.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`
}

export function extractR2KeyFromUrl(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey || typeof urlOrKey !== 'string') return null
  const trimmed = urlOrKey.trim()
  if (!trimmed) return null

  // Local paths are NOT R2 keys
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/images/') || trimmed.startsWith('/videos/')) {
    return null
  }

  const configuredPublic = getR2PublicUrl().replace(/\/+$/, '')
  if (configuredPublic && trimmed.startsWith(`${configuredPublic}/`)) {
    const candidate = decodeURIComponent(trimmed.slice(configuredPublic.length + 1).split('?')[0])
    return isSafeR2Key(candidate) ? candidate : null
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed)
      if (parsed.hostname.endsWith('.r2.dev') || parsed.hostname.endsWith('.r2.cloudflarestorage.com')) {
        const candidate = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
        return isSafeR2Key(candidate) ? candidate : null
      }
      return null
    } catch {
      return null
    }
  }

  const candidate = trimmed.replace(/^\/+/, '')
  return isSafeR2Key(candidate) ? candidate : null
}

export async function verifyR2ObjectExists(
  key: string,
  expectedSize?: number
): Promise<{
  exists: boolean
  contentLength: number
  contentType: string | null
  etag: string | null
  lastModified: Date | null
}> {
  const { bucket } = assertR2Ready()
  if (!isSafeR2Key(key)) {
    throw new MediaStorageError('Invalid R2 object key', 400, 'INVALID_R2_KEY')
  }

  try {
    const head = await getR2Client().send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
    const contentLength = Number(head.ContentLength ?? 0)
    if (typeof expectedSize === 'number' && contentLength !== expectedSize) {
      return {
        exists: false,
        contentLength,
        contentType: head.ContentType || null,
        etag: head.ETag || null,
        lastModified: head.LastModified || null,
      }
    }
    return {
      exists: true,
      contentLength,
      contentType: head.ContentType || null,
      etag: head.ETag || null,
      lastModified: head.LastModified || null,
    }
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') {
      return {
        exists: false,
        contentLength: 0,
        contentType: null,
        etag: null,
        lastModified: null,
      }
    }
    throw err
  }
}

export async function uploadBufferToR2AndVerify(params: {
  key: string
  buffer: Buffer
  contentType: string
  originalFilename: string
}): Promise<{
  key: string
  publicUrl: string
  byteSize: number
  etag: string | null
}> {
  const { bucket } = assertR2Ready()
  if (!isSafeR2Key(params.key)) {
    throw new MediaStorageError('Unsafe R2 key rejected', 400, 'INVALID_R2_KEY')
  }

  const safeMetaName = params.originalFilename.replace(/[^\x20-\x7e]/g, '_').slice(0, 200)

  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: params.key,
        Body: params.buffer,
        ContentType: params.contentType,
        ContentLength: params.buffer.length,
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: {
          'original-filename': safeMetaName,
        },
      })
    )
  } catch (err: any) {
    throw new MediaStorageError(
      `Cloudflare R2 upload failed: ${err?.message || 'Unknown S3 error'}`,
      502,
      'R2_PUT_FAILED'
    )
  }

  const verification = await verifyR2ObjectExists(params.key, params.buffer.length)
  if (!verification.exists) {
    // Cleanup incomplete object if it exists with mismatched size
    try {
      await getR2Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: params.key }))
    } catch {
      // Best-effort cleanup
    }
    throw new MediaStorageError(
      'Cloudflare R2 upload could not be verified after upload (HeadObject check failed or size mismatch).',
      502,
      'R2_VERIFY_FAILED'
    )
  }

  return {
    key: params.key,
    publicUrl: buildPublicUrlForKey(params.key),
    byteSize: verification.contentLength,
    etag: verification.etag,
  }
}

export async function deleteR2Object(key: string): Promise<void> {
  const { bucket } = assertR2Ready()
  if (!isSafeR2Key(key)) {
    throw new MediaStorageError('Invalid R2 object key', 400, 'INVALID_R2_KEY')
  }

  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
  } catch (err: any) {
    throw new MediaStorageError(
      `Cloudflare R2 delete failed: ${err?.message || 'Unknown error'}`,
      502,
      'R2_DELETE_FAILED'
    )
  }
}

export async function getR2ObjectStream(key: string, range?: string | null) {
  const { bucket } = assertR2Ready()
  if (!isSafeR2Key(key)) {
    throw new MediaStorageError('Invalid R2 object key', 400, 'INVALID_R2_KEY')
  }

  return getR2Client().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(range ? { Range: range } : {}),
    })
  )
}

export async function listR2Objects(prefix?: string) {
  const { bucket } = assertR2Ready()
  const items: Array<{
    key: string
    publicUrl: string
    size: number
    lastModified: Date | null
  }> = []

  let continuationToken: string | undefined
  do {
    const res = await getR2Client().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ...(prefix ? { Prefix: prefix } : {}),
        ContinuationToken: continuationToken,
        MaxKeys: 500,
      })
    )

    for (const obj of res.Contents || []) {
      if (obj.Key) {
        items.push({
          key: obj.Key,
          publicUrl: buildPublicUrlForKey(obj.Key),
          size: Number(obj.Size || 0),
          lastModified: obj.LastModified || null,
        })
      }
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)

  return items.sort(
    (a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
  )
}
