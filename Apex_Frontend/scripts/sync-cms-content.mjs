#!/usr/bin/env node
/**
 * Idempotent CMS backfill script for the Dynamic Content Management rollout.
 *
 * Safe to run multiple times:
 * - Never deletes or truncates tables.
 * - Never overwrites existing non-null CMS media URLs or admin-edited JSON fields.
 * - Ensures new RBAC permissions, OneTeamContent, CollectionMedia, and ServiceCategory
 *   focus/deliverables metadata are populated from existing database records.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/sync-cms-content.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const NEW_PERMISSIONS = [
  { module: 'ONE_TEAM', action: 'READ', description: 'View One Team End-to-End media configuration' },
  { module: 'ONE_TEAM', action: 'UPDATE', description: 'Upload, replace, and remove One Team End-to-End media' },
  { module: 'COLLECTION_MEDIA', action: 'READ', description: 'View per-country Collection Media settings' },
  { module: 'COLLECTION_MEDIA', action: 'UPDATE', description: 'Manage cover images and hero videos per country' },
  { module: 'SERVICES', action: 'UPDATE', description: 'Edit service category metadata and deliverables' },
]

const ROLE_PERMISSION_GRANTS = {
  role_super_admin: NEW_PERMISSIONS.map((p) => `${p.module}:${p.action}`),
  role_content_editor: NEW_PERMISSIONS.map((p) => `${p.module}:${p.action}`),
}

const DEFAULT_SERVICE_METADATA = {
  'luxury-villas': {
    architecturalFocus: [
      'Microclimate & Sun Orientation',
      'Artisanal Stone & Timber Joinery',
      'Integrated Native Landscapes',
      'Multi-Generational Spatial Flow',
    ],
    deliverables: [
      {
        title: 'Topographic & Solar Orientation',
        detail: 'Site-specific study maximizing prevailing breezes, privacy sightlines, and natural daylight.',
      },
      {
        title: 'Bespoke Architectural Engineering',
        detail: 'Comprehensive structural, MEP, and building envelope design with zero compromise on purity.',
      },
      {
        title: 'Courtyard & Water Architecture',
        detail: 'Seamless integration of reflecting pools, cascading water features, and internal atriums.',
      },
      {
        title: 'Turnkey Construction & Handover',
        detail: 'Direct execution by master craftsmen ensuring uninterrupted continuity from blueprint to keys.',
      },
    ],
  },
  'sky-residences': {
    architecturalFocus: [
      'Full-Floor Structural Grids',
      'Triple-Glazed Acoustic Facades',
      'Double-Height Entertaining Salons',
      'Private Sky-Terrace Microclimates',
    ],
    deliverables: [
      {
        title: 'Aerodynamic Envelope & Glazing',
        detail: 'Acoustic and solar-control low-iron facade assemblies tuned for elevated urban horizons.',
      },
      {
        title: 'Private Vertical Circulation',
        detail: 'Dedicated elevator lobbies and service cores preserving complete resident discretion.',
      },
      {
        title: 'Elevated Landscape Engineering',
        detail: 'Wind-resilient sky gardens and cantilevered plunge decks integrated into the slab.',
      },
      {
        title: 'Acoustic & Climate Automation',
        detail: 'Hospitality-grade environmental systems balancing silent operation and indoor air purity.',
      },
    ],
  },
  'commercial-properties': {
    architecturalFocus: [
      'Civic Scale & Pedestrian Porosity',
      'Daylight-Harvesting Atrium Volumes',
      'Hospitality-Grade Core Finishing',
      'Future-Ready Modular Infrastructure',
    ],
    deliverables: [
      {
        title: 'Civic Masterplanning & Massing',
        detail: 'Architectural compositions that elevate the surrounding streetscape and pedestrian realm.',
      },
      {
        title: 'Flexible Structural Spans',
        detail: 'Column-free interior zones adaptable across luxury retail, galleries, and private offices.',
      },
      {
        title: 'Artisanal Lobby & Core Curation',
        detail: 'Gallery-caliber stonework, bronze detailing, and commissioned arrival sequences.',
      },
      {
        title: 'Asset Lifecycle Stewardship',
        detail: 'Sustainable engineering designed for multi-decade institutional asset performance.',
      },
    ],
  },
  'waterfront-residences': {
    architecturalFocus: [
      'Marine-Grade Material Engineering',
      'Unobstructed Horizon Sightlines',
      'Private Berth & Foreshore Integration',
      'Salt-Mist Resilient Landscaping',
    ],
    deliverables: [
      {
        title: 'Coastal Geotech & Marine Engineering',
        detail: 'Deep foundation systems and shoreline stabilization tuned to tidal and swell conditions.',
      },
      {
        title: 'Hurricane & Salt-Air Facades',
        detail: 'Corrosion-resistant architectural bronze, titanium-zinc detailing, and laminated marine glass.',
      },
      {
        title: 'Private Yacht Mooring & Access',
        detail: 'Custom-engineered deep-water jetties, boat houses, and seamless sea-to-villa thresholds.',
      },
      {
        title: 'Horizon Pool & Deck Scenography',
        detail: 'Zero-edge infinity waterlines optically continuous with the ocean horizon.',
      },
    ],
  },
}

function getDefaultMetaForService(slug) {
  if (DEFAULT_SERVICE_METADATA[slug]) return DEFAULT_SERVICE_METADATA[slug]
  if (slug.includes('villa')) return DEFAULT_SERVICE_METADATA['luxury-villas']
  if (slug.includes('sky')) return DEFAULT_SERVICE_METADATA['sky-residences']
  if (slug.includes('waterfront')) return DEFAULT_SERVICE_METADATA['waterfront-residences']
  return DEFAULT_SERVICE_METADATA['commercial-properties']
}

async function main() {
  console.log('Starting idempotent CMS backfill...')

  // 1. Ensure RBAC permissions & grants
  const permIdByKey = {}
  for (const perm of NEW_PERMISSIONS) {
    const upserted = await prisma.adminPermission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: { description: perm.description },
      create: perm,
    })
    permIdByKey[`${perm.module}:${perm.action}`] = upserted.id
  }

  for (const [roleId, permKeys] of Object.entries(ROLE_PERMISSION_GRANTS)) {
    const role = await prisma.adminRole.findUnique({ where: { id: roleId } })
    if (!role) continue
    for (const key of permKeys) {
      const permissionId = permIdByKey[key]
      if (!permissionId) continue
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      })
    }
  }
  console.log('✓ Permissions and role grants verified.')

  // 2. Backfill OneTeamContent (only missing fields)
  const [existingOneTeam, homepage, services] = await Promise.all([
    prisma.oneTeamContent.findFirst({ orderBy: { createdAt: 'asc' } }),
    prisma.homepageContent.findFirst(),
    prisma.serviceCategory.findMany(),
  ])

  const villasSvc = services.find((s) => s.slug.includes('villa'))
  const commercialSvc = services.find((s) => s.slug.includes('commercial'))
  const skySvc = services.find((s) => s.slug === 'sky-residences' || s.slug.includes('sky'))
  const waterfrontSvc = services.find((s) => s.slug === 'waterfront-residences' || s.slug.includes('waterfront'))

  const fallbackVillas = villasSvc?.image && !villasSvc.image.startsWith('/uploads/') ? villasSvc.image : null
  const fallbackCommercial = commercialSvc?.image && !commercialSvc.image.startsWith('/uploads/') ? commercialSvc.image : null
  const fallbackSky = skySvc?.image && !skySvc.image.startsWith('/uploads/') ? skySvc.image : null
  const fallbackWaterfront = waterfrontSvc?.image && !waterfrontSvc.image.startsWith('/uploads/') ? waterfrontSvc.image : null
  const fallbackVideo = homepage?.oneTeamVideoUrl && !homepage.oneTeamVideoUrl.startsWith('/uploads/') ? homepage.oneTeamVideoUrl : null

  if (!existingOneTeam) {
    await prisma.oneTeamContent.create({
      data: {
        luxuryVillasImageUrl: fallbackVillas,
        commercialImageUrl: fallbackCommercial,
        skyResidencesImageUrl: fallbackSky,
        waterfrontImageUrl: fallbackWaterfront,
        centerVideoUrl: fallbackVideo,
      },
    })
    console.log('✓ Created OneTeamContent row.')
  } else {
    await prisma.oneTeamContent.update({
      where: { id: existingOneTeam.id },
      data: {
        luxuryVillasImageUrl: existingOneTeam.luxuryVillasImageUrl ?? fallbackVillas,
        commercialImageUrl: existingOneTeam.commercialImageUrl ?? fallbackCommercial,
        skyResidencesImageUrl: existingOneTeam.skyResidencesImageUrl ?? fallbackSky,
        waterfrontImageUrl: existingOneTeam.waterfrontImageUrl ?? fallbackWaterfront,
        centerVideoUrl: existingOneTeam.centerVideoUrl ?? fallbackVideo,
      },
    })
    console.log('✓ Preserved existing OneTeamContent row (filled null fields only).')
  }

  // 3. Backfill CollectionMedia per country (only when missing / null fields)
  const countries = await prisma.country.findMany()
  let syncedCountries = 0
  for (const country of countries) {
    const existing = await prisma.collectionMedia.findUnique({ where: { countryId: country.id } })
    const coverFallback = country.cardImage || country.heroVideoThumb || null
    const videoFallback = country.heroVideoUrl || null
    if (!existing) {
      await prisma.collectionMedia.create({
        data: {
          countryId: country.id,
          coverImageUrl: coverFallback,
          heroVideoUrl: videoFallback,
        },
      })
    } else {
      await prisma.collectionMedia.update({
        where: { countryId: country.id },
        data: {
          coverImageUrl: existing.coverImageUrl ?? coverFallback,
          heroVideoUrl: existing.heroVideoUrl ?? videoFallback,
        },
      })
    }
    syncedCountries++
  }
  console.log(`✓ Synced CollectionMedia for ${syncedCountries} countries.`)

  // 4. Backfill ServiceCategory architecturalFocus & deliverables where null
  let updatedServices = 0
  for (const svc of services) {
    if (svc.architecturalFocus != null && svc.deliverables != null) continue
    const defaults = getDefaultMetaForService(svc.slug)
    await prisma.serviceCategory.update({
      where: { id: svc.id },
      data: {
        architecturalFocus: svc.architecturalFocus ?? defaults.architecturalFocus,
        deliverables: svc.deliverables ?? defaults.deliverables,
      },
    })
    updatedServices++
  }
  console.log(`✓ Backfilled focus & deliverables on ${updatedServices} ServiceCategory rows.`)
  console.log('CMS sync complete.')
}

main()
  .catch((err) => {
    console.error('CMS sync failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
