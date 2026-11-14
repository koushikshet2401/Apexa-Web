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
  console.log('=== REAL BROWSER VERIFICATION ===')

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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900'],
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

    const targets = [
      { url: `${BASE_URL}/admin/homepage-video`, name: 'verified-admin-homepage-video.png' },
      { url: `${BASE_URL}/admin/countries`, name: 'verified-admin-countries.png' },
      { url: `${BASE_URL}/admin/services`, name: 'verified-admin-services.png' },
      { url: `${BASE_URL}/admin/space-in-round`, name: 'verified-admin-space-in-round.png' },
      { url: `${BASE_URL}/admin/properties?tab=archived`, name: 'verified-admin-deleted-projects.png' },
      { url: `${BASE_URL}/collection/dubai`, name: 'verified-public-collection-dubai.png' },
    ]

    for (const t of targets) {
      console.log(`Navigating to ${t.url}...`)
      await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 30000 })
      await new Promise((r) => setTimeout(r, 800))
      const outPath = path.join(SHOT_DIR, t.name)
      await page.screenshot({ path: outPath, fullPage: false })
      console.log(`Saved: ${t.name}`)
    }

    console.log('=== VERIFICATION COMPLETE ===')
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main().catch(console.error)
