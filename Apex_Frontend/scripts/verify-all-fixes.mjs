import { PrismaClient } from '../node_modules/@prisma/client/default.js'

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test' } }
})

async function run() {
  console.log('--- STARTING COMPREHENSIVE VERIFICATION ---')

  // 1. Admin login to obtain session cookie
  const loginRes = await fetch('http://localhost:3000/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@apexpacificholdings.com', password: 'Admin@Apex2025!' }),
  })
  const setCookie = loginRes.headers.get('set-cookie')
  console.log(`[1] Admin Login Status: ${loginRes.status} (Cookie acquired: ${Boolean(setCookie)})`)

  const cookieHeader = { Cookie: setCookie || '' }

  // 2. Test /admin/homepage_video redirect to /admin/homepage-video
  const redirectRes = await fetch('http://localhost:3000/admin/homepage_video', {
    redirect: 'manual',
    headers: cookieHeader,
  })
  console.log(`[2] /admin/homepage_video status: ${redirectRes.status}, location: ${redirectRes.headers.get('location')}`)

  // 3. Test /admin/homepage-video loads successfully (200 OK)
  const hpVideoRes = await fetch('http://localhost:3000/admin/homepage-video', {
    headers: cookieHeader,
  })
  console.log(`[3] /admin/homepage-video status: ${hpVideoRes.status} (Expected: 200)`)

  // 4. Test /api/admin/countries count for Dubai
  const countriesRes = await fetch('http://localhost:3000/api/admin/countries', {
    headers: cookieHeader,
  })
  const countriesData = await countriesRes.json()
  const dubaiItem = countriesData.find((c) => c.slug === 'dubai')
  console.log(`[4] Countries API -> Dubai active property count: ${dubaiItem?._count?.properties ?? 'N/A'} (Expected: 0)`)

  // 5. Test /api/admin/services count for luxury-villas
  const servicesRes = await fetch('http://localhost:3000/api/admin/services', {
    headers: cookieHeader,
  })
  const servicesData = await servicesRes.json()
  const luxuryVillas = servicesData.find((s) => s.slug === 'luxury-villas')
  console.log(`[5] Services API -> Luxury Villas active property count: ${luxuryVillas?._count?.properties ?? 'N/A'} (Expected: 1)`)

  // 6. Test /admin/space-in-round properties
  const spacesInDb = await prisma.property.findMany({
    where: { isSpaceInRound: true, isArchived: false, isPublished: true },
    select: { id: true, name: true, spaceOrder: true, country: { select: { slug: true, displayName: true } } },
    orderBy: { spaceOrder: 'asc' },
  })
  console.log(`[6] Space in Round active count: ${spacesInDb.length}`)
  for (const s of spacesInDb) {
    console.log(`    - Slot ${s.spaceOrder}: "${s.name}" (${s.country?.displayName || 'Unknown'})`)
  }

  // 7. Test public /collection/dubai page
  const publicDubaiRes = await fetch('http://localhost:3000/collection/dubai')
  const publicDubaiHtml = await publicDubaiRes.text()
  const hasPalmRoyal = publicDubaiHtml.includes('Palm Royal Showcase')
  const hasEmptyNotice = publicDubaiHtml.includes('No active residences currently published')
  console.log(`[7] Public /collection/dubai: Contains Palm Royal Showcase? ${hasPalmRoyal} (Expected: false)`)
  console.log(`    Contains clean empty state notice? ${hasEmptyNotice} (Expected: true)`)

  // 8. Test /api/admin/media/presign for direct upload
  const presignRes = await fetch('http://localhost:3000/api/admin/media/presign', {
    method: 'POST',
    headers: { ...cookieHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: 'damac_waterfront_verification.mp4',
      contentType: 'video/mp4',
      folder: 'one-team',
      fileSize: 45000000, // 45MB
      mediaRole: 'ONE_TEAM_CENTER_VIDEO',
    }),
  })
  const presignData = await presignRes.json()
  console.log(`[8] Media Presign for 45MB Video: Status ${presignRes.status}, Key: ${presignData?.key}`)

  // 9. Test Permanent Delete & Purge API on a temporary dummy property
  const dummy = await prisma.property.create({
    data: {
      name: 'Temp Purge Verification Asset',
      slug: `temp-purge-${Date.now()}`,
      isArchived: true,
      archivedReason: 'Purge test',
      mainImage: 'https://pub-8de28cd1189147deb3a3dafbd4be5e05.r2.dev/projects/dummy-temp-test.jpg',
    }
  })
  console.log(`[9] Created temp dummy property for purge test: ${dummy.id}`)

  const purgeRes = await fetch(`http://localhost:3000/api/admin/properties/${dummy.id}?permanent=true`, {
    method: 'DELETE',
    headers: cookieHeader,
  })
  const purgeData = await purgeRes.json()
  console.log(`[9] Purge API Response: Status ${purgeRes.status}, Purged: ${purgeData.purged}, Message: "${purgeData.message}"`)

  const verifyPurged = await prisma.property.findUnique({ where: { id: dummy.id } })
  console.log(`[9] DB verification: Dummy property exists after purge? ${Boolean(verifyPurged)} (Expected: false)`)

  await prisma.$disconnect()
  console.log('--- VERIFICATION COMPLETED SUCCESSFULLY ---')
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
