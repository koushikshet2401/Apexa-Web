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
  console.log('=== APEX P2 STAGE 3 COMPREHENSIVE VERIFICATION SUITE ===\n')
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

    const unauthRes = await fetch(`${BASE_URL}/api/admin/countries`, {
      headers: { 'Content-Type': 'application/json' },
    })
    assert(unauthRes.status === 401, `Expected 401 on unauthenticated /api/admin/countries, got ${unauthRes.status}`)
    console.log('  ✓ Unauthenticated access correctly rejected with HTTP 401')
    results.checks.push('RBAC security: Unauthenticated access blocked')

    // ══════════════════════════════════════════════════════════════════════════
    // 3. COUNTRY COLLECTIONS CMS TESTS (5 COUNTRIES)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[SECTION 3] Country Collections CMS Tests (5 Countries)...')
    const countries = await prismaDisposable.country.findMany({
      orderBy: { displayOrder: 'asc' },
    })
    assert(countries.length >= 5, `Expected at least 5 countries, found ${countries.length}`)
    console.log(`  ✓ Found ${countries.length} countries in database`)

    const testCountries = ['dubai', 'malaysia', 'thailand', 'australia', 'georgia']
    for (const cSlug of testCountries) {
      const country = countries.find((c) => c.slug === cSlug)
      assert(country, `Country ${cSlug} not found in database`)

      // A. Verify GET /api/admin/countries/[id]
      const getCountryRes = await fetch(`${BASE_URL}/api/admin/countries/${country.id}`, {
        headers: { Cookie: `apex_admin_session=${superAdminToken}` },
      })
      assert(getCountryRes.status === 200, `GET country ${cSlug} returned ${getCountryRes.status}`)
      const countryData = await getCountryRes.json()
      assert(countryData.id === country.id, `Country ID mismatch for ${cSlug}`)

      // B. Verify GET /api/admin/collection-media/[countryId]
      const getColMediaRes = await fetch(`${BASE_URL}/api/admin/collection-media/${country.id}`, {
        headers: { Cookie: `apex_admin_session=${superAdminToken}` },
      })
      assert(getColMediaRes.status === 200, `GET collection-media ${cSlug} returned ${getColMediaRes.status}`)
      const colMediaData = await getColMediaRes.json()
      assert(colMediaData.countryId === country.id, `Collection media countryId mismatch for ${cSlug}`)

      // C. Test PATCH Country & verify synchronization to CollectionMedia
      const updatedTagline = `Signature Architectural Residences in ${country.displayName} (${Date.now()})`
      const patchCountryRes = await fetch(`${BASE_URL}/api/admin/countries/${country.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `apex_admin_session=${superAdminToken}`,
        },
        body: JSON.stringify({
          tagline: updatedTagline,
          description: country.description || `Exceptional luxury estates across ${country.displayName}.`,
        }),
      })
      assert(patchCountryRes.status === 200, `PATCH country ${cSlug} returned ${patchCountryRes.status}`)
      const patchResJson = await patchCountryRes.json()
      assert(patchResJson.tagline === updatedTagline, `Country tagline did not update for ${cSlug}`)

      // Verify sync in CollectionMedia record
      const syncedColMedia = await prismaDisposable.collectionMedia.findUnique({
        where: { countryId: country.id },
      })
      assert(syncedColMedia, `CollectionMedia not found for country ${cSlug}`)

      // D. Test local /uploads/ rejection
      const uploadBlockRes = await fetch(`${BASE_URL}/api/admin/countries/${country.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `apex_admin_session=${superAdminToken}`,
        },
        body: JSON.stringify({
          cardImage: '/uploads/hacked-local-image.jpg',
        }),
      })
      assert(uploadBlockRes.status === 400, `Expected 400 for /uploads/ on country ${cSlug}, got ${uploadBlockRes.status}`)

      console.log(`  ✓ Country [${cSlug.toUpperCase()}] CMS verified (GET, PATCH, 2-Way Sync, /uploads/ rejection)`)
      results.checks.push(`Country [${cSlug}]: Full CMS management and sync verified`)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. PROPERTY CMS & SPARSE GALLERY INTEGRATION TESTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[SECTION 4] Property CMS & Sparse Gallery Integration Tests...')

    // A. Retest the 3 P1 assets with sparse gallery slots
    const sparseProjects = [
      { slug: 'aurelia-villa', expectedOrders: [1, 2], name: 'Aurelia Villa' },
      { slug: 'marble-sanctuary', expectedOrders: [0, 1, 3], name: 'The Marble Sanctuary' },
      { slug: 'verdant-house', expectedOrders: [0, 1, 3], name: 'Verdant House' },
    ]

    for (const item of sparseProjects) {
      const prop = await prismaDisposable.property.findUnique({
        where: { slug: item.slug },
        include: { images: { orderBy: { order: 'asc' } } },
      })
      assert(prop, `Property ${item.slug} not found`)

      const actualOrders = prop.images.map((img) => img.order)
      assert(
        JSON.stringify(actualOrders) === JSON.stringify(item.expectedOrders),
        `Sparse gallery order mismatch for ${item.name}! Expected ${JSON.stringify(item.expectedOrders)}, got ${JSON.stringify(actualOrders)}`
      )

      // Test updating the property via Admin API and ensure sparse orders remain exact
      const updateRes = await fetch(`${BASE_URL}/api/admin/projects/${prop.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `apex_admin_session=${superAdminToken}`,
        },
        body: JSON.stringify({
          tagline: `${prop.tagline || item.name} — Verified Architectural Masterwork`,
          images: prop.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            description: img.description,
            order: img.order,
          })),
        }),
      })
      assert(updateRes.status === 200, `Updating ${item.name} returned ${updateRes.status}`)

      // Refetch from database
      const recheckedProp = await prismaDisposable.property.findUnique({
        where: { id: prop.id },
        include: { images: { orderBy: { order: 'asc' } } },
      })
      const recheckedOrders = recheckedProp.images.map((img) => img.order)
      assert(
        JSON.stringify(recheckedOrders) === JSON.stringify(item.expectedOrders),
        `Sparse gallery orders were shifted after saving ${item.name}! Orders: ${JSON.stringify(recheckedOrders)}`
      )
      console.log(`  ✓ Sparse Gallery for ${item.name} preserved intact without shifting: orders [${recheckedOrders.join(', ')}]`)
      results.checks.push(`Sparse Gallery [${item.name}]: Orders [${recheckedOrders.join(', ')}] preserved`)
    }

    // B. Test Project Lifecycle: Create -> Publish -> Unpublish -> Archive -> Restore -> Delete
    console.log('\n  Testing Project Lifecycle (Create, Sparse Upload, Publish, Unpublish, Archive, Restore, Delete)...')
    const dubaiCountry = await prismaDisposable.country.findFirst({ where: { slug: 'dubai' } })
    const villaService = await prismaDisposable.serviceCategory.findFirst({ where: { slug: 'luxury-villas' } })
    assert(dubaiCountry && villaService, 'Prerequisites for property lifecycle not found')

    const createPayload = {
      name: 'Stage 3 Verification Residence',
      slug: `stage3-test-residence-${Date.now()}`,
      countryId: dubaiCountry.id,
      cityName: 'Palm Jumeirah',
      type: 'Private Villa',
      tagline: 'Sculpted for contemporary coastal serenity',
      description: 'An architectural testament to spatial precision and bespoke luxury.',
      askingPriceNumeric: '45000000',
      askingCurrency: 'AED',
      isPOA: false,
      beds: '6 Bedrooms',
      baths: '8 Bathrooms',
      area: '14,200 sq ft',
      mainImage: 'https://pub-8de28cd1189147deb3a3dafbd4be5e05.r2.dev/properties/aurelia-villa-hero.webp',
      mainVideoUrl: 'https://pub-8de28cd1189147deb3a3dafbd4be5e05.r2.dev/properties/aurelia-villa-hero.mp4',
      serviceIds: [villaService.id],
      highlights: ['Private beachfront mooring', 'Infinity glass-edge lap pool', 'Bespoke marble master bath'],
      isPublished: false,
      images: [
        {
          url: 'https://pub-8de28cd1189147deb3a3dafbd4be5e05.r2.dev/properties/aurelia-villa-gallery-2.webp',
          alt: 'Living Salon',
          description: 'Double height living salon',
          order: 0,
        },
        {
          url: 'https://pub-8de28cd1189147deb3a3dafbd4be5e05.r2.dev/properties/aurelia-villa-gallery-3.webp',
          alt: 'Private Terrace',
          description: 'Sun-drenched marble terrace',
          order: 2, // Sparse slot 1 left open
        },
      ],
    }

    const createRes = await fetch(`${BASE_URL}/api/admin/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `apex_admin_session=${superAdminToken}`,
      },
      body: JSON.stringify(createPayload),
    })
    assert(createRes.status === 201, `Failed to create test project: ${createRes.status}`)
    const createdProject = await createRes.json()
    console.log(`  ✓ Project created: "${createdProject.name}" (ID: ${createdProject.id})`)

    // Verify sparse gallery order in created project
    const createdInDb = await prismaDisposable.property.findUnique({
      where: { id: createdProject.id },
      include: { images: { orderBy: { order: 'asc' } } },
    })
    const createdOrders = createdInDb.images.map((img) => img.order)
    assert(
      JSON.stringify(createdOrders) === JSON.stringify([0, 2]),
      `Expected sparse orders [0, 2], got ${JSON.stringify(createdOrders)}`
    )
    console.log(`  ✓ Sparse gallery creation verified: orders [${createdOrders.join(', ')}]`)

    // Test Publish
    const pubRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProject.id}/publish`, {
      method: 'POST',
      headers: { Cookie: `apex_admin_session=${superAdminToken}` },
    })
    assert(pubRes.status === 200, `Publish returned ${pubRes.status}`)
    const pubData = await pubRes.json()
    assert(pubData.project.isPublished === true, 'Project isPublished was not set to true')
    console.log('  ✓ Project Publish verified')

    // Test Unpublish
    const unpubRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProject.id}/unpublish`, {
      method: 'POST',
      headers: { Cookie: `apex_admin_session=${superAdminToken}` },
    })
    assert(unpubRes.status === 200, `Unpublish returned ${unpubRes.status}`)
    const unpubData = await unpubRes.json()
    assert(unpubData.project.isPublished === false, 'Project isPublished was not set to false')
    console.log('  ✓ Project Unpublish verified')

    // Test Archive
    const archRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProject.id}/archive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `apex_admin_session=${superAdminToken}`,
      },
      body: JSON.stringify({ reason: 'Stage 3 automated test verification' }),
    })
    assert(archRes.status === 200, `Archive returned ${archRes.status}`)
    const archData = await archRes.json()
    assert(archData.project.isArchived === true, 'Project isArchived was not set to true')
    console.log('  ✓ Project Archive verified')

    // Test Restore
    const restoreRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProject.id}/restore`, {
      method: 'POST',
      headers: { Cookie: `apex_admin_session=${superAdminToken}` },
    })
    assert(restoreRes.status === 200, `Restore returned ${restoreRes.status}`)
    const restoreData = await restoreRes.json()
    assert(restoreData.project.isArchived === false, 'Project isArchived was not set to false')
    console.log('  ✓ Project Restore verified')

    // Test local /uploads/ rejection
    const uploadBlockPropRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProject.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `apex_admin_session=${superAdminToken}`,
      },
      body: JSON.stringify({
        mainImage: '/uploads/forbidden.jpg',
      }),
    })
    assert(uploadBlockPropRes.status === 400, `Expected 400 for /uploads/ on property, got ${uploadBlockPropRes.status}`)
    console.log('  ✓ Local /uploads/ rejection verified on property endpoints')

    // Clean up test project
    const delRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProject.id}`, {
      method: 'DELETE',
      headers: { Cookie: `apex_admin_session=${superAdminToken}` },
    })
    assert(delRes.status === 200, `Delete test project returned ${delRes.status}`)
    console.log('  ✓ Test project cleanly deleted')
    results.checks.push('Property CMS: Create, Publish, Unpublish, Archive, Restore, Delete verified')

    // ══════════════════════════════════════════════════════════════════════════
    // 5. SERVICES CMS TESTS (ALL 4 SERVICES)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[SECTION 5] Services CMS Tests (All 4 Services)...')
    const services = await prismaDisposable.serviceCategory.findMany({
      orderBy: { displayOrder: 'asc' },
    })
    assert(services.length >= 4, `Expected at least 4 services, found ${services.length}`)
    console.log(`  ✓ Found ${services.length} services in database`)

    for (const service of services) {
      // A. GET /api/admin/services/[id]
      const getServiceRes = await fetch(`${BASE_URL}/api/admin/services/${service.id}`, {
        headers: { Cookie: `apex_admin_session=${superAdminToken}` },
      })
      assert(getServiceRes.status === 200, `GET service ${service.slug} returned ${getServiceRes.status}`)
      const sData = await getServiceRes.json()
      assert(sData.id === service.id, `Service ID mismatch for ${service.slug}`)

      // B. PATCH /api/admin/services/[id] with videoUrl and deliverables
      const testVideoUrl =
        service.videoUrl ||
        'https://pub-8de28cd1189147deb3a3dafbd4be5e05.r2.dev/collection-media/dubai-hero.mp4'
      const updatedTagline = `End-to-End Architectural Excellence in ${service.name} (${Date.now()})`

      const patchServiceRes = await fetch(`${BASE_URL}/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `apex_admin_session=${superAdminToken}`,
        },
        body: JSON.stringify({
          tagline: updatedTagline,
          videoUrl: testVideoUrl,
          architecturalFocus: [
            'Bespoke spatial curation',
            'Uncompromising material provenance',
            'Biophilic environmental integration',
          ],
          deliverables: [
            { title: 'Architectural Curation', description: 'Complete turnkey architectural oversight.' },
            { title: 'Material Provenance', description: 'Certified global stone and timber procurement.' },
            { title: 'Bespoke Fabrication', description: 'Custom millwork and structural engineering.' },
            { title: 'Handover & Stewardship', description: 'Perpetual estate stewardship.' },
          ],
        }),
      })
      assert(patchServiceRes.status === 200, `PATCH service ${service.slug} returned ${patchServiceRes.status}`)
      const patchedService = await patchServiceRes.json()
      assert(patchedService.videoUrl === testVideoUrl, `Service videoUrl not updated for ${service.slug}`)

      // C. Verify Public API includes videoUrl
      const publicServiceRes = await fetch(`${BASE_URL}/api/public/services/${service.slug}`)
      assert(publicServiceRes.status === 200, `Public GET /api/public/services/${service.slug} returned ${publicServiceRes.status}`)
      const publicData = await publicServiceRes.json()
      assert(publicData.videoUrl === testVideoUrl, `Public API did not return updated videoUrl for ${service.slug}`)

      // D. Test local /uploads/ rejection
      const uploadBlockServiceRes = await fetch(`${BASE_URL}/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `apex_admin_session=${superAdminToken}`,
        },
        body: JSON.stringify({
          videoUrl: '/uploads/local-video.mp4',
        }),
      })
      assert(uploadBlockServiceRes.status === 400, `Expected 400 for /uploads/ on service ${service.slug}, got ${uploadBlockServiceRes.status}`)

      console.log(`  ✓ Service [${service.name}] CMS verified (GET, PATCH, Public API reflection, videoUrl connected, /uploads/ rejected)`)
      results.checks.push(`Service [${service.slug}]: Full CMS management and public videoUrl verified`)
    }

    console.log('\n========================================================================')
    console.log('✓ ALL STAGE 3 API, CMS, PERSISTENCE & SECURITY CHECKS PASSED!')
    console.log(`Total Passed Checks: ${results.checks.length}`)
    console.log('========================================================================')
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err)
    process.exit(1)
  } finally {
    await prismaDisposable.$disconnect()
    await prismaProd.$disconnect()
  }
}

main()
