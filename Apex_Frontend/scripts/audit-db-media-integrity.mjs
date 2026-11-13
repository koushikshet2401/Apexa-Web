import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public',
    },
  },
})

async function main() {
  console.log('=== DATABASE MEDIA INTEGRITY AUDIT ===\n')

  // 1. Properties
  const properties = await prisma.property.findMany({
    include: { images: true, country: true },
  })
  console.log(`Auditing ${properties.length} properties...`)
  let nonR2PropertyMedia = 0
  let uploadPropertyMedia = 0

  for (const p of properties) {
    const urls = [
      { field: 'mainImage', url: p.mainImage },
      { field: 'mainVideoUrl', url: p.mainVideoUrl },
      { field: 'mainVideoThumb', url: p.mainVideoThumb },
      { field: 'heroBannerImage', url: p.heroBannerImage },
      { field: 'floorPlanUrl', url: p.floorPlanUrl },
      { field: 'brochureUrl', url: p.brochureUrl },
      { field: 'spaceRoundImage', url: p.spaceRoundImage },
      ...p.images.map((img) => ({ field: `gallery[${img.order}]`, url: img.url })),
    ].filter((item) => item.url)

    for (const item of urls) {
      if (item.url.includes('/uploads/')) {
        console.warn(`  [UPLOAD DETECTED] Property "${p.name}" (${p.slug}) ${item.field}: ${item.url}`)
        uploadPropertyMedia++
      }
      if (!item.url.includes('.r2.dev') && !item.url.includes('r2.cloudflarestorage.com')) {
        console.log(`  [NON-R2] Property "${p.name}" (${p.slug}) ${item.field}: ${item.url}`)
        nonR2PropertyMedia++
      }
    }
  }

  // 2. Countries & CollectionMedia
  const countries = await prisma.country.findMany({
    include: { collectionMedia: true },
  })
  console.log(`\nAuditing ${countries.length} countries...`)
  let nonR2CountryMedia = 0
  for (const c of countries) {
    const urls = [
      { field: 'heroVideoUrl', url: c.heroVideoUrl },
      { field: 'heroVideoThumb', url: c.heroVideoThumb },
      { field: 'cardImage', url: c.cardImage },
      { field: 'collectionMedia.heroVideoUrl', url: c.collectionMedia?.heroVideoUrl },
      { field: 'collectionMedia.heroPosterUrl', url: c.collectionMedia?.heroPosterUrl },
      { field: 'collectionMedia.coverImageUrl', url: c.collectionMedia?.coverImageUrl },
    ].filter((item) => item.url)

    for (const item of urls) {
      if (!item.url.includes('.r2.dev') && !item.url.includes('r2.cloudflarestorage.com')) {
        console.log(`  [NON-R2] Country "${c.name}" ${item.field}: ${item.url}`)
        nonR2CountryMedia++
      }
    }
  }

  // 3. ServiceCategory
  const services = await prisma.serviceCategory.findMany()
  console.log(`\nAuditing ${services.length} services...`)
  let nonR2ServiceMedia = 0
  for (const s of services) {
    const urls = [
      { field: 'image', url: s.image },
      { field: 'videoUrl', url: s.videoUrl },
    ].filter((item) => item.url)

    for (const item of urls) {
      if (!item.url.includes('.r2.dev') && !item.url.includes('r2.cloudflarestorage.com')) {
        console.log(`  [NON-R2] Service "${s.name}" ${item.field}: ${item.url}`)
        nonR2ServiceMedia++
      }
    }
  }

  // 4. HomepageContent & OneTeamContent
  const homepage = await prisma.homepageContent.findFirst()
  const oneTeam = await prisma.oneTeamContent.findFirst()
  console.log('\nAuditing Homepage & OneTeam Content...')
  const homeUrls = [
    { field: 'homepage.heroVideoUrl', url: homepage?.heroVideoUrl },
    { field: 'homepage.heroVideoThumb', url: homepage?.heroVideoThumb },
    { field: 'homepage.advisoryVideoUrl', url: homepage?.advisoryVideoUrl },
    { field: 'homepage.oneTeamVideoUrl', url: homepage?.oneTeamVideoUrl },
    { field: 'oneTeam.centerVideoUrl', url: oneTeam?.centerVideoUrl },
    { field: 'oneTeam.luxuryVillasImageUrl', url: oneTeam?.luxuryVillasImageUrl },
    { field: 'oneTeam.commercialImageUrl', url: oneTeam?.commercialImageUrl },
    { field: 'oneTeam.skyResidencesImageUrl', url: oneTeam?.skyResidencesImageUrl },
    { field: 'oneTeam.waterfrontImageUrl', url: oneTeam?.waterfrontImageUrl },
  ].filter((item) => item.url)

  let nonR2HomeMedia = 0
  for (const item of homeUrls) {
    if (!item.url.includes('.r2.dev') && !item.url.includes('r2.cloudflarestorage.com')) {
      console.log(`  [NON-R2] ${item.field}: ${item.url}`)
      nonR2HomeMedia++
    }
  }

  console.log('\n=== AUDIT SUMMARY ===')
  console.log(`Local /uploads/ references: ${uploadPropertyMedia}`)
  console.log(`Non-R2 Property media: ${nonR2PropertyMedia}`)
  console.log(`Non-R2 Country media: ${nonR2CountryMedia}`)
  console.log(`Non-R2 Service media: ${nonR2ServiceMedia}`)
  console.log(`Non-R2 Homepage/OneTeam media: ${nonR2HomeMedia}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
