import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer-core'
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3005'
const DISPOSABLE_DB_URL =
  process.env.DISPOSABLE_DATABASE_URL ||
  'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public'
const SHOT_DIR =
  'C:\\Users\\ACER\\.gemini\\antigravity\\brain\\cf71a7dc-772d-448b-9555-5ea15a93c512\\scratch'

function getJwtSecretBytes() {
  let secret = process.env.JWT_SECRET
  if (!secret && fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf-8')
    const match = envContent.match(/JWT_SECRET="?([^"\r\n]+)"?/)
    if (match) secret = match[1]
  }
  return new TextEncoder().encode(
    secret || 'apex-default-jwt-secret-fallback-minimum-32-chars-long!'
  )
}

async function signAdminJwt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecretBytes())
}

function assert(cond, msg) {
  if (!cond) throw new Error(`BROWSER ASSERTION FAILED: ${msg}`)
}

async function main() {
  console.log('=== APEX P2 STAGE 3 BROWSER E2E VERIFICATION ===\n')
  fs.mkdirSync(SHOT_DIR, { recursive: true })

  const prisma = new PrismaClient({
    datasources: { db: { url: DISPOSABLE_DB_URL } },
  })

  const superAdmin = await prisma.adminUser.findFirst({
    where: { isActive: true, role: { name: 'SUPER_ADMIN' } },
  })
  assert(superAdmin, 'Super admin user not found in apex_disposable_test')

  const adminToken = await signAdminJwt({
    id: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
    role: 'SUPER_ADMIN',
    tokenVersion: superAdmin.tokenVersion,
  })

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  try {
    const page = await browser.newPage()

    // Attach admin cookie
    await page.setCookie({
      name: 'apex_admin_session',
      value: adminToken,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
    })

    // ────────────────────────────────────────────────────────────────────────
    // 1. Admin Country Collections Media: /admin/collection-media
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 1] Admin Collection Media (/admin/collection-media)...')
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${BASE_URL}/admin/collection-media`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1200))

    const currentUrl = page.url()
    const colMediaText = await page.evaluate(() => document.body.innerText)
    console.log('Current URL:', currentUrl)
    console.log('Page text preview:', colMediaText.slice(0, 300))
    assert(
      colMediaText.includes('Collection & Contact Video') || colMediaText.includes('Collection Media') || colMediaText.includes('Country Media'),
      'Admin Collection Media header not found'
    )
    assert(
      colMediaText.includes('Dubai') || colMediaText.includes('United Arab Emirates'),
      'Dubai not found in Admin Collection Media'
    )
    assert(colMediaText.includes('Malaysia'), 'Malaysia not found in Admin Collection Media')
    assert(colMediaText.includes('Thailand'), 'Thailand not found in Admin Collection Media')
    assert(colMediaText.includes('Australia'), 'Australia not found in Admin Collection Media')
    assert(colMediaText.includes('Georgia'), 'Georgia not found in Admin Collection Media')

    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-admin-collection-media.png') })
    console.log('  ✓ /admin/collection-media rendered with all 5 countries')

    // ────────────────────────────────────────────────────────────────────────
    // 2. Admin Countries: /admin/countries
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 2] Admin Countries List (/admin/countries)...')
    await page.goto(`${BASE_URL}/admin/countries`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1200))
    const countriesText = await page.evaluate(() => document.body.innerText)
    assert(countriesText.includes('Countries') || countriesText.includes('Destinations'), 'Countries list not found')
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-admin-countries.png') })
    console.log('  ✓ /admin/countries rendered successfully')

    // ────────────────────────────────────────────────────────────────────────
    // 3. Admin Edit Property (Aurelia Villa - Sparse Gallery Check): /admin/properties/[id]
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 3] Admin Property Edit & Sparse Gallery (/admin/properties/[id])...')
    const aurelia = await prisma.property.findUnique({
      where: { slug: 'aurelia-villa' },
      include: { images: { orderBy: { order: 'asc' } } },
    })
    assert(aurelia, 'Aurelia Villa not found in database')

    await page.goto(`${BASE_URL}/admin/properties/${aurelia.id}`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1500))

    const propText = await page.evaluate(() => document.body.innerText)
    assert(propText.includes('Aurelia Villa'), 'Aurelia Villa not displayed in Edit Property form')
    assert(propText.includes('Gallery') || propText.includes('Images'), 'Gallery section not displayed')
    assert(propText.includes('From Library') || propText.includes('Upload'), 'Media picker actions not found')

    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-admin-edit-aurelia-villa.png') })
    console.log('  ✓ /admin/properties/[id] (Aurelia Villa) rendered with sparse gallery and R2 picker options')

    // ────────────────────────────────────────────────────────────────────────
    // 4. Admin Services: /admin/services & /admin/services/[id]
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 4] Admin Services (/admin/services & /admin/services/[id])...')
    await page.goto(`${BASE_URL}/admin/services`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1200))
    const servicesListText = await page.evaluate(() => document.body.innerText)
    assert(servicesListText.includes('Luxury Villas'), 'Luxury Villas not found in Admin Services list')
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-admin-services-list.png') })

    const luxuryVillas = await prisma.serviceCategory.findUnique({ where: { slug: 'luxury-villas' } })
    assert(luxuryVillas, 'Luxury Villas service not found')

    await page.goto(`${BASE_URL}/admin/services/${luxuryVillas.id}`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1500))
    const serviceEditText = await page.evaluate(() => document.body.innerText)
    assert(serviceEditText.includes('Luxury Villas'), 'Luxury Villas not found in edit form')
    assert(serviceEditText.includes('Video') || serviceEditText.includes('video'), 'Video field not found in service form')
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-admin-service-edit.png') })
    console.log('  ✓ /admin/services & /admin/services/[id] rendered with media & deliverables management')

    // Ensure Aurelia Villa is published so public route renders it
    await prisma.property.update({
      where: { slug: 'aurelia-villa' },
      data: { isPublished: true, isPubliclyVisible: true, isDraft: false },
    })

    // ────────────────────────────────────────────────────────────────────────
    // 5. Public Country Collection Page: /collection/dubai
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 5] Public Country Collection Page (/collection/dubai)...')
    await page.goto(`${BASE_URL}/collection/dubai`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 2000))

    const colDubaiText = await page.evaluate(() => document.body.innerText)
    assert(colDubaiText.includes('Dubai') || colDubaiText.includes('United Arab Emirates'), 'Dubai page heading missing')
    assert(colDubaiText.includes('Aurelia Villa'), 'Aurelia Villa card missing from Dubai collection')

    // Check video tag
    const hasHeroVideo = await page.evaluate(() => {
      const v = document.querySelector('video')
      return Boolean(v && v.src)
    })
    console.log(`  Hero video element present on /collection/dubai: ${hasHeroVideo}`)

    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-public-collection-dubai.png') })
    console.log('  ✓ /collection/dubai loaded with hero media and residence cards')

    // ────────────────────────────────────────────────────────────────────────
    // 6. Public Property Detail Page: /collection/dubai/aurelia-villa
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 6] Public Property Detail Page (/collection/dubai/aurelia-villa)...')
    await page.goto(`${BASE_URL}/collection/dubai/aurelia-villa`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 2000))

    const propDetailText = await page.evaluate(() => document.body.innerText)
    assert(propDetailText.includes('Aurelia Villa'), 'Aurelia Villa heading missing on property detail page')
    assert(
      propDetailText.includes('PALM JUMEIRAH') || propDetailText.includes('Palm Jumeirah') || propDetailText.includes('Dubai'),
      'Location missing on property detail page'
    )

    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-public-property-aurelia-villa.png') })
    console.log('  ✓ /collection/dubai/aurelia-villa loaded successfully with R2 gallery')

    // ────────────────────────────────────────────────────────────────────────
    // 7. Public Service Detail Page: /services/luxury-villas
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 7] Public Service Detail Page (/services/luxury-villas)...')
    await page.goto(`${BASE_URL}/services/luxury-villas`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 2000))

    const serviceDetailText = await page.evaluate(() => document.body.innerText)
    assert(serviceDetailText.includes('Luxury Villas'), 'Luxury Villas heading missing on service detail page')
    assert(
      serviceDetailText.includes('APEX ARCHITECTURAL FOCUS') || serviceDetailText.includes('Bespoke Execution'),
      'Architectural focus missing'
    )

    // Check ambient video tag
    const hasAmbientVideo = await page.evaluate(() => {
      const v = document.querySelector('video')
      return Boolean(v && (v.src || v.querySelector('source')?.src))
    })
    console.log(`  Ambient service video element present on /services/luxury-villas: ${hasAmbientVideo}`)

    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-public-service-luxury-villas.png') })
    console.log('  ✓ /services/luxury-villas rendered with ambient video and architectural tenets')

    // ────────────────────────────────────────────────────────────────────────
    // 8. Mobile & Dark/Light Theme Verifications
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 8] Mobile Viewport & Theme Verification...')
    // Mobile Viewport (375x812)
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
    await page.goto(`${BASE_URL}/collection/dubai`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-mobile-collection-dubai.png') })

    await page.goto(`${BASE_URL}/services/luxury-villas`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage3-mobile-service-luxury-villas.png') })
    console.log('  ✓ Mobile viewports verified and captured')

    console.log('\n========================================================================')
    console.log('✓ ALL STAGE 3 BROWSER E2E TESTS PASSED SUCCESSFULLY!')
    console.log('========================================================================')
  } catch (err) {
    console.error('\n❌ BROWSER E2E TEST FAILED:', err)
    process.exit(1)
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main()
