import { NextRequest, NextResponse } from 'next/server'
import { MediaRole } from '@prisma/client'
import { db } from '@/lib/db'
import { PERMISSIONS, requireAnyPermission } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { resolveOrUpsertR2AssetId } from '@/lib/mediaAssetStore'
import { revalidateCollectionAndCountries } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

function sanitizeMediaUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  return trimmed ? trimmed : null
}

function isLocalUploadPath(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().startsWith('/uploads/')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ countryId: string }> }
) {
  const auth = await requireAnyPermission(request, [
    PERMISSIONS.COLLECTION_MEDIA_READ,
    PERMISSIONS.CONTENT_READ,
  ])
  if (auth instanceof Response) return auth

  try {
    const { countryId } = await params
    const country = await db.country.findFirst({
      where: {
        OR: [{ id: countryId }, { slug: countryId }],
      },
      include: { collectionMedia: true },
    })

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    return NextResponse.json({
      countryId: country.id,
      slug: country.slug,
      displayName: country.displayName,
      coverImageUrl: country.collectionMedia?.coverImageUrl ?? country.cardImage ?? country.heroVideoThumb ?? null,
      coverImageMediaAssetId: country.collectionMedia?.coverImageMediaAssetId ?? null,
      heroVideoUrl: country.collectionMedia?.heroVideoUrl ?? country.heroVideoUrl ?? null,
      heroVideoMediaAssetId: country.collectionMedia?.heroVideoMediaAssetId ?? null,
      updatedBy: country.collectionMedia?.updatedBy ?? null,
      updatedAt: country.collectionMedia?.updatedAt ?? country.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching country collection media:', error)
    return NextResponse.json({ error: 'Failed to load country collection media' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ countryId: string }> }
) {
  const auth = await requireAnyPermission(request, [
    PERMISSIONS.COLLECTION_MEDIA_UPDATE,
    PERMISSIONS.CONTENT_UPDATE,
  ])
  if (auth instanceof Response) return auth

  try {
    const { countryId } = await params
    const country = await db.country.findFirst({
      where: {
        OR: [{ id: countryId }, { slug: countryId }],
      },
      include: { collectionMedia: true },
    })

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    const body = await request.json()
    const coverImageUrl = sanitizeMediaUrl(body.coverImageUrl)
    const heroVideoUrl = sanitizeMediaUrl(body.heroVideoUrl)

    if (isLocalUploadPath(coverImageUrl) || isLocalUploadPath(heroVideoUrl)) {
      return NextResponse.json(
        { error: 'Local /uploads/ storage is disabled. Upload all media to Cloudflare R2.' },
        { status: 400 }
      )
    }

    const nextCoverUrl =
      coverImageUrl !== undefined
        ? coverImageUrl
        : (country.collectionMedia?.coverImageUrl ?? country.cardImage ?? null)
    const nextHeroVideoUrl =
      heroVideoUrl !== undefined
        ? heroVideoUrl
        : (country.collectionMedia?.heroVideoUrl ?? country.heroVideoUrl ?? null)

    const result = await db.$transaction(async (tx) => {
      const [coverAssetId, videoAssetId] = await Promise.all([
        resolveOrUpsertR2AssetId(tx, {
          url: nextCoverUrl,
          mediaType: 'IMAGE',
          mediaRole: MediaRole.COLLECTION_COVER,
          uploadedById: auth.id,
        }),
        resolveOrUpsertR2AssetId(tx, {
          url: nextHeroVideoUrl,
          mediaType: 'VIDEO',
          mediaRole: MediaRole.COLLECTION_HERO_VIDEO,
          uploadedById: auth.id,
        }),
      ])

      const collectionMedia = await tx.collectionMedia.upsert({
        where: { countryId: country.id },
        create: {
          countryId: country.id,
          coverImageUrl: nextCoverUrl,
          coverImageMediaAssetId: coverAssetId,
          heroVideoUrl: nextHeroVideoUrl,
          heroVideoMediaAssetId: videoAssetId,
          updatedBy: auth.email,
        },
        update: {
          coverImageUrl: nextCoverUrl,
          coverImageMediaAssetId: coverAssetId,
          heroVideoUrl: nextHeroVideoUrl,
          heroVideoMediaAssetId: videoAssetId,
          updatedBy: auth.email,
        },
      })

      await tx.country.update({
        where: { id: country.id },
        data: {
          ...(coverImageUrl !== undefined && {
            cardImage: nextCoverUrl,
            heroVideoThumb: nextCoverUrl,
          }),
          ...(heroVideoUrl !== undefined && {
            heroVideoUrl: nextHeroVideoUrl,
          }),
        },
      })

      return collectionMedia
    })

    revalidateCollectionAndCountries([country.slug])

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'UPDATE',
      entityType: 'CollectionMedia',
      entityId: country.id,
      summary: `Updated Collection Media for "${country.displayName}" (${country.slug})`,
      metadata: {
        countrySlug: country.slug,
        coverImageUrl: result.coverImageUrl,
        heroVideoUrl: result.heroVideoUrl,
      },
    })

    return NextResponse.json({
      ...result,
      countryId: country.id,
      slug: country.slug,
      displayName: country.displayName,
    })
  } catch (error) {
    console.error('Error updating country collection media:', error)
    return NextResponse.json({ error: 'Failed to save country collection media' }, { status: 500 })
  }
}
