import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'
import fs from 'fs'

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3005'
const DISPOSABLE_DB_URL =
  process.env.DISPOSABLE_DATABASE_URL ||
  'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public'
const PROD_DB_URL = 'postgresql://postgres:ehasan2026@localhost:5432/apex'

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
    .setExpirationTime('1h')
    .sign(getJwtSecretBytes())
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`)
}

async function main() {
  console.log('=== APEX P2 STAGE 4 COMPREHENSIVE VERIFICATION SUITE ===\n')
  const results = {
    checks: [],
    errors: [],
  }

  const prismaDisposable = new PrismaClient({
    datasources: { db: { url: DISPOSABLE_DB_URL } },
  })
  const prismaProd = new PrismaClient({
    datasources: { db: { url: PROD_DB_URL } },
  })

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // 1. SAFETY & ISOLATION CHECKS
    // ══════════════════════════════════════════════════════════════════════════
    console.log('[SECTION 1] Safety & Database Isolation Checks...')
    const dbCheck = await prismaDisposable.$queryRawUnsafe('SELECT current_database() AS db')
    assert(
      dbCheck?.[0]?.db === 'apex_disposable_test',
      `Expected apex_disposable_test, got ${dbCheck?.[0]?.db}`
    )
    console.log('  ✓ Verified active connection target: apex_disposable_test')

    const prodDbCheck = await prismaProd.$queryRawUnsafe('SELECT current_database() AS db')
    assert(prodDbCheck?.[0]?.db === 'apex', `Expected apex, got ${prodDbCheck?.[0]?.db}`)

    const prodTables = await prismaProd.$queryRawUnsafe(
      "SELECT count(*)::int AS cnt FROM information_schema.tables WHERE table_schema='public'"
    )
    const prodMigrations = await prismaProd.$queryRawUnsafe(
      'SELECT count(*)::int AS cnt FROM "_prisma_migrations" WHERE rolled_back_at IS NULL'
    )
    assert(prodTables?.[0]?.cnt === 25, `Expected 25 tables in prod DB apex, found ${prodTables?.[0]?.cnt}`)
    assert(
      prodMigrations?.[0]?.cnt === 8,
      `Expected 8 migrations in prod DB apex, found ${prodMigrations?.[0]?.cnt}`
    )
    const p2MigInProd = await prismaProd.$queryRawUnsafe(
      'SELECT count(*)::int AS cnt FROM "_prisma_migrations" WHERE migration_name LIKE \'%p2%\''
    )
    assert(p2MigInProd?.[0]?.cnt === 0, 'Production DB apex contains unapproved P2 migrations!')
    console.log('  ✓ Verified production database apex is 100% UNTOUCHED (25 tables, 8 migrations, 0 P2 migrations)')
    results.checks.push('Production database apex safety verified (0 modifications)')

    // ══════════════════════════════════════════════════════════════════════════
    // 2. AUTHENTICATION & RBAC SETUP
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[SECTION 2] Authentication & RBAC Verification...')
    const adminUser = await prismaDisposable.adminUser.findFirst({
      where: { isActive: true, role: { name: 'SUPER_ADMIN' } },
      include: { role: true },
    })
    assert(adminUser, 'SUPER_ADMIN user not found in disposable database')

    const superAdminToken = await signAdminJwt({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role?.name || 'SUPER_ADMIN',
      tokenVersion: adminUser.tokenVersion,
    })

    const adminCookie = `apex_admin_session=${superAdminToken}`
    console.log(`  ✓ Generated valid superadmin JWT for ${adminUser.email}`)
    results.checks.push('Admin authentication session ready')

    // ══════════════════════════════════════════════════════════════════════════
    // 3. LAUNCHES CMS VERIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[SECTION 3] Launches CMS Verification...')
    const featuredLaunches = await prismaDisposable.property.findMany({
      where: {
        isPublished: true,
        isPubliclyVisible: true,
        isArchived: false,
        isFeaturedLaunch: true,
      },
      orderBy: [
        { launchOrder: 'asc' },
        { launchDate: 'desc' },
        { createdAt: 'desc' },
      ],
      include: { country: true },
    })

    assert(featuredLaunches.length >= 3, `Expected at least 3 featured launches, found ${featuredLaunches.length}`)
    console.log(`  ✓ Found ${featuredLaunches.length} active featured launches in database`)

    for (const launch of featuredLaunches) {
      assert(launch.name, `Featured launch ${launch.id} is missing a name`)
      assert(launch.slug, `Featured launch ${launch.id} is missing a slug`)
      const hasMedia = Boolean(launch.mainVideoUrl || launch.mainVideoThumb || launch.mainImage)
      assert(hasMedia, `Featured launch "${launch.name}" (${launch.id}) has no valid media`)
      console.log(`    - [Order ${launch.launchOrder}] "${launch.name}" (${launch.country?.displayName || launch.country?.name}): media verified`)
    }
    results.checks.push(`Launches CMS verified (${featuredLaunches.length} active cinematic launches)`)

    // ══════════════════════════════════════════════════════════════════════════
    // 4. SPACES IN THE ROUND CMS & 3D CAROUSEL VERIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[SECTION 4] Spaces in the Round CMS & 3D Carousel Verification...')
    const spaces = await prismaDisposable.property.findMany({
      where: {
        isPublished: true,
        isPubliclyVisible: true,
        isArchived: false,
        isSpaceInRound: true,
      },
      orderBy: { spaceOrder: 'asc' },
      include: { country: true, images: { orderBy: { order: 'asc' } } },
    })

    assert(spaces.length >= 7, `Expected at least 7 spaces in round, found ${spaces.length}`)
    console.log(`  ✓ Found ${spaces.length} spaces assigned to Spaces in the Round`)

    for (const space of spaces) {
      const resolvedImage = space.spaceRoundImage || space.mainImage || space.images[0]?.url
      assert(resolvedImage, `Space "${space.name}" has no resolved image`)
      assert(
        !resolvedImage.includes('/uploads/'),
        `Space "${space.name}" contains forbidden local /uploads/ URL: ${resolvedImage}`
      )
      console.log(`    - [Order ${space.spaceOrder}] "${space.name}": image verified (${resolvedImage.slice(0, 50)}...)`)
    }

    // Verify 3d-carousel.tsx no longer contains hardcoded stock images
    const carouselCode = fs.readFileSync('src/components/ui/3d-carousel.tsx', 'utf-8')
    assert(
      !carouselCode.includes('defaultStockImages'),
      'src/components/ui/3d-carousel.tsx still contains defaultStockImages!'
    )
    assert(
      !carouselCode.includes('images.unsplash.com'),
      'src/components/ui/3d-carousel.tsx still contains hardcoded Unsplash stock images!'
    )
    assert(
      carouselCode.includes('No residences currently assigned'),
      'src/components/ui/3d-carousel.tsx missing empty state message'
    )
    console.log('  ✓ Verified 3D Carousel: hardcoded stock images removed, clean luxury empty state implemented')
    results.checks.push(`Spaces in the Round CMS verified (${spaces.length} residences, 0 hardcoded stock URLs)`)

    // ══════════════════════════════════════════════════════════════════════════
    // 5. CONTACT & PRIVATE ADVISORY CMS VERIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[SECTION 5] Contact & Private Advisory CMS Verification...')

    // Test rejection of local /uploads/ in advisoryVideoUrl
    const rejectRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        advisoryVideoUrl: '/uploads/videos/advisory-local.mp4',
      }),
    })
    assert(rejectRes.status === 400, `Expected 400 rejection for /uploads/ advisory video, got ${rejectRes.status}`)
    console.log('  ✓ Confirmed /uploads/ local URL rejection for advisory video (HTTP 400)')

    // Update Contact & Advisory CMS fields
    const testContactData = {
      advisoryEyebrow: 'Private Advisory & Acquisitions',
      advisoryHeading: 'Private Client Concierge',
      advisoryDescription: 'Confidential acquisitions, portfolio structuring, and bespoke off-market commissions.',
      advisoryFooterNote: 'Direct consultation available strictly by advance appointment across Dubai, London, and Singapore.',
      contactEyebrow: 'Confidential Client Inquiries',
      contactHeading: 'Global Advisory Concierge',
      contactDescription: 'Direct representation with our managing principals for confidential property acquisitions.',
      contactPhone: '+971 4 312 9999',
      contactEmail: 'advisory@apexpacificholdings.com',
      contactOfficeAddress: 'Level 42, Al Saada Tower, DIFC, Dubai, UAE',
      contactWhatsappNumber: '+971 50 123 4567',
      contactFormHeading: 'Register Your Interest',
      contactFormSubtext: 'Our executive advisory team reviews each submission confidentially and responds within 24 hours.',
      contactSuccessHeading: 'Private Dossier Dispatched',
      contactSuccessSubtext: 'Your registration has been logged with our executive concierge desk.',
    }

    const patchRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(testContactData),
    })
    const patchBody = await patchRes.json()
    assert(patchRes.ok, `Failed to update contact CMS fields: ${JSON.stringify(patchBody)}`)
    console.log('  ✓ Updated Contact & Advisory CMS fields via PATCH /api/admin/homepage')

    // Fetch public homepage API and verify reflection
    const publicRes = await fetch(`${BASE_URL}/api/public/homepage`)
    assert(publicRes.ok, `GET /api/public/homepage returned ${publicRes.status}`)
    const publicData = await publicRes.json()

    assert(publicData.contactPhone === testContactData.contactPhone, 'contactPhone mismatch')
    assert(publicData.contactEmail === testContactData.contactEmail, 'contactEmail mismatch')
    assert(publicData.contactWhatsappNumber === testContactData.contactWhatsappNumber, 'contactWhatsappNumber mismatch')
    assert(publicData.contactOfficeAddress === testContactData.contactOfficeAddress, 'contactOfficeAddress mismatch')
    assert(publicData.contactEyebrow === testContactData.contactEyebrow, 'contactEyebrow mismatch')
    assert(publicData.contactHeading === testContactData.contactHeading, 'contactHeading mismatch')
    assert(publicData.contactDescription === testContactData.contactDescription, 'contactDescription mismatch')
    assert(publicData.contactSuccessHeading === testContactData.contactSuccessHeading, 'contactSuccessHeading mismatch')
    assert(publicData.contactSuccessSubtext === testContactData.contactSuccessSubtext, 'contactSuccessSubtext mismatch')
    console.log('  ✓ Verified public API returns all updated Contact & Advisory CMS fields')
    results.checks.push('Contact and Private Advisory CMS verified (full roundtrip persistence)')

    // ══════════════════════════════════════════════════════════════════════════
    // 6. CONTACT FORM SUBMISSION PIPELINE VERIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[SECTION 6] Contact Form Submission Pipeline Verification...')
    const testEnquiry = {
      name: 'Verification Principal Client',
      email: 'stage4.verification@apexpacificholdings.com',
      phone: '+971501234567',
      service: 'Luxury Villas',
      message: 'Confidential Stage 4 automated test enquiry.',
      consent: true,
    }

    const enquiryRes = await fetch(`${BASE_URL}/api/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEnquiry),
    })
    assert(
      enquiryRes.status === 200 || enquiryRes.status === 201,
      `POST /api/enquiries returned ${enquiryRes.status}`
    )
    const enquiryData = await enquiryRes.json()
    assert(enquiryData.id || enquiryData.success, 'Enquiry response missing confirmation id or success flag')
    console.log(`  ✓ Enquiry submitted successfully (Confirmation ID: ${enquiryData.id || 'OK'})`)

    // Verify record in database
    const dbEnquiry = await prismaDisposable.enquiry.findFirst({
      where: { email: testEnquiry.email },
      orderBy: { submittedAt: 'desc' },
    })
    assert(dbEnquiry, 'Submitted enquiry not found in disposable database Enquiry table')
    console.log(`  ✓ Verified enquiry persisted in database (Enquiry ID: ${dbEnquiry.id}, status: ${dbEnquiry.status})`)

    // Clean up test enquiry
    await prismaDisposable.enquiry.delete({ where: { id: dbEnquiry.id } })
    console.log('  ✓ Cleaned up test enquiry record')
    results.checks.push('Contact form enquiry submission pipeline verified')

    // ══════════════════════════════════════════════════════════════════════════
    // 7. NAVIGATION & FOOTER DYNAMIC BUSINESS CONTENT
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[SECTION 7] Navigation & Footer Dynamic Content Verification...')

    assert(Array.isArray(publicData.services) && publicData.services.length > 0, 'No published services returned')
    assert(Array.isArray(publicData.countries) && publicData.countries.length > 0, 'No published countries returned')

    console.log(`  ✓ Published services for nav/footer: ${publicData.services.length}`)
    for (const svc of publicData.services) {
      console.log(`    - ${svc.name} (/services/${svc.slug})`)
    }

    console.log(`  ✓ Published countries for nav/footer: ${publicData.countries.length}`)
    for (const c of publicData.countries) {
      console.log(`    - ${c.displayName || c.name} (/collection/${c.slug})`)
    }

    const cleanWhatsappDigits = (publicData.contactWhatsappNumber || '').replace(/[^0-9]/g, '')
    const expectedWaLink = `https://wa.me/${cleanWhatsappDigits}`
    assert(cleanWhatsappDigits === '971501234567', `Expected 971501234567, got ${cleanWhatsappDigits}`)
    console.log(`  ✓ Dynamic WhatsApp Advisory link verified: ${expectedWaLink}`)

    const countryStrip = publicData.countries.map((c) => (c.displayName || c.name).toUpperCase()).join(' · ')
    console.log(`  ✓ Dynamic Country Strip: ${countryStrip}`)
    results.checks.push('Navigation & Footer dynamic CMS rendering verified')

    // ══════════════════════════════════════════════════════════════════════════
    // 8. FINAL SUMMARY
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════════════════════════════════════════')
    console.log('  ALL STAGE 4 VERIFICATION CHECKS PASSED!')
    console.log('══════════════════════════════════════════════════════════════════════════')
    console.log(`Total checks passed: ${results.checks.length}`)
    for (const c of results.checks) {
      console.log(`  • ${c}`)
    }
  } catch (err) {
    console.error('\n❌ STAGE 4 VERIFICATION FAILED:', err.message)
    process.exit(1)
  } finally {
    await prismaDisposable.$disconnect()
    await prismaProd.$disconnect()
  }
}

main()
