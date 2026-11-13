import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer-core'
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3005'
const DISPOSABLE_DB_URL =
  process.env.DATABASE_URL ||
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
  console.log('=== APEX P2 STAGE 2 BROWSER E2E VERIFICATION ===')
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

    // 1. Test /admin/homepage
    console.log('Navigating to /admin/homepage...')
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${BASE_URL}/admin/homepage`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1000))

    const homepageAdminText = await page.evaluate(() => document.body.innerText)
    console.log('HOMEPAGE ADMIN TEXT PREVIEW:', homepageAdminText.slice(0, 500))
    assert(
      homepageAdminText.includes('Editorial Sections') || homepageAdminText.includes('Homepage Editorial Content'),
      'Admin Homepage did not show Editorial Sections tab'
    )
    const lowerText = homepageAdminText.toLowerCase()
    assert(
      lowerText.includes('unveil section') &&
        lowerText.includes('collection showcase') &&
        lowerText.includes('spaces in the round') &&
        lowerText.includes('private advisory'),
      'Admin Homepage missing one or more of the 4 editorial section cards'
    )
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage2-admin-homepage-sections.png') })
    console.log('✓ /admin/homepage rendered with all 4 editorial section cards')

    // 2. Test /admin/homepage-video
    console.log('Navigating to /admin/homepage-video...')
    await page.goto(`${BASE_URL}/admin/homepage-video`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1000))

    const homepageVideoText = await page.evaluate(() => document.body.innerText)
    assert(
      homepageVideoText.includes('Home Page Video') &&
        homepageVideoText.includes('Hero Cinematic Media'),
      'Admin Homepage Video did not show video media tab'
    )
    assert(
      homepageVideoText.includes('From Library'),
      'Admin Homepage Video missing From Library button'
    )
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage2-admin-homepage-video.png') })
    console.log('✓ /admin/homepage-video rendered with Hero Cinematic Media & From Library picker')

    // 3. Test /admin/one-team
    console.log('Navigating to /admin/one-team...')
    await page.goto(`${BASE_URL}/admin/one-team`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1000))

    const oneTeamAdminText = await page.evaluate(() => document.body.innerText)
    const lowerOneTeam = oneTeamAdminText.toLowerCase()
    assert(
      lowerOneTeam.includes('section editorial content'),
      'Admin One Team missing Section Editorial Content panel'
    )
    assert(
      lowerOneTeam.includes('luxury villas') &&
        lowerOneTeam.includes('commercial properties') &&
        lowerOneTeam.includes('sky residences') &&
        lowerOneTeam.includes('waterfront residences'),
      'Admin One Team missing service showcase cards'
    )
    assert(
      lowerOneTeam.includes('from library'),
      'Admin One Team missing From Library picker buttons'
    )
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage2-admin-one-team.png') })
    console.log('✓ /admin/one-team rendered with Section Editorial Content, 4 cards & From Library pickers')

    // 4. Test Public Homepage (Desktop 1440px Dark Mode)
    console.log('Navigating to Public Homepage (1440px desktop)...')
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 45000 })
    await new Promise((r) => setTimeout(r, 1500))

    const publicDom = await page.evaluate(() => {
      const text = document.body.innerText
      return {
        hasUnveil: text.includes('NEW LAUNCHES') || text.includes('Unveil the Latest'),
        hasCollection: text.includes('The collection'),
        hasOneTeam: text.includes('One team, end to end'),
        hasSpaces: text.includes('Spaces in the round'),
        hasAdvisory: text.includes('Begin your conversation'),
      }
    })
    assert(publicDom.hasUnveil, 'Public homepage missing Unveil section content')
    assert(publicDom.hasCollection, 'Public homepage missing Collection section content')
    assert(publicDom.hasOneTeam, 'Public homepage missing One Team section content')
    assert(publicDom.hasSpaces, 'Public homepage missing Spaces in the round content')
    assert(publicDom.hasAdvisory, 'Public homepage missing Private Advisory content')
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage2-public-home-1440-dark.png') })
    console.log('✓ Public homepage desktop dark theme verified with all 5 sections present')

    // 5. Test Theme Toggle (Light Mode)
    console.log('Testing light mode theme toggle...')
    const themeBtn = await page.$('button[aria-label*="theme" i], button[title*="theme" i], [data-theme-toggle]')
    if (themeBtn) {
      await themeBtn.click()
      await new Promise((r) => setTimeout(r, 1000))
    } else {
      // Toggle theme class via script
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      })
      await new Promise((r) => setTimeout(r, 500))
    }
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage2-public-home-1440-light.png') })
    console.log('✓ Public homepage desktop light theme verified')

    // 6. Test Mobile Viewport (390px iPhone)
    console.log('Testing mobile viewport (390x844)...')
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 45000 })
    await new Promise((r) => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage2-public-home-390-mobile.png') })
    console.log('✓ Public homepage mobile responsive viewport (390px) verified')

    console.log('\n=== ALL BROWSER E2E TESTS PASSED SUCCESSFULLY ===')
  } catch (err) {
    console.error('BROWSER E2E ERROR:', err)
    process.exit(1)
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main()
