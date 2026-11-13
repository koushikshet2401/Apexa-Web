import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex?schema=public' } },
})

async function main() {
  console.log('=== PHASE 10: PRODUCTION DATA COMPATIBILITY AUDIT (READ-ONLY) ===\n')

  const currentDb = await prisma.$queryRawUnsafe('SELECT current_database() AS db')
  if (currentDb[0].db !== 'apex') throw new Error(`Wrong DB: ${currentDb[0].db}`)
  console.log('Target verified: production database apex\n')

  // Check Property columns
  const propCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'Property' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `)
  console.log('[PROPERTY COLUMNS IN PROD]:')
  console.log(propCols.map((c) => `${c.column_name} (${c.data_type})`).join(', '))

  // Query properties
  const properties = await prisma.$queryRawUnsafe(`
    SELECT p.id, p.slug, p.name, p."mainImage", p."mainVideoUrl", p."mainVideoThumb",
           p."spaceRoundImage", p."isFeaturedLaunch", p."launchOrder", p."isSpaceInRound",
           p."spaceOrder", p."isPublished", p."isPubliclyVisible", p."isArchived",
           c.name as country_name, c.slug as country_slug
    FROM "Property" p
    LEFT JOIN "Country" c ON p."countryId" = c.id
    ORDER BY p."createdAt" ASC;
  `)

  // Query property images
  const propertyImages = await prisma.$queryRawUnsafe(`
    SELECT id, "propertyId", url, "order"
    FROM "PropertyImage"
    ORDER BY "propertyId", "order" ASC;
  `)

  const imagesByProp = new Map()
  for (const img of propertyImages) {
    if (!imagesByProp.has(img.propertyId)) imagesByProp.set(img.propertyId, [])
    imagesByProp.get(img.propertyId).push(img)
  }

  console.log(`\n[6. PROPERTIES & MEDIA IN PRODUCTION] (${properties.length}):`)
  let totalPropMedia = 0
  let r2Count = 0
  let unsplashCount = 0
  let uploadCount = 0
  let localStaticCount = 0
  let otherCount = 0

  const brokenUnsplashUrls = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
  ]

  for (const p of properties) {
    const pImgs = imagesByProp.get(p.id) || []
    const mediaList = [
      { field: 'mainImage', url: p.mainImage },
      { field: 'mainVideoUrl', url: p.mainVideoUrl },
      { field: 'mainVideoThumb', url: p.mainVideoThumb },
      { field: 'spaceRoundImage', url: p.spaceRoundImage },
      ...pImgs.map((img) => ({ field: `image[${img.order}]`, url: img.url, id: img.id })),
    ].filter((m) => m.url)

    const mediaStats = { r2: 0, unsplash: 0, uploads: 0, localStatic: 0, other: 0 }
    for (const m of mediaList) {
      totalPropMedia++
      if (m.url.includes('.r2.dev') || m.url.includes('r2.cloudflarestorage.com')) {
        r2Count++; mediaStats.r2++
      } else if (m.url.includes('images.unsplash.com')) {
        unsplashCount++; mediaStats.unsplash++
      } else if (m.url.includes('/uploads/')) {
        uploadCount++; mediaStats.uploads++
      } else if (m.url.startsWith('/images/') || m.url.startsWith('/videos/')) {
        localStaticCount++; mediaStats.localStatic++
      } else {
        otherCount++; mediaStats.other++
      }
    }

    console.log(`  - Property: "${p.name}" (${p.slug}) in ${p.country_name || 'No Country'}: Published:${p.isPublished}, Visible:${p.isPubliclyVisible}, Archived:${p.isArchived}`)
    console.log(`      Launch: ${p.isFeaturedLaunch} (order: ${p.launchOrder}), Space: ${p.isSpaceInRound} (order: ${p.spaceOrder})`)
    console.log(`      Media items: ${mediaList.length} (R2: ${mediaStats.r2}, Unsplash: ${mediaStats.unsplash}, /uploads/: ${mediaStats.uploads}, localStatic: ${mediaStats.localStatic}, other: ${mediaStats.other})`)
  }

  console.log(`\n=== PRODUCTION MEDIA BREAKDOWN ===`)
  console.log(`Total property media items: ${totalPropMedia}`)
  console.log(`Cloudflare R2 URLs: ${r2Count}`)
  console.log(`External Unsplash URLs: ${unsplashCount}`)
  console.log(`Local /uploads/ URLs: ${uploadCount}`)
  console.log(`Local static paths (/images/, /videos/): ${localStaticCount}`)
  console.log(`Other URLs: ${otherCount}`)

  // 7. MediaAsset table in production
  const mediaAssetCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'MediaAsset' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `)
  console.log('[MEDIA ASSET COLUMNS IN PROD]:')
  console.log(mediaAssetCols.map((c) => `${c.column_name} (${c.data_type})`).join(', '))

  const mediaAssets = await prisma.$queryRawUnsafe(`
    SELECT * FROM "MediaAsset";
  `)
  console.log(`\n[7. MEDIA ASSETS IN PRODUCTION] (${mediaAssets.length}):`)
  for (const ma of mediaAssets) {
    console.log(`  - Key: ${ma.r2Key || ma.key}, URL: ${ma.publicUrl || ma.url}, MIME: ${ma.mimeType || ma.type}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
