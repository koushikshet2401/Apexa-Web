import puppeteer from 'puppeteer-core'
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const DISPOSABLE_DB_URL = 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public'
const SHOT_DIR = 'C:\\Users\\ACER\\.gemini\\antigravity\\brain\\cf71a7dc-772d-448b-9555-5ea15a93c512\\scratch'

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

async function main() {
  console.log('=== REAL BROWSER ADMIN VERIFICATION ===')
  fs.mkdirSync(SHOT_DIR, { recursive: true })

  const prisma = new PrismaClient({ datasources: { db: { url: DISPOSABLE_DB_URL } } })
  const adminUser = await prisma.adminUser.findFirst({ where: { isActive: true } })
  if (!adminUser) throw new Error('No admin user found')

  const token = await signAdminJwt({
    userId: adminUser.id,
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: 'SUPER_ADMIN',
    tokenVersion: adminUser.tokenVersion,
  })

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const errors = []

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`)
      }
    })
    page.on('pageerror', (err) => {
      errors.push(`Page error: ${err.message}`)
    })

    await page.setCookie({
      name: 'apex_admin_session',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
    })

    // 1. Visit /admin/homepage-video (the exact page the user reported error on)
    console.log('1. Navigating to /admin/homepage-video...')
    const respVideo = await page.goto(`${BASE_URL}/admin/homepage-video`, { waitUntil: 'networkidle2', timeout: 30000 })
    console.log(`   HTTP Status: ${respVideo.status()}`)

    const videoText = await page.evaluate(() => document.body.innerText)
    const hasErrorDigest = videoText.includes('Digest:') || videoText.includes('server-side exception')
    console.log(`   Has Error Digest: ${hasErrorDigest}`)
    if (hasErrorDigest) {
      console.error('   FAILED: Server-side exception / Digest found on homepage-video!')
      console.log(videoText.slice(0, 400))
    } else {
      console.log('   SUCCESS: No server-side exception! Page loaded properly.')
    }

    const shot1 = path.join(SHOT_DIR, 'admin-homepage-video-fixed.png')
    await page.screenshot({ path: shot1, fullPage: true })
    console.log(`   Screenshot saved: ${shot1}`)

    // 2. Visit /admin/settings to verify 9 nav items and CMS hub
    console.log('\n2. Navigating to /admin/settings...')
    const respSettings = await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle2', timeout: 30000 })
    console.log(`   HTTP Status: ${respSettings.status()}`)

    const settingsText = await page.evaluate(() => document.body.innerText)
    const navItems = [
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
    console.log('   Verifying 9 Approved Navigation Items:')
    for (const item of navItems) {
      const present = settingsText.includes(item)
      console.log(`   - ${item}: ${present ? 'PRESENT' : 'MISSING'}`)
    }

    const cmsItems = [
      'Homepage Video',
      'Homepage Section Copy',
      'One Team',
      'Country Collections Media',
      'Countries',
      'Services',
      'New Launches',
      'Spaces in the Round',
      'Media Library',
    ]
    console.log('   Verifying CMS Quick Hub Cards:')
    for (const item of cmsItems) {
      const present = settingsText.includes(item)
      console.log(`   - ${item}: ${present ? 'PRESENT' : 'MISSING'}`)
    }

    const shot2 = path.join(SHOT_DIR, 'admin-settings-nav-hub.png')
    await page.screenshot({ path: shot2, fullPage: true })
    console.log(`   Screenshot saved: ${shot2}`)

    // 3. Visit /admin/properties to verify property list
    console.log('\n3. Navigating to /admin/properties...')
    const respProps = await page.goto(`${BASE_URL}/admin/properties`, { waitUntil: 'networkidle2', timeout: 30000 })
    console.log(`   HTTP Status: ${respProps.status()}`)
    const shot3 = path.join(SHOT_DIR, 'admin-properties.png')
    await page.screenshot({ path: shot3, fullPage: true })
    console.log(`   Screenshot saved: ${shot3}`)

    // 4. Visit public homepage http://localhost:3000/
    console.log('\n4. Navigating to Public Homepage http://localhost:3000/...')
    const respPublic = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 })
    console.log(`   HTTP Status: ${respPublic.status()}`)
    const publicText = await page.evaluate(() => document.body.innerText)
    const publicHasError = publicText.includes('Digest:') || publicText.includes('server-side exception')
    console.log(`   Public Homepage Error: ${publicHasError}`)
    const shot4 = path.join(SHOT_DIR, 'public-homepage.png')
    await page.screenshot({ path: shot4, fullPage: true })
    console.log(`   Screenshot saved: ${shot4}`)

    console.log('\n=== BROWSER VERIFICATION COMPLETED ===')
    console.log(`Logged page errors: ${errors.length}`)
    if (errors.length > 0) {
      console.log(errors.slice(0, 5))
    }

  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
