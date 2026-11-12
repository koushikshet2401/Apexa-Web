import React from 'react'
import { db } from '@/lib/db'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'
import CollectionMediaClient, { CollectionCountryMediaItem } from '@/components/admin/CollectionMediaClient'

export const dynamic = 'force-dynamic'

export default async function AdminCollectionMediaPage() {
  let migrationPending = false
  let countries: any[] = []
  let advisoryVideoUrl: string | null = null

  try {
    const [countryRows, homepage] = await Promise.all([
      db.country.findMany({
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          collectionMedia: true,
          _count: { select: { properties: true } },
        },
      }),
      db.homepageContent.findFirst({ select: { advisoryVideoUrl: true } }).catch(() => null),
    ])
    countries = countryRows
    advisoryVideoUrl = homepage?.advisoryVideoUrl ?? null
  } catch (err) {
    if (isMissingCmsExtensionError(err)) {
      migrationPending = true
      const [countryRows, homepage] = await Promise.all([
        db.country.findMany({
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: { select: { properties: true } },
          },
        }),
        db.homepageContent.findFirst({ select: { advisoryVideoUrl: true } }).catch(() => null),
      ])
      countries = countryRows
      advisoryVideoUrl = homepage?.advisoryVideoUrl ?? null
    } else {
      throw err
    }
  }

  const initialCountries: CollectionCountryMediaItem[] = countries.map((country) => ({
    countryId: country.id,
    slug: country.slug,
    name: country.name,
    displayName: country.displayName,
    region: country.region,
    isPublished: country.isPublished,
    displayOrder: country.displayOrder,
    propertyCount: country._count?.properties ?? 0,
    coverImageUrl: country.collectionMedia?.coverImageUrl ?? country.cardImage ?? country.heroVideoThumb ?? null,
    heroVideoUrl: country.collectionMedia?.heroVideoUrl ?? country.heroVideoUrl ?? null,
    updatedBy: country.collectionMedia?.updatedBy ?? null,
    updatedAt: country.collectionMedia?.updatedAt ?? country.updatedAt,
  }))

  return (
    <CollectionMediaClient
      initialCountries={initialCountries}
      initialAdvisoryVideoUrl={advisoryVideoUrl}
      migrationPending={migrationPending}
    />
  )
}
