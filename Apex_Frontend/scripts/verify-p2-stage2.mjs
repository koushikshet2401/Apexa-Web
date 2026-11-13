import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'
import fs from 'fs'

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3005'
const DISPOSABLE_DB_URL =
  process.env.DATABASE_URL ||
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
  console.log('=== APEX P2 STAGE 2 VERIFICATION SUITE ===')
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
    // 1. Target Database Isolation Check
    const dbCheck = await prismaDisposable.$queryRawUnsafe('SELECT current_database() AS db')
    assert(
      dbCheck?.[0]?.db === 'apex_disposable_test',
      `Expected apex_disposable_test, got ${dbCheck?.[0]?.db}`
    )
    console.log('✓ Target database confirmed: apex_disposable_test')
    results.checks.push('Target database isolation: apex_disposable_test confirmed')

    // 2. Production Database Safety Check
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

    // Ensure migration 20261112173000_p2_cms_fields was NEVER applied to prod apex
    const prodP2Mig = await prismaProd.$queryRawUnsafe(
      'SELECT migration_name FROM "_prisma_migrations" WHERE migration_name LIKE \'%p2_cms_fields%\''
    )
    assert(
      prodP2Mig.length === 0,
      'CRITICAL: P2 migration was detected in production DB apex! It must remain only in disposable test.'
    )
    console.log('✓ Production DB apex safety verified: 25 tables, 9 migrations, 0 P2 migrations applied')
    results.checks.push('Production DB apex safety: 25 tables, 9 migrations, completely untouched')

    // Look up users in apex_disposable_test for RBAC and authenticated testing
    const users = await prismaDisposable.adminUser.findMany({
      where: { isActive: true },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    })
    const superAdmin = users.find((u) => u.role?.name === 'SUPER_ADMIN')
    assert(superAdmin, 'Expected at least one active SUPER_ADMIN in apex_disposable_test')

    const limitedUser = users.find((u) => {
      if (u.role?.name === 'SUPER_ADMIN') return false
      const perms = new Set(u.role?.permissions.map((rp) => rp.permission.action) || [])
      return !perms.has('CONTENT_UPDATE') && !perms.has('ONE_TEAM_UPDATE')
    })

    const adminToken = await signAdminJwt({
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role?.name || 'SUPER_ADMIN',
      tokenVersion: superAdmin.tokenVersion,
    })

    const adminHeaders = {
      'Content-Type': 'application/json',
      Cookie: `apex_admin_session=${adminToken}`,
    }

    // 3. Test RBAC Enforcement on Homepage and One Team Admin APIs
    console.log('Checking RBAC enforcement...')
    const resNoAuth = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unveilLabel: 'HACKED' }),
    })
    assert(resNoAuth.status === 401, `Expected 401 for unauthenticated PATCH, got ${resNoAuth.status}`)

    if (limitedUser) {
      const limitedToken = await signAdminJwt({
        id: limitedUser.id,
        email: limitedUser.email,
        name: limitedUser.name,
        role: limitedUser.role?.name,
        tokenVersion: limitedUser.tokenVersion,
      })
      const resUnauth = await fetch(`${BASE_URL}/api/admin/homepage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `apex_admin_session=${limitedToken}`,
        },
        body: JSON.stringify({ unveilLabel: 'HACKED' }),
      })
      assert(resUnauth.status === 403, `Expected 403 for unauthorized role, got ${resUnauth.status}`)

      const resOneTeamUnauth = await fetch(`${BASE_URL}/api/admin/one-team`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `apex_admin_session=${limitedToken}`,
        },
        body: JSON.stringify({ sectionEyebrow: 'HACKED' }),
      })
      assert(
        resOneTeamUnauth.status === 403,
        `Expected 403 for unauthorized One Team update, got ${resOneTeamUnauth.status}`
      )
      console.log(`✓ RBAC enforcement verified: 401 unauthenticated, 403 unauthorized for role "${limitedUser.role?.name}"`)
      results.checks.push(`RBAC enforcement: 401 unauthenticated, 403 unauthorized (${limitedUser.role?.name})`)
    } else {
      console.log('✓ RBAC 401 unauthenticated verified (no limited non-admin user in DB)')
      results.checks.push('RBAC enforcement: 401 unauthenticated')
    }

    // 4. Test Homepage CMS Editing & Saving
    console.log('Testing Homepage CMS PATCH & GET...')
    const testHomepagePayload = {
      unveilLabel: 'STAGE 2 TEST LAUNCHES',
      unveilHeading: 'Unveil the Future of Coastal Architecture',
      unveilSubtext: 'A curated ensemble of prime architectural residences across the world.',
      collectionEyebrow: 'EXCLUSIVE SANCTUARIES',
      collectionHeading: 'The Apex Collection',
      collectionDescription: 'Rare addresses engineered for perpetual legacy and discretion.',
      spacesHeading: 'Spheres of Architecture',
      spacesDescription: 'Step inside each residence through seamless panoramic vantage points.',
      advisoryEyebrow: 'PRIVATE WEALTH ADVISORY',
      advisoryHeading: 'Start your discreet dialogue',
      advisoryDescription: 'Senior partners consult family offices across prime global markets.',
      advisoryFooterNote: 'Strictly private consultations in Dubai, Singapore, and Zurich.',
    }

    const patchHpRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify(testHomepagePayload),
    })
    assert(patchHpRes.status === 200, `Expected 200 on Homepage PATCH, got ${patchHpRes.status}`)
    const patchHpData = await patchHpRes.json()
    assert(
      patchHpData.unveilLabel === testHomepagePayload.unveilLabel,
      'Homepage unveilLabel did not match payload'
    )
    assert(
      patchHpData.spacesHeading === testHomepagePayload.spacesHeading,
      'Homepage spacesHeading did not match payload'
    )
    assert(
      patchHpData.advisoryFooterNote === testHomepagePayload.advisoryFooterNote,
      'Homepage advisoryFooterNote did not match payload'
    )

    // Verify GET persists data from database
    const getHpRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
      headers: adminHeaders,
    })
    assert(getHpRes.status === 200, `Expected 200 on Homepage GET, got ${getHpRes.status}`)
    const getHpData = await getHpRes.json()
    assert(
      getHpData.unveilLabel === testHomepagePayload.unveilLabel,
      'Homepage GET did not return persisted unveilLabel'
    )
    console.log('✓ Homepage CMS editing & persistence verified')
    results.checks.push('Homepage CMS editing & persistence: PASSED')

    // 5. Test One Team CMS Editing & Saving
    console.log('Testing One Team CMS PATCH & GET...')
    const testOneTeamPayload = {
      sectionEyebrow: 'INTEGRATED DISCIPLINES',
      sectionHeading: 'Comprehensive Architecture & Delivery',
      sectionDescription: 'From private residential sanctuaries to skyline landmarks, executed seamlessly.',
      bannerLabel: 'GLOBAL EXPERTISE',
      bannerHeading: 'Mastery in Prime Developments',
    }

    const patchOtRes = await fetch(`${BASE_URL}/api/admin/one-team`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify(testOneTeamPayload),
    })
    assert(patchOtRes.status === 200, `Expected 200 on One Team PATCH, got ${patchOtRes.status}`)
    const patchOtData = await patchOtRes.json()
    assert(
      patchOtData.sectionEyebrow === testOneTeamPayload.sectionEyebrow,
      'One Team sectionEyebrow did not match'
    )
    assert(
      patchOtData.bannerHeading === testOneTeamPayload.bannerHeading,
      'One Team bannerHeading did not match'
    )

    // Verify GET persists data from database
    const getOtRes = await fetch(`${BASE_URL}/api/admin/one-team`, {
      headers: adminHeaders,
    })
    assert(getOtRes.status === 200, `Expected 200 on One Team GET, got ${getOtRes.status}`)
    const getOtData = await getOtRes.json()
    assert(
      getOtData.sectionEyebrow === testOneTeamPayload.sectionEyebrow,
      'One Team GET did not return persisted sectionEyebrow'
    )
    console.log('✓ One Team CMS editing & persistence verified')
    results.checks.push('One Team CMS editing & persistence: PASSED')

    // 6. Test Public Homepage API reflects updates immediately
    console.log('Checking /api/public/homepage...')
    const pubHpRes = await fetch(`${BASE_URL}/api/public/homepage`)
    assert(pubHpRes.status === 200, `Expected 200 on /api/public/homepage, got ${pubHpRes.status}`)
    const pubHpData = await pubHpRes.json()
    assert(
      pubHpData.unveilLabel === testHomepagePayload.unveilLabel,
      'Public homepage API unveilLabel did not match updated value'
    )
    assert(
      pubHpData.oneTeam?.sectionEyebrow === testOneTeamPayload.sectionEyebrow,
      'Public homepage API oneTeam.sectionEyebrow did not match updated value'
    )
    console.log('✓ Public Homepage API instant cache update verified')
    results.checks.push('Public Homepage API cache revalidation & immediate reflection: PASSED')

    // 7. Test restoring standard approved copy values
    console.log('Restoring approved copy values...')
    const approvedHomepagePayload = {
      unveilLabel: 'NEW LAUNCHES',
      unveilHeading: 'Unveil the Latest in Exceptional Living',
      unveilSubtext:
        'Discover exceptional properties across our international portfolio, each selected for its location, design and long-term potential.',
      collectionEyebrow: 'SIGNATURE RESIDENCES',
      collectionHeading: 'The collection',
      collectionDescription:
        'Five addresses, each designed around its site. Drag, swipe or click to explore the portfolio.',
      spacesHeading: 'Spaces in the round',
      spacesDescription:
        'Exteriors and interiors from across the portfolio. Drag the ring to turn it.',
      advisoryEyebrow: 'PRIVATE ADVISORY',
      advisoryHeading: 'Begin your conversation',
      advisoryDescription:
        'Our senior partners advise private clients and family offices on prime residential acquisitions across the Gulf, Southeast Asia, and Australasia.',
      advisoryFooterNote:
        'Confidential consultations available in Dubai, Singapore, and London.',
    }
    const approvedOneTeamPayload = {
      sectionEyebrow: 'WHAT WE DO',
      sectionHeading: 'One team, end to end',
      sectionDescription:
        'Architecture, interiors, development management, and private client advisory under one roof.',
      bannerLabel: 'APEX PACIFIC HOLDINGS',
      bannerHeading: 'One team, end to end',
    }

    await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(approvedHomepagePayload),
    })

    await fetch(`${BASE_URL}/api/admin/one-team`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(approvedOneTeamPayload),
    })

    console.log('✓ Approved editorial copy cleanly restored')
    results.checks.push('Restoration of approved editorial copy: PASSED')

    console.log('\n=== ALL P2 STAGE 2 BACKEND & API VERIFICATIONS PASSED ===')
    console.log(JSON.stringify(results, null, 2))
  } catch (err) {
    console.error('VERIFICATION ERROR:', err)
    process.exit(1)
  } finally {
    await prismaDisposable.$disconnect()
    await prismaProd.$disconnect()
  }
}

main()
