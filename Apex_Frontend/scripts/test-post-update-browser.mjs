import puppeteer from 'puppeteer-core'
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const DISPOSABLE_DB_URL = 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public'
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

async function main() {
  console.log('=== REAL BROWSER POST-UPDATE VERIFICATION ===')

  const prisma = new PrismaClient({ datasources: { db: { url: DISPOSABLE_DB_URL } } })
  const adminUser = await prisma.adminUser.findFirst({
    where: { isActive: true, role: { name: 'SUPER_ADMIN' } },
    include: { role: true },
  })
  if (!adminUser) throw new Error('No SUPER_ADMIN user found')

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

    // 1. Visit /admin/properties?tab=current
    console.log('1. Navigating to /admin/properties?tab=current...')
    await page.goto(`${BASE_URL}/admin/properties?tab=current`, { waitUntil: 'networkidle2', timeout: 30000 })
    const shot1 = path.join(SHOT_DIR, 'updated-admin-properties-sidebar.png')
    await page.screenshot({ path: shot1, fullPage: true })
    console.log(`   Saved: ${shot1}`)

    // 2. Visit /admin/properties?tab=sold
    console.log('2. Navigating to /admin/properties?tab=sold...')
    await page.goto(`${BASE_URL}/admin/properties?tab=sold`, { waitUntil: 'networkidle2', timeout: 30000 })
    const shot2 = path.join(SHOT_DIR, 'updated-admin-soldout-actions.png')
    await page.screenshot({ path: shot2, fullPage: true })
    console.log(`   Saved: ${shot2}`)

    // 3. Visit public /collection/dubai
    console.log('3. Navigating to /collection/dubai...')
    await page.goto(`${BASE_URL}/collection/dubai`, { waitUntil: 'networkidle2', timeout: 30000 })
    const dubaiText = await page.evaluate(() => document.body.innerText)
    console.log('   Includes Palm Royal Showcase:', dubaiText.includes('Palm Royal Showcase'))
    console.log('   Includes Empty State Message:', dubaiText.includes('No active residences'))
    const shot3 = path.join(SHOT_DIR, 'updated-public-collection-dubai.png')
    await page.screenshot({ path: shot3, fullPage: true })
    console.log(`   Saved: ${shot3}`)

    console.log('=== VERIFICATION COMPLETE ===')
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main().catch(console.error)
