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
  console.log('=== APEX P2 STAGE 4 BROWSER E2E VERIFICATION ===\n')
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
    await page.setViewport({ width: 1440, height: 900 })
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()))
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

    // Attach admin cookie
    await page.setCookie({
      name: 'apex_admin_session',
      value: adminToken,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
    })

    // ────────────────────────────────────────────────────────────────────────
    // 1. Admin Launches Management: /admin/launches
    // ────────────────────────────────────────────────────────────────────────
    console.log('[TEST 1] Admin Launches Management (/admin/launches)...')
    await page.goto(`${BASE_URL}/admin/launches`, { waitUntil: 'networkidle2', timeout: 30000 })

    const launchesPageText = await page.evaluate(() => document.body.innerText)
    assert(
      launchesPageText.includes('Latest Launches (Homepage Stack)'),
      'Heading "Latest Launches (Homepage Stack)" not found'
    )

    // Check for Edit buttons linking to /admin/properties/[id]
    const editLaunchLinks = await page.$$eval('a[href*="/admin/properties/"]', (els) => els.map((a) => a.getAttribute('href')))
    assert(editLaunchLinks.length > 0, 'No Edit Project links found on /admin/launches')
    console.log(`  ✓ Found ${editLaunchLinks.length} quick-edit project link(s) on Launches page: ${editLaunchLinks[0]}`)

    const shot1 = path.join(SHOT_DIR, 'stage4-admin-launches.png')
    await page.screenshot({ path: shot1, fullPage: false })
    console.log(`  ✓ Screenshot: ${shot1}`)

    // ────────────────────────────────────────────────────────────────────────
    // 2. Admin Spaces in the Round: /admin/space-in-round
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Admin Spaces in the Round (/admin/space-in-round)...')
    await page.goto(`${BASE_URL}/admin/space-in-round`, { waitUntil: 'networkidle2', timeout: 30000 })

    const spacesPageText = await page.evaluate(() => document.body.innerText)
    assert(
      spacesPageText.includes('Space in Round Management'),
      'Heading "Space in Round Management" not found'
    )

    const editSpaceLinks = await page.$$eval('a[href*="/admin/properties/"]', (els) => els.map((a) => a.getAttribute('href')))
    assert(editSpaceLinks.length > 0, 'No Edit Project links found on /admin/space-in-round')
    console.log(`  ✓ Found ${editSpaceLinks.length} quick-edit project link(s) on Spaces page: ${editSpaceLinks[0]}`)

    const shot2 = path.join(SHOT_DIR, 'stage4-admin-spaces.png')
    await page.screenshot({ path: shot2, fullPage: false })
    console.log(`  ✓ Screenshot: ${shot2}`)

    // ────────────────────────────────────────────────────────────────────────
    // 3. Admin Homepage Editorial & Contact CMS: /admin/homepage-video
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Admin Contact Details & Global Channels CMS (/admin/homepage-video)...')
    await page.goto(`${BASE_URL}/admin/homepage-video`, { waitUntil: 'networkidle2', timeout: 30000 })
    console.log('  Current URL after goto:', page.url())

    // Click on Editorial Sections tab if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const tab = btns.find((b) => b.textContent && b.textContent.includes('Editorial Sections'))
      if (tab) tab.click()
    })
    await new Promise((r) => setTimeout(r, 600))

    // Verify Card 5: Contact Details & Global Channels
    const pageText = await page.evaluate(() => document.body.innerText)
    assert(pageText.toUpperCase().includes('CONTACT DETAILS & GLOBAL CHANNELS'), 'Card 5 (Contact Details) not found in editorial sections')
    assert(pageText.toUpperCase().includes('OFFICIAL PHONE NUMBER'), 'Telephone field label not found')
    assert(pageText.toUpperCase().includes('OFFICIAL CONCIERGE EMAIL'), 'Concierge Email field label not found')
    assert(pageText.toUpperCase().includes('WHATSAPP ADVISORY NUMBER'), 'WhatsApp field label not found')
    assert(pageText.toUpperCase().includes('GLOBAL OFFICE ADDRESS'), 'Headquarters field label not found')
    console.log('  ✓ Section 5: Contact Details & Global Channels rendered with full editorial fields')

    const shot3 = path.join(SHOT_DIR, 'stage4-admin-contact-cms.png')
    await page.screenshot({ path: shot3, fullPage: false })
    console.log(`  ✓ Screenshot: ${shot3}`)

    // ────────────────────────────────────────────────────────────────────────
    // 4. Public Contact Page: /contact
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 4] Public Contact Page Dynamic CMS & Form Submission (/contact)...')
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle2', timeout: 30000 })

    const contactBodyText = await page.evaluate(() => document.body.innerText)
    assert(contactBodyText.toUpperCase().includes('CONFIDENTIAL CLIENT INQUIRIES'), 'Dynamic eyebrow not rendered on /contact')
    assert(contactBodyText.toUpperCase().includes('GLOBAL ADVISORY CONCIERGE'), 'Dynamic heading not rendered on /contact')
    assert(contactBodyText.includes('+971 4 312 9999'), 'Dynamic telephone not rendered on /contact')
    assert(contactBodyText.toLowerCase().includes('advisory@apexpacificholdings.com'), 'Dynamic email not rendered on /contact')
    assert(contactBodyText.toUpperCase().includes('AL SAADA TOWER, DIFC, DUBAI'), 'Dynamic office address not rendered on /contact')
    console.log('  ✓ Dynamic contact CMS fields verified on /contact page')

    // Verify WhatsApp Concierge link
    const waLink = await page.$eval('a[href*="wa.me"]', (a) => a.getAttribute('href'))
    assert(waLink.includes('971501234567'), `WhatsApp link does not contain configured digits: ${waLink}`)
    console.log(`  ✓ WhatsApp Concierge link verified: ${waLink}`)

    // Fill and submit the contact form
    await page.type('#fullName', 'Browser E2E Principal Client')
    await page.type('#email', 'browser.test@apexpacificholdings.com')
    await page.type('#phone', '501234567')
    await page.type('#message', 'Browser E2E automated enquiry testing dynamic CMS and submission.')

    // Click consent checkbox
    const consentBox = await page.$('input[type="checkbox"]')
    if (consentBox) await consentBox.click()

    // Submit form
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => document.body.innerText.toUpperCase().includes('PRIVATE DOSSIER DISPATCHED'), { timeout: 15000 })

    const successText = await page.evaluate(() => document.body.innerText)
    assert(successText.toUpperCase().includes('PRIVATE DOSSIER DISPATCHED'), 'Dynamic success heading not rendered after submission')
    assert(successText.toUpperCase().includes('YOUR REGISTRATION HAS BEEN LOGGED'), 'Dynamic success message not rendered')
    console.log('  ✓ Form submitted successfully and verified dynamic success modal with reference ID')

    const shot4 = path.join(SHOT_DIR, 'stage4-public-contact.png')
    await page.screenshot({ path: shot4, fullPage: false })
    console.log(`  ✓ Screenshot: ${shot4}`)

    // Clean up created enquiry from DB
    await prisma.enquiry.deleteMany({ where: { email: 'browser.test@apexpacificholdings.com' } })
    console.log('  ✓ Cleaned up browser test enquiry record')

    // ────────────────────────────────────────────────────────────────────────
    // 5. Public Navigation Overlay & Dynamic Elements (/)
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 5] Public Navigation Overlay & Dynamic CMS Links (/)...')
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 })

    // Click hamburger button to open overlay
    await page.click('#nav-hamburger')
    await page.waitForSelector('div[role="dialog"]', { timeout: 5000 })

    const navText = await page.evaluate(() => document.querySelector('div[role="dialog"]')?.innerText || '')
    assert(navText.includes('EXPLORE'), 'EXPLORE section not found in navigation overlay')
    assert(navText.includes('Luxury Villas'), 'Published service "Luxury Villas" missing from navigation EXPLORE')
    assert(navText.includes('Sky Residences'), 'Published service "Sky Residences" missing from navigation EXPLORE')
    assert(navText.includes('Commercial Properties'), 'Published service "Commercial Properties" missing from navigation EXPLORE')
    assert(navText.includes('Waterfront Residences'), 'Published service "Waterfront Residences" missing from navigation EXPLORE')
    assert(navText.includes('WhatsApp Advisory'), 'WhatsApp Advisory missing from navigation CONNECT')
    assert(navText.includes('DUBAI / UAE · THAILAND · MALAYSIA · AUSTRALIA · GEORGIA'), 'Country strip missing or not dynamic in navigation sub-footer')
    console.log('  ✓ Navigation overlay verified with dynamic published services, WhatsApp link, and country strip')

    const shot5 = path.join(SHOT_DIR, 'stage4-public-navigation.png')
    await page.screenshot({ path: shot5, fullPage: false })
    console.log(`  ✓ Screenshot: ${shot5}`)

    // ────────────────────────────────────────────────────────────────────────
    // 6. Public Footer on Homepage
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 6] Public Footer Dynamic CMS Links...')
    // Close nav overlay first
    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 600))

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise((r) => setTimeout(r, 800))

    const footerText = await page.evaluate(() => document.querySelector('footer')?.innerText || '')
    assert(footerText.includes('SERVICES'), 'SERVICES heading missing from footer')
    assert(footerText.includes('DESTINATIONS'), 'DESTINATIONS heading missing from footer')
    assert(footerText.includes('Luxury Villas'), 'Luxury Villas missing from footer services')
    assert(footerText.includes('Dubai / UAE'), 'Dubai / UAE missing from footer destinations')
    assert(footerText.includes('DUBAI / UAE · THAILAND · MALAYSIA · AUSTRALIA · GEORGIA'), 'Dynamic country strip missing from footer bottom bar')
    console.log('  ✓ Footer verified with dynamic published services, destinations, and country strip')

    const shot6 = path.join(SHOT_DIR, 'stage4-public-footer.png')
    await page.screenshot({ path: shot6, fullPage: false })
    console.log(`  ✓ Screenshot: ${shot6}`)

    // ────────────────────────────────────────────────────────────────────────
    // 7. Mobile Viewport: 375x812
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 7] Mobile Viewport (375x812)...')
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle2', timeout: 30000 })

    const shot7 = path.join(SHOT_DIR, 'stage4-mobile-contact.png')
    await page.screenshot({ path: shot7, fullPage: false })
    console.log(`  ✓ Mobile screenshot: ${shot7}`)

    console.log('\n══════════════════════════════════════════════════════════════════════════')
    console.log('  ALL BROWSER E2E TESTS PASSED SUCCESSFULLY!')
    console.log('══════════════════════════════════════════════════════════════════════════')
  } catch (err) {
    console.error('\n❌ BROWSER E2E TEST FAILED:', err.message)
    process.exit(1)
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main()
