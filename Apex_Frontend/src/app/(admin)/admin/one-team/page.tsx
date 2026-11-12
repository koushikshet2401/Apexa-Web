import React from 'react'
import { db } from '@/lib/db'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'
import OneTeamAdminClient from '@/components/admin/OneTeamAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminOneTeamPage() {
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
        isPublished: true,
      },
    }),
    db.homepageContent.findFirst({
      select: { oneTeamVideoUrl: true, updatedAt: true },
    }),
  ])

  const luxuryVillas = services.find((s) => s.slug === 'luxury-villas')
  const commercial = services.find((s) => s.slug === 'commercial-properties')
  const sky = services.find((s) => s.slug === 'sky-residences')
  const waterfront = services.find((s) => s.slug === 'waterfront-residences')

  return (
    <OneTeamAdminClient
      initialData={{
        id: oneTeam?.id || null,
        luxuryVillasImageUrl: oneTeam?.luxuryVillasImageUrl ?? luxuryVillas?.image ?? null,
        commercialImageUrl: oneTeam?.commercialImageUrl ?? commercial?.image ?? null,
        skyResidencesImageUrl: oneTeam?.skyResidencesImageUrl ?? sky?.image ?? null,
        waterfrontImageUrl: oneTeam?.waterfrontImageUrl ?? waterfront?.image ?? null,
        centerVideoUrl: oneTeam?.centerVideoUrl ?? homepage?.oneTeamVideoUrl ?? null,
        updatedBy: oneTeam?.updatedBy ?? null,
        updatedAt: oneTeam?.updatedAt ?? homepage?.updatedAt ?? null,
        migrationPending,
        services,
      }}
    />
  )
}
