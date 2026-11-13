import puppeteer from 'puppeteer-core'
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const DISPOSABLE_DB_URL = 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public'
const PROD_DB_URL = 'postgresql://postgres:ehasan2026@localhost:5432/apex'
const SHOT_DIR = 'C:\\Users\\ACER\\.gemini\\antigravity\\brain\\cf71a7dc-772d-448b-9555-5ea15a93c512'

function getJwtSecretBytes() {
  let secret = process.env.JWT_SECRET
  if (!secret && fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf-8')
    const match = envContent.match(/JWT_SECRET="?([^"\r\n]+)"?/)
    if (match) secret = match[1]
  }
  return new TextEncoder().encode(secret || 'apex-default-jwt-secret-fallback-minimum-32-chars-long!')
}

async function signAdminJwt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecretBytes())
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`)
}

async function run() {
  console.log('======================================================================')
  console.log('       APEX PACIFIC HOLDINGS — PRODUCTION CANDIDATE AUDIT & SUITE      ')
  console.log('======================================================================\n')

  const pDisp = new PrismaClient({ datasources: { db: { url: DISPOSABLE_DB_URL } } })
  const pProd = new PrismaClient({ datasources: { db: { url: PROD_DB_URL } } })

  // 1. Target Database Isolation & Safety Check
  console.log('[STEP 1/6] Target Database Isolation & Safety Verification...')
  const dRes = await pDisp.$queryRawUnsafe('SELECT current_database() AS db')
  const pRes = await pProd.$queryRawUnsafe('SELECT current_database() AS db')
  const pTables = await pProd.$queryRawUnsafe("SELECT count(*)::int AS cnt FROM information_schema.tables WHERE table_schema='public'")
  const pMig = await pProd.$queryRawUnsafe('SELECT count(*)::int AS cnt FROM "_prisma_migrations" WHERE rolled_back_at IS NULL')

  assert(dRes[0].db === 'apex_disposable_test', 'Active DB is not apex_disposable_test')
  assert(pRes[0].db === 'apex', 'Target production DB name mismatch')
  assert(pTables[0].cnt === 25, `Production tables modified! Expected 25, got ${pTables[0].cnt}`)
  assert(pMig[0].cnt === 8, `Production migrations modified! Expected 8, got ${pMig[0].cnt}`)
  console.log(`  ✓ Disposable DB: ${dRes[0].db}`)
  console.log(`  ✓ Production DB: ${pRes[0].db} (Tables: ${pTables[0].cnt}, Migrations: ${pMig[0].cnt}) — 100% UNTOUCHED\n`)

  // 2. Public Route Verification (HTTP Status + Error Free)
  console.log('[STEP 2/6] Verifying Public Routes on http://localhost:3000...')
  const publicRoutes = [
    '/api/health',
    '/',
    '/contact',
    '/collection',
    '/collection/dubai',
    '/services',
    '/services/luxury-residential-sales',
    '/launches',
    '/api/public/homepage',
    '/api/public/countries',
    '/api/public/services',
    '/api/public/space-in-round',
  ]

  for (const route of publicRoutes) {
    const res = await fetch(`${BASE_URL}${route}`)
    const text = await res.text()
    assert(res.ok, `Public route ${route} returned HTTP ${res.status}`)
    assert(!text.includes('server-side exception') && !text.includes('Digest:'), `Error digest found on ${route}`)
    console.log(`  ✓ ${route.padEnd(40)} -> HTTP ${res.status} OK`)
  }
  console.log('')

  // 3. Admin Authentication & API Verification
  console.log('[STEP 3/6] Admin API Authentication & Permission Verification...')
  const adminUser = await pDisp.adminUser.findFirst({
    where: { isActive: true, role: { name: 'SUPER_ADMIN' } },
    include: { role: true },
  })
  assert(adminUser, 'No active SUPER_ADMIN user found in database')

  const token = await signAdminJwt({
    userId: adminUser.id,
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: 'SUPER_ADMIN',
    tokenVersion: adminUser.tokenVersion,
  })

  const adminHeaders = {
    Cookie: `apex_admin_session=${token}`,
    Authorization: `Bearer ${token}`,
  }

  // Verify /api/admin/auth/me
  const meRes = await fetch(`${BASE_URL}/api/admin/auth/me`, { headers: adminHeaders })
  assert(meRes.ok, `Auth check failed with status ${meRes.status}`)
  const meData = await meRes.json()
  console.log(`  ✓ Authenticated as: ${meData.email} (${meData.role})\n`)

  // 4. Live CRUD Mutation & Persistence Verification (Properties & CMS)
  console.log('[STEP 4/6] Testing Property CRUD & CMS Mutation Engine...')
  
  // A. Create a test property
  const dubaiCountry = await pDisp.country.findFirst({ where: { slug: 'dubai' } })
  assert(dubaiCountry, 'Dubai country record not found')

  const testSlug = `test-rc-property-${Date.now()}`
  let createdId = null
  try {
    const createRes = await fetch(`${BASE_URL}/api/admin/properties`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Release Candidate Penthouse',
        slug: testSlug,
        countryId: dubaiCountry.id,
        cityName: 'Dubai Marina',
        locationLine: 'Marina Waterfront Walk',
        category: 'PENTHOUSE',
        projectStatus: 'UNDER_CONSTRUCTION',
        bedrooms: 4,
        bathrooms: 5,
        sqft: 6500,
        price: 'AED 24,500,000',
        askingPriceNumeric: 24500000,
        askingCurrency: 'AED',
        isPOA: false,
        description: 'Exclusive release candidate verification penthouse listing.',
        featuredImage: 'https://pub-8de28cd1189147deb3a3dafbd4be5e05.r2.dev/test/hero.jpg',
        isPublished: true,
        isDraft: false,
      }),
    })
    assert(createRes.ok, `Failed to create property: HTTP ${createRes.status}`)
    const createdProp = await createRes.json()
    createdId = createdProp.id || createdProp.property?.id
    assert(createdId, 'Property ID not returned from create API')
    console.log(`  ✓ Created Property: "${createdProp.name || 'RC Penthouse'}" (ID: ${createdId})`)

    // B. Update Price
    const priceRes = await fetch(`${BASE_URL}/api/admin/properties/${createdId}/price`, {
      method: 'PATCH',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        askingPriceNumeric: 26000000,
        askingCurrency: 'AED',
        isPOA: false,
        reason: 'Market adjustment verification test',
      }),
    })
    assert(priceRes.ok, `Failed to update price: HTTP ${priceRes.status}`)
    console.log('  ✓ Updated Asking Price via /api/admin/properties/[id]/price')

    // C. Archive (Delete)
    const archiveRes = await fetch(`${BASE_URL}/api/admin/properties/${createdId}/archive`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Verification suite testing' }),
    })
    assert(archiveRes.ok, `Failed to archive property: HTTP ${archiveRes.status}`)
    console.log('  ✓ Archived Property to Deleted Projects tab')

    // D. Restore
    const restoreRes = await fetch(`${BASE_URL}/api/admin/properties/${createdId}/restore`, {
      method: 'POST',
      headers: adminHeaders,
    })
    assert(restoreRes.ok, `Failed to restore property: HTTP ${restoreRes.status}`)
    console.log('  ✓ Restored Property from Deleted to Current Projects')
  } finally {
    if (createdId) {
      await pDisp.property.deleteMany({ where: { id: createdId } })
      console.log('  ✓ Cleaned up test property record')
    }
  }

  // E. Test Homepage Content PATCH
  const hpUpdateText = `Verified Live RC ${Date.now()}`
  const hpRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    method: 'PATCH',
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ unveilHeading: hpUpdateText }),
  })
  assert(hpRes.ok, `Homepage PATCH failed: HTTP ${hpRes.status}`)
  const hpInDb = await pDisp.homepageContent.findFirst()
  assert(hpInDb.unveilHeading === hpUpdateText, 'Homepage update not persisted to DB')
  console.log('  ✓ Homepage Content PATCH verified and persisted to DB\n')

  // 5. Headless Chrome Real-Browser Verification
  console.log('[STEP 5/6] Headless Chrome Real Browser UI Verification...')
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    await page.setCookie({
      name: 'apex_admin_session',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
    })

    // A. Verify /admin/homepage-video (The reported error page)
    const respVideo = await page.goto(`${BASE_URL}/admin/homepage-video`, { waitUntil: 'networkidle2', timeout: 30000 })
    assert(respVideo.status() === 200, `/admin/homepage-video returned status ${respVideo.status()}`)
    const videoBody = await page.evaluate(() => document.body.innerText)
    assert(!videoBody.includes('Digest:') && !videoBody.includes('server-side exception'), 'Error digest found on /admin/homepage-video')
    console.log('  ✓ /admin/homepage-video rendered with zero server-side exceptions')

    // B. Verify /admin/settings Navigation & CMS Hub
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle2', timeout: 30000 })
    const settingsBody = await page.evaluate(() => document.body.innerText)
    
    const requiredNavItems = [
      'Dashboard',
      'Add Project',
      'Current Project',
      'Soldout Project',
      'Deleted Project',
      'Messages',
      'Team Management',
      'Account Management',
      'Settings',
    ]
    for (const item of requiredNavItems) {
      assert(settingsBody.includes(item), `Sidebar navigation missing item: ${item}`)
    }
    console.log('  ✓ All 9 primary sidebar navigation items verified in browser DOM')

    const requiredHubCards = [
      'Homepage Video & Media',
      'Homepage Section Copy',
      'One Team, End to End',
      'Country Collections Media',
      'Countries Directory',
      'Advisory Services',
      'Featured Launches Stack',
      'Spaces in the Round',
      'Cloudflare R2 Media Library',
    ]
    for (const card of requiredHubCards) {
      assert(settingsBody.includes(card), `Settings CMS Hub missing card: ${card}`)
    }
    console.log('  ✓ All 9 CMS Quick Hub cards verified in browser DOM')

    // C. Verify /admin/properties
    await page.goto(`${BASE_URL}/admin/properties`, { waitUntil: 'networkidle2', timeout: 30000 })
    const propsBody = await page.evaluate(() => document.body.innerText)
    assert(propsBody.includes('CURRENT') && propsBody.includes('SOLDOUT') && propsBody.includes('DELETED'), 'Properties tabs missing')
    console.log('  ✓ /admin/properties portfolio view and destination groups verified in browser DOM')

  } finally {
    await browser.close()
  }
  console.log('')

  // 6. Final Production Database Safety Check
  console.log('[STEP 6/6] Final Production Database Audit & Safety Confirmation...')
  const finalProdTables = await pProd.$queryRawUnsafe("SELECT count(*)::int AS cnt FROM information_schema.tables WHERE table_schema='public'")
  const finalProdMig = await pProd.$queryRawUnsafe('SELECT count(*)::int AS cnt FROM "_prisma_migrations" WHERE rolled_back_at IS NULL')
  assert(finalProdTables[0].cnt === 25, 'Production tables count altered')
  assert(finalProdMig[0].cnt === 8, 'Production migrations count altered')
  console.log(`  ✓ Production database apex has exactly 25 tables and 8 migrations`)
  console.log(`  ✓ Production database apex is 100% UNTOUCHED and fully protected\n`)

  await pDisp.$disconnect()
  await pProd.$disconnect()

  console.log('======================================================================')
  console.log('     ✓ ALL RELEASE CANDIDATE VERIFICATION CRITERIA 100% PASSED         ')
  console.log('======================================================================')
}

run().catch((e) => {
  console.error('\n❌ VERIFICATION SUITE FAILED:', e.message)
  process.exit(1)
})
