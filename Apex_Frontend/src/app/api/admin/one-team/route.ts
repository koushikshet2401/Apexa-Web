import { NextRequest, NextResponse } from 'next/server'
import { MediaRole } from '@prisma/client'
import { db } from '@/lib/db'
import { PERMISSIONS, requireAnyPermission } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { isMissingCmsExtensionError, resolveOrUpsertR2AssetId } from '@/lib/mediaAssetStore'
import { revalidateOneTeamAndServices } from '@/lib/revalidate'

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

export async function GET(request: NextRequest) {
  const auth = await requireAnyPermission(request, [PERMISSIONS.ONE_TEAM_READ, PERMISSIONS.CONTENT_READ])
  if (auth instanceof Response) return auth

  try {
    let oneTeam: any = null
    let migrationPending = false

    try {
      oneTeam = await db.oneTeamContent.findFirst({
        orderBy: { createdAt: 'asc' },
      })
    } catch (err) {
      if (isMissingCmsExtensionError(err)) {
        migrationPending = true
      } else {
        throw err
      }
    }

    const [services, homepage] = await Promise.all([
      db.serviceCategory.findMany({
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          subtitle: true,
          image: true,
          videoUrl: true,
          isPublished: true,
          displayOrder: true,
        },
      }),
      db.homepageContent.findFirst({
        select: { id: true, oneTeamVideoUrl: true, updatedAt: true },
      }),
    ])

    const luxuryVillasService = services.find((s) => s.slug === 'luxury-villas')
    const commercialService = services.find((s) => s.slug === 'commercial-properties')
    const skyService = services.find((s) => s.slug === 'sky-residences')
    const waterfrontService = services.find((s) => s.slug === 'waterfront-residences')

    return NextResponse.json({
      id: oneTeam?.id || null,
      sectionEyebrow: oneTeam?.sectionEyebrow ?? null,
      sectionHeading: oneTeam?.sectionHeading ?? null,
      sectionDescription: oneTeam?.sectionDescription ?? null,
      bannerLabel: oneTeam?.bannerLabel ?? null,
      bannerHeading: oneTeam?.bannerHeading ?? null,
      luxuryVillasImageUrl: oneTeam?.luxuryVillasImageUrl ?? luxuryVillasService?.image ?? null,
      luxuryVillasMediaAssetId: oneTeam?.luxuryVillasMediaAssetId ?? null,
      commercialImageUrl: oneTeam?.commercialImageUrl ?? commercialService?.image ?? null,
      commercialMediaAssetId: oneTeam?.commercialMediaAssetId ?? null,
      skyResidencesImageUrl: oneTeam?.skyResidencesImageUrl ?? skyService?.image ?? null,
      skyResidencesMediaAssetId: oneTeam?.skyResidencesMediaAssetId ?? null,
      waterfrontImageUrl: oneTeam?.waterfrontImageUrl ?? waterfrontService?.image ?? null,
      waterfrontMediaAssetId: oneTeam?.waterfrontMediaAssetId ?? null,
      centerVideoUrl: oneTeam?.centerVideoUrl ?? homepage?.oneTeamVideoUrl ?? null,
      centerVideoMediaAssetId: oneTeam?.centerVideoMediaAssetId ?? null,
      updatedBy: oneTeam?.updatedBy ?? null,
      updatedAt: oneTeam?.updatedAt ?? homepage?.updatedAt ?? null,
      migrationPending,
      services,
    })
  } catch (error) {
    console.error('Error fetching One Team content:', error)
    return NextResponse.json({ error: 'Failed to load One Team content' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAnyPermission(request, [PERMISSIONS.ONE_TEAM_UPDATE, PERMISSIONS.CONTENT_UPDATE])
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const sectionEyebrow = sanitizeMediaUrl(body.sectionEyebrow)
    const sectionHeading = sanitizeMediaUrl(body.sectionHeading)
    const sectionDescription = sanitizeMediaUrl(body.sectionDescription)
    const bannerLabel = sanitizeMediaUrl(body.bannerLabel)
    const bannerHeading = sanitizeMediaUrl(body.bannerHeading)
    const luxuryVillasImageUrl = sanitizeMediaUrl(body.luxuryVillasImageUrl)
    const commercialImageUrl = sanitizeMediaUrl(body.commercialImageUrl)
    const skyResidencesImageUrl = sanitizeMediaUrl(body.skyResidencesImageUrl)
    const waterfrontImageUrl = sanitizeMediaUrl(body.waterfrontImageUrl)
    const centerVideoUrl = sanitizeMediaUrl(body.centerVideoUrl)

    if (
      isLocalUploadPath(luxuryVillasImageUrl) ||
      isLocalUploadPath(commercialImageUrl) ||
      isLocalUploadPath(skyResidencesImageUrl) ||
      isLocalUploadPath(waterfrontImageUrl) ||
      isLocalUploadPath(centerVideoUrl)
    ) {
      return NextResponse.json(
        { error: 'Local /uploads/ storage is disabled. Upload all media to Cloudflare R2.' },
        { status: 400 }
      )
    }

    const syncLegacyTables = async (tx: any) => {
      if (luxuryVillasImageUrl !== undefined) {
        await tx.serviceCategory.updateMany({
          where: { slug: 'luxury-villas' },
          data: { image: luxuryVillasImageUrl },
        })
      }
      if (commercialImageUrl !== undefined) {
        await tx.serviceCategory.updateMany({
          where: { slug: 'commercial-properties' },
          data: { image: commercialImageUrl },
        })
      }
      if (skyResidencesImageUrl !== undefined) {
        await tx.serviceCategory.updateMany({
          where: { slug: 'sky-residences' },
          data: { image: skyResidencesImageUrl },
        })
      }
      if (waterfrontImageUrl !== undefined) {
        await tx.serviceCategory.updateMany({
          where: { slug: 'waterfront-residences' },
          data: { image: waterfrontImageUrl },
        })
      }
      if (centerVideoUrl !== undefined) {
        const home = await tx.homepageContent.findFirst()
        if (home) {
          await tx.homepageContent.update({
            where: { id: home.id },
            data: { oneTeamVideoUrl: centerVideoUrl },
          })
        } else {
          await tx.homepageContent.create({
            data: { oneTeamVideoUrl: centerVideoUrl },
          })
        }
      }
    }

    let updated: any
    try {
      updated = await db.$transaction(async (tx) => {
        const existing = await tx.oneTeamContent.findFirst({
          orderBy: { createdAt: 'asc' },
        })

        const nextVillasUrl =
          luxuryVillasImageUrl !== undefined ? luxuryVillasImageUrl : (existing?.luxuryVillasImageUrl ?? null)
        const nextCommercialUrl =
          commercialImageUrl !== undefined ? commercialImageUrl : (existing?.commercialImageUrl ?? null)
        const nextSkyUrl =
          skyResidencesImageUrl !== undefined ? skyResidencesImageUrl : (existing?.skyResidencesImageUrl ?? null)
        const nextWaterfrontUrl =
          waterfrontImageUrl !== undefined ? waterfrontImageUrl : (existing?.waterfrontImageUrl ?? null)
        const nextCenterVideoUrl =
          centerVideoUrl !== undefined ? centerVideoUrl : (existing?.centerVideoUrl ?? null)

        const [villasAssetId, commercialAssetId, skyAssetId, waterfrontAssetId, videoAssetId] = await Promise.all([
          resolveOrUpsertR2AssetId(tx, {
            url: nextVillasUrl,
            mediaType: 'IMAGE',
            mediaRole: MediaRole.ONE_TEAM_VILLA,
            uploadedById: auth.id,
          }),
          resolveOrUpsertR2AssetId(tx, {
            url: nextCommercialUrl,
            mediaType: 'IMAGE',
            mediaRole: MediaRole.ONE_TEAM_COMMERCIAL,
            uploadedById: auth.id,
          }),
          resolveOrUpsertR2AssetId(tx, {
            url: nextSkyUrl,
            mediaType: 'IMAGE',
            mediaRole: MediaRole.ONE_TEAM_SKY,
            uploadedById: auth.id,
          }),
          resolveOrUpsertR2AssetId(tx, {
            url: nextWaterfrontUrl,
            mediaType: 'IMAGE',
            mediaRole: MediaRole.ONE_TEAM_WATERFRONT,
            uploadedById: auth.id,
          }),
          resolveOrUpsertR2AssetId(tx, {
            url: nextCenterVideoUrl,
            mediaType: 'VIDEO',
            mediaRole: MediaRole.ONE_TEAM_VIDEO,
            uploadedById: auth.id,
          }),
        ])

        const nextSectionEyebrow =
          sectionEyebrow !== undefined ? sectionEyebrow : (existing?.sectionEyebrow ?? null)
        const nextSectionHeading =
          sectionHeading !== undefined ? sectionHeading : (existing?.sectionHeading ?? null)
        const nextSectionDescription =
          sectionDescription !== undefined ? sectionDescription : (existing?.sectionDescription ?? null)
        const nextBannerLabel =
          bannerLabel !== undefined ? bannerLabel : (existing?.bannerLabel ?? null)
        const nextBannerHeading =
          bannerHeading !== undefined ? bannerHeading : (existing?.bannerHeading ?? null)

        const record = existing
          ? await tx.oneTeamContent.update({
              where: { id: existing.id },
              data: {
                sectionEyebrow: nextSectionEyebrow,
                sectionHeading: nextSectionHeading,
                sectionDescription: nextSectionDescription,
                bannerLabel: nextBannerLabel,
                bannerHeading: nextBannerHeading,
                luxuryVillasImageUrl: nextVillasUrl,
                luxuryVillasMediaAssetId: villasAssetId,
                commercialImageUrl: nextCommercialUrl,
                commercialMediaAssetId: commercialAssetId,
                skyResidencesImageUrl: nextSkyUrl,
                skyResidencesMediaAssetId: skyAssetId,
                waterfrontImageUrl: nextWaterfrontUrl,
                waterfrontMediaAssetId: waterfrontAssetId,
                centerVideoUrl: nextCenterVideoUrl,
                centerVideoMediaAssetId: videoAssetId,
                updatedBy: auth.email,
              },
            })
          : await tx.oneTeamContent.create({
              data: {
                sectionEyebrow: nextSectionEyebrow,
                sectionHeading: nextSectionHeading,
                sectionDescription: nextSectionDescription,
                bannerLabel: nextBannerLabel,
                bannerHeading: nextBannerHeading,
                luxuryVillasImageUrl: nextVillasUrl,
                luxuryVillasMediaAssetId: villasAssetId,
                commercialImageUrl: nextCommercialUrl,
                commercialMediaAssetId: commercialAssetId,
                skyResidencesImageUrl: nextSkyUrl,
                skyResidencesMediaAssetId: skyAssetId,
                waterfrontImageUrl: nextWaterfrontUrl,
                waterfrontMediaAssetId: waterfrontAssetId,
                centerVideoUrl: nextCenterVideoUrl,
                centerVideoMediaAssetId: videoAssetId,
                updatedBy: auth.email,
              },
            })

        await syncLegacyTables(tx)
        return record
      })
    } catch (txErr) {
      if (!isMissingCmsExtensionError(txErr)) {
        throw txErr
      }
      // Graceful fallback when OneTeamContent table/columns have not yet been migrated on primary DB
      await db.$transaction(async (tx) => {
        await syncLegacyTables(tx)
      })
      updated = {
        id: 'legacy-sync',
        sectionEyebrow: sectionEyebrow ?? null,
        sectionHeading: sectionHeading ?? null,
        sectionDescription: sectionDescription ?? null,
        bannerLabel: bannerLabel ?? null,
        bannerHeading: bannerHeading ?? null,
        luxuryVillasImageUrl: luxuryVillasImageUrl ?? null,
        commercialImageUrl: commercialImageUrl ?? null,
        skyResidencesImageUrl: skyResidencesImageUrl ?? null,
        waterfrontImageUrl: waterfrontImageUrl ?? null,
        centerVideoUrl: centerVideoUrl ?? null,
      }
    }

    revalidateOneTeamAndServices()

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'UPDATE',
      entityType: 'OneTeamContent',
      entityId: updated.id,
      summary: 'Updated One Team, End to End showcase images and center video',
      metadata: {
        luxuryVillasImageUrl: updated.luxuryVillasImageUrl,
        commercialImageUrl: updated.commercialImageUrl,
        skyResidencesImageUrl: updated.skyResidencesImageUrl,
        waterfrontImageUrl: updated.waterfrontImageUrl,
        centerVideoUrl: updated.centerVideoUrl,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating One Team content:', error)
    return NextResponse.json({ error: 'Failed to save One Team content' }, { status: 500 })
  }
}
