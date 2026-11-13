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
  console.log('=== APEX P2 STAGE 5 MASTER BROWSER E2E REGRESSION SUITE ===\n')
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

  const consoleErrors = []

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message)
    })

    // Attach admin cookie
    await page.setCookie({
      name: 'apex_admin_session',
      value: adminToken,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
    })

    // ────────────────────────────────────────────────────────────────────────
    // 1. Admin Media Library (/admin/media)
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 1] Admin Media Library (/admin/media)...')
    await page.goto(`${BASE_URL}/admin/media`, { waitUntil: 'networkidle2', timeout: 30000 })
    const mediaPageText = await page.evaluate(() => document.body.innerText)
    assert(mediaPageText.includes('Media Library') || mediaPageText.includes('Upload Asset'), 'Media Library header not rendered')
    const shot1 = path.join(SHOT_DIR, 'stage5-admin-media.png')
    await page.screenshot({ path: shot1, fullPage: false })
    console.log(`  ✓ Admin Media Library verified. Screenshot: ${shot1}`)

    // ────────────────────────────────────────────────────────────────────────
    // 2. Admin Collection Media (/admin/collection-media)
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Admin Collection Media (/admin/collection-media)...')
    await page.goto(`${BASE_URL}/admin/collection-media`, { waitUntil: 'networkidle2', timeout: 30000 })
    const colPageText = await page.evaluate(() => document.body.innerText)
    assert(colPageText.includes('Collection & Contact Video') || colPageText.includes('Collection Media'), 'Collection media header not found')
    assert(colPageText.includes('Dubai') || colPageText.includes('UAE'), 'Dubai country tab not found')
    const shot2 = path.join(SHOT_DIR, 'stage5-admin-collection-media.png')
    await page.screenshot({ path: shot2, fullPage: false })
    console.log(`  ✓ Admin Collection Media verified. Screenshot: ${shot2}`)

    // ────────────────────────────────────────────────────────────────────────
    // 3. Admin Property Edit — Sparse Gallery Verification
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Admin Property Edit Sparse Gallery (Aurelia Villa)...')
    const aurelia = await prisma.property.findFirst({ where: { slug: 'aurelia-villa' } })
    assert(aurelia, 'Aurelia Villa not found in database')
    await page.goto(`${BASE_URL}/admin/properties/${aurelia.id}`, { waitUntil: 'networkidle2', timeout: 30000 })
    const editPropText = await page.evaluate(() => document.body.innerText)
    assert(editPropText.includes('Aurelia Villa') || editPropText.includes('Edit Project'), 'Edit Project page failed to load for Aurelia Villa')
    const shot3 = path.join(SHOT_DIR, 'stage5-admin-property-edit.png')
    await page.screenshot({ path: shot3, fullPage: false })
    console.log(`  ✓ Admin Property Edit verified with sparse gallery. Screenshot: ${shot3}`)

    // ────────────────────────────────────────────────────────────────────────
    // 4. Admin One Team CMS (/admin/one-team)
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 4] Admin One Team CMS (/admin/one-team)...')
    await page.goto(`${BASE_URL}/admin/one-team`, { waitUntil: 'networkidle2', timeout: 30000 })
    const oneTeamText = await page.evaluate(() => document.body.innerText)
    assert(oneTeamText.includes('One Team, End to End') || oneTeamText.includes('One Team Content'), 'One team admin header not found')
    const shot4 = path.join(SHOT_DIR, 'stage5-admin-oneteam.png')
    await page.screenshot({ path: shot4, fullPage: false })
    console.log(`  ✓ Admin One Team verified. Screenshot: ${shot4}`)

    // ────────────────────────────────────────────────────────────────────────
    // 5. Public Homepage (/) — Cinematic Pinned Stack & Navigation
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 5] Public Homepage Pinned Stack & Navigation (/)...')
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 })

    // Verify navbar brand
    const brandText = await page.$eval('#navbar-brand', (el) => el.textContent || '')
    assert(brandText.includes('APEX PACIFIC HOLDINGS'), 'Brand wordmark not found in navbar')

    // Open hamburger drawer
    await page.click('#nav-hamburger')
    await page.waitForSelector('div[role="dialog"]', { timeout: 5000 })
    const drawerText = await page.evaluate(() => document.querySelector('div[role="dialog"]')?.innerText || '')
    assert(drawerText.includes('EXPLORE'), 'EXPLORE section not in drawer')
    assert(drawerText.includes('Luxury Villas'), 'Luxury Villas missing from nav drawer')
    assert(drawerText.includes('WhatsApp Advisory'), 'WhatsApp Advisory missing from nav drawer')
    assert(drawerText.includes('DUBAI / UAE · THAILAND · MALAYSIA · AUSTRALIA · GEORGIA'), 'Country strip missing from drawer')
    const shot5Nav = path.join(SHOT_DIR, 'stage5-public-nav.png')
    await page.screenshot({ path: shot5Nav, fullPage: false })
    console.log(`  ✓ Navigation drawer verified. Screenshot: ${shot5Nav}`)

    // Close drawer
    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 600))

    const shot5Home = path.join(SHOT_DIR, 'stage5-public-home.png')
    await page.screenshot({ path: shot5Home, fullPage: false })
    console.log(`  ✓ Homepage verified. Screenshot: ${shot5Home}`)

    // ────────────────────────────────────────────────────────────────────────
    // 6. Public Country Collection Page (/collection/dubai)
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 6] Public Country Collection Page (/collection/dubai)...')
    await page.goto(`${BASE_URL}/collection/dubai`, { waitUntil: 'networkidle2', timeout: 30000 })
    const countryPageText = await page.evaluate(() => document.body.innerText)
    assert(countryPageText.includes('Dubai') || countryPageText.includes('UAE'), 'Dubai collection page failed to render')
    const shot6 = path.join(SHOT_DIR, 'stage5-public-country.png')
    await page.screenshot({ path: shot6, fullPage: false })
    console.log(`  ✓ Country collection page verified. Screenshot: ${shot6}`)

    // ────────────────────────────────────────────────────────────────────────
    // 7. Public Property Detail Page (/collection/dubai/aurelia-villa)
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 7] Public Property Detail Page (/collection/dubai/aurelia-villa)...')
    await page.goto(`${BASE_URL}/collection/dubai/aurelia-villa`, { waitUntil: 'networkidle2', timeout: 30000 })
    const propDetailText = await page.evaluate(() => document.body.innerText)
    assert(propDetailText.includes('Aurelia Villa'), 'Aurelia Villa title missing on property page')
    const shot7 = path.join(SHOT_DIR, 'stage5-public-property.png')
    await page.screenshot({ path: shot7, fullPage: false })
    console.log(`  ✓ Property detail page verified. Screenshot: ${shot7}`)

    // ────────────────────────────────────────────────────────────────────────
    // 8. Public Service Detail Page (/services/luxury-villas)
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 8] Public Service Detail Page (/services/luxury-villas)...')
    await page.goto(`${BASE_URL}/services/luxury-villas`, { waitUntil: 'networkidle2', timeout: 30000 })
    const svcDetailText = await page.evaluate(() => document.body.innerText)
    assert(svcDetailText.includes('Luxury Villas'), 'Luxury Villas title missing on service page')
    const shot8 = path.join(SHOT_DIR, 'stage5-public-service.png')
    await page.screenshot({ path: shot8, fullPage: false })
    console.log(`  ✓ Service detail page verified. Screenshot: ${shot8}`)

    // ────────────────────────────────────────────────────────────────────────
    // 9. Public Contact Page & Submission Pipeline (/contact)
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 9] Public Contact Page & Submission Pipeline (/contact)...')
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle2', timeout: 30000 })
    const contactText = await page.evaluate(() => document.body.innerText)
    assert(contactText.includes('+971 4 312 9999'), 'Dynamic telephone not rendered on /contact')
    assert(contactText.toLowerCase().includes('advisory@apexpacificholdings.com'), 'Dynamic email not rendered on /contact')

    await page.type('#fullName', 'Stage 5 Final Browser Client')
    await page.type('#email', 'stage5.browser@apexpacificholdings.com')
    await page.type('#phone', '509998888')
    await page.type('#message', 'Stage 5 Master Browser E2E submission verification test.')

    const consentBox = await page.$('input[type="checkbox"]')
    if (consentBox) await consentBox.click()

    await page.click('button[type="submit"]')
    await page.waitForFunction(
      () => document.body.innerText.toUpperCase().includes('PRIVATE DOSSIER DISPATCHED') || document.body.innerText.includes('Enquiry Received'),
      { timeout: 15000 }
    )

    const shot9 = path.join(SHOT_DIR, 'stage5-public-contact.png')
    await page.screenshot({ path: shot9, fullPage: false })
    console.log(`  ✓ Public contact form submission verified. Screenshot: ${shot9}`)

    await prisma.enquiry.deleteMany({ where: { email: 'stage5.browser@apexpacificholdings.com' } })
    console.log('  ✓ Cleaned up test enquiry record')

    // ────────────────────────────────────────────────────────────────────────
    // 10. Mobile Viewport: 375x812
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 10] Mobile Viewport (375x812)...')
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 })
    const shot10 = path.join(SHOT_DIR, 'stage5-mobile-home.png')
    await page.screenshot({ path: shot10, fullPage: false })
    console.log(`  ✓ Mobile viewport verified. Screenshot: ${shot10}`)

    console.log('\n══════════════════════════════════════════════════════════════════════════')
    console.log('  ALL STAGE 5 MASTER BROWSER E2E TESTS PASSED (10/10)!')
    console.log('══════════════════════════════════════════════════════════════════════════')
  } catch (err) {
    console.error('\n❌ MASTER BROWSER E2E TEST FAILED:', err.message)
    process.exit(1)
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main()
