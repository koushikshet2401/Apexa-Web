import { MediaRole, Prisma, PrismaClient } from '@prisma/client'
import { db } from './db'
import { extractR2KeyFromUrl, normalizeMediaRole } from './mediaStorage'

type DbClient = PrismaClient | Prisma.TransactionClient

export function isMissingMediaAssetTableError(err: unknown): boolean {
  const anyErr = err as any
  const code = anyErr?.code || anyErr?.meta?.code
  const message = String(anyErr?.message || '')
  return (
    code === 'P2021' ||
    code === '42P01' ||
    /table.*MediaAsset.*does not exist/i.test(message) ||
    /table.*media_assets.*does not exist/i.test(message) ||
    /relation "MediaAsset" does not exist/i.test(message)
  )
}

export function toPrismaMediaRole(role?: string | null): MediaRole {
  const normalized = normalizeMediaRole(role)
  return MediaRole[normalized as keyof typeof MediaRole] || MediaRole.GENERAL
}

export interface RecordMediaAssetInput {
  propertyId?: string | null
  mediaType: 'image' | 'video' | 'IMAGE' | 'VIDEO'
  mediaRole?: string | null
  originalFilename: string
  r2Key: string
  publicUrl: string
  mimeType: string
  fileSize: number
  displayOrder?: number
  description?: string | null
  uploadedById?: string | null
}

export async function recordUploadedMediaAsset(
  client: DbClient,
  input: RecordMediaAssetInput
) {
  const normalizedType = input.mediaType.toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE'
  try {
    return await client.mediaAsset.upsert({
      where: { r2Key: input.r2Key },
      create: {
        propertyId: input.propertyId || null,
        mediaType: normalizedType,
        mediaRole: toPrismaMediaRole(input.mediaRole),
        originalFilename: input.originalFilename,
        r2Key: input.r2Key,
        publicUrl: input.publicUrl,
        mimeType: input.mimeType,
        fileSize: Math.max(0, Math.round(input.fileSize)),
        displayOrder: input.displayOrder ?? 0,
        description: input.description || null,
        uploadedById: input.uploadedById || null,
      },
      update: {
        propertyId: input.propertyId ?? undefined,
        mediaType: normalizedType,
        mediaRole: toPrismaMediaRole(input.mediaRole),
        originalFilename: input.originalFilename,
        publicUrl: input.publicUrl,
        mimeType: input.mimeType,
        fileSize: Math.max(0, Math.round(input.fileSize)),
        displayOrder: input.displayOrder ?? 0,
        description: input.description ?? undefined,
        uploadedById: input.uploadedById ?? undefined,
      },
    })
  } catch (err) {
    if (isMissingMediaAssetTableError(err)) {
      console.warn('[mediaAssetStore] MediaAsset table missing (pending migration); skipping DB row.')
      return null
    }
    throw err
  }
}

export interface SyncProjectMediaInput {
  propertyId: string
  mainImage?: string | null
  mainVideoUrl?: string | null
  spaceRoundImage?: string | null
  galleryImages?: Array<{
    url: string
    caption?: string | null
    description?: string | null
    order?: number
  }>
}

function inferFilenameFromKey(key: string): string {
  const last = key.split('/').pop() || 'asset'
  return last.replace(/^\d+-[0-9a-f]+-/, '') || last
}

function inferMimeFromKey(key: string, mediaType: 'IMAGE' | 'VIDEO'): string {
  const lower = key.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.mp4') || lower.endsWith('.m4v')) return 'video/mp4'
  if (lower.endsWith('.mov')) return 'video/quicktime'
  if (lower.endsWith('.webm')) return 'video/webm'
  return mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg'
}

export async function syncProjectMediaAssets(
  tx: DbClient,
  input: SyncProjectMediaInput
): Promise<void> {
  try {
    const desiredAssets: Array<{
      r2Key: string
      publicUrl: string
      mediaType: 'IMAGE' | 'VIDEO'
      mediaRole: MediaRole
      displayOrder: number
      description: string | null
    }> = []

    const pushIfR2 = (
      url: string | null | undefined,
      mediaType: 'IMAGE' | 'VIDEO',
      mediaRole: MediaRole,
      displayOrder: number,
      description: string | null = null
    ) => {
      if (!url) return
      const r2Key = extractR2KeyFromUrl(url)
      if (!r2Key) return
      desiredAssets.push({
        r2Key,
        publicUrl: url.trim(),
        mediaType,
        mediaRole,
        displayOrder,
        description,
      })
    }

    pushIfR2(input.mainImage, 'IMAGE', MediaRole.THUMBNAIL, 0, null)
    pushIfR2(input.mainVideoUrl, 'VIDEO', MediaRole.HERO_VIDEO, 0, null)
    pushIfR2(input.spaceRoundImage, 'IMAGE', MediaRole.SPACE_IN_ROUND, 0, null)

    if (Array.isArray(input.galleryImages)) {
      input.galleryImages.forEach((img, idx) => {
        pushIfR2(
          img.url,
          'IMAGE',
          MediaRole.GALLERY_IMAGE,
          typeof img.order === 'number' ? img.order : idx,
          img.description || img.caption || null
        )
      })
    }

    const activeKeys = desiredAssets.map((a) => a.r2Key)

    // Unlink assets previously tied to this project that are no longer referenced
    await tx.mediaAsset.updateMany({
      where: {
        propertyId: input.propertyId,
        ...(activeKeys.length > 0 ? { r2Key: { notIn: activeKeys } } : {}),
      },
      data: {
        propertyId: null,
      },
    })

    for (const item of desiredAssets) {
      await tx.mediaAsset.upsert({
        where: { r2Key: item.r2Key },
        create: {
          propertyId: input.propertyId,
          mediaType: item.mediaType,
          mediaRole: item.mediaRole,
          originalFilename: inferFilenameFromKey(item.r2Key),
          r2Key: item.r2Key,
          publicUrl: item.publicUrl,
          mimeType: inferMimeFromKey(item.r2Key, item.mediaType),
          fileSize: 0,
          displayOrder: item.displayOrder,
          description: item.description,
        },
        update: {
          propertyId: input.propertyId,
          mediaType: item.mediaType,
          mediaRole: item.mediaRole,
          publicUrl: item.publicUrl,
          displayOrder: item.displayOrder,
          description: item.description,
        },
      })
    }
  } catch (err) {
    if (isMissingMediaAssetTableError(err)) {
      console.warn('[mediaAssetStore] MediaAsset table missing (pending migration); skipping sync.')
      return
    }
    throw err
  }
}

export async function markMediaAssetDeleted(r2Key: string): Promise<void> {
  try {
    await db.mediaAsset.deleteMany({
      where: { r2Key },
    })
  } catch (err) {
    if (isMissingMediaAssetTableError(err)) return
    throw err
  }
}
