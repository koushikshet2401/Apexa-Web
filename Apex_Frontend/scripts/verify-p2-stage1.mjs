import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3005'

function getJwtSecretBytes() {
  const secret =
    process.env.JWT_SECRET || 'apex-default-jwt-secret-fallback-minimum-32-chars-long!'
  return new TextEncoder().encode(secret)
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
  const prisma = new PrismaClient()
  try {
    const dbCheck = await prisma.$queryRawUnsafe('SELECT current_database() AS db')
    assert(
      dbCheck?.[0]?.db === 'apex_disposable_test',
      `Expected apex_disposable_test, got ${dbCheck?.[0]?.db}`
    )

    // Verify new schema columns exist in apex_disposable_test
    const hpCols = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name='HomepageContent'"
    )
    const otCols = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name='OneTeamContent'"
    )
    const hpColSet = new Set(hpCols.map((c) => c.column_name))
    const otColSet = new Set(otCols.map((c) => c.column_name))
    for (const col of [
      'unveilLabel',
      'collectionEyebrow',
      'collectionHeading',
      'collectionDescription',
      'spacesHeading',
      'spacesDescription',
      'advisoryEyebrow',
      'advisoryHeading',
      'advisoryDescription',
      'advisoryFooterNote',
      'contactEyebrow',
      'contactHeading',
      'contactDescription',
      'contactPhone',
      'contactEmail',
      'contactOfficeAddress',
      'contactWhatsappNumber',
      'contactFormHeading',
      'contactFormSubtext',
      'contactSuccessHeading',
      'contactSuccessSubtext',
    ]) {
      assert(hpColSet.has(col), `Missing HomepageContent.${col}`)
    }
    for (const col of [
      'sectionEyebrow',
      'sectionHeading',
      'sectionDescription',
      'bannerLabel',
      'bannerHeading',
    ]) {
      assert(otColSet.has(col), `Missing OneTeamContent.${col}`)
    }

    // Find a SUPER_ADMIN (or super admin role user) and a non-super limited user for 403 testing
    const users = await prisma.adminUser.findMany({
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
      const perms = new Set(u.role?.permissions.map((rp) => rp.permission.key) || [])
      return !perms.has('content.update') && !perms.has('one_team.update')
    })

    const superToken = await signAdminJwt({
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role?.name || 'SUPER_ADMIN',
      tokenVersion: superAdmin.tokenVersion,
    })

    const results = []

    // 1. Unauthenticated 401 checks
    for (const [method, endpoint] of [
      ['GET', '/api/admin/homepage'],
      ['PATCH', '/api/admin/homepage'],
      ['GET', '/api/admin/one-team'],
      ['PATCH', '/api/admin/one-team'],
      ['GET', '/api/admin/collection-media'],
      ['GET', '/api/admin/countries'],
      ['GET', '/api/admin/services'],
      ['GET', '/api/admin/projects'],
    ]) {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: method === 'PATCH' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'PATCH' ? JSON.stringify({}) : undefined,
      })
      assert(res.status === 401, `${method} ${endpoint} expected 401, got ${res.status}`)
      results.push(`${method} ${endpoint} -> 401 OK`)
    }

    // 2. Authorization 403 check (if limited user exists, verify 403 on homepage PATCH; else create & cleanup synthetic limited role test user? Actually check if limitedUser exists first!)
    if (limitedUser) {
      const limitedToken = await signAdminJwt({
        id: limitedUser.id,
        email: limitedUser.email,
        name: limitedUser.name,
        role: limitedUser.role?.name,
        tokenVersion: limitedUser.tokenVersion,
      })
      const r403a = await fetch(`${BASE_URL}/api/admin/homepage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `apex_admin_session=${limitedToken}`,
        },
        body: JSON.stringify({ unveilLabel: 'HACK' }),
      })
      assert(r403a.status === 403, `Limited user PATCH /api/admin/homepage expected 403, got ${r403a.status}`)
      const r403b = await fetch(`${BASE_URL}/api/admin/one-team`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `apex_admin_session=${limitedToken}`,
        },
        body: JSON.stringify({ sectionEyebrow: 'HACK' }),
      })
      assert(r403b.status === 403, `Limited user PATCH /api/admin/one-team expected 403, got ${r403b.status}`)
      results.push(`RBAC 403 verified with user role "${limitedUser.role?.name}"`)
    } else {
      results.push('WARNING: No limited non-content user present to test 403 live')
    }

    const adminHeaders = {
      'Content-Type': 'application/json',
      Cookie: `apex_admin_session=${superToken}`,
    }

    // 3. Validation 400 checks (/uploads/ block + email format)
    const rBadHp = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ heroVideoUrl: '/uploads/forbidden.mp4' }),
    })
    assert(rBadHp.status === 400, `/uploads/ on homepage expected 400, got ${rBadHp.status}`)

    const rBadEmail = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ contactEmail: 'not-an-email' }),
    })
    assert(rBadEmail.status === 400, `Invalid email expected 400, got ${rBadEmail.status}`)

    const rBadOt = await fetch(`${BASE_URL}/api/admin/one-team`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ luxuryVillasImageUrl: '/uploads/forbidden.jpg' }),
    })
    assert(rBadOt.status === 400, `/uploads/ on one-team expected 400, got ${rBadOt.status}`)

    const rBadCountry = await fetch(`${BASE_URL}/api/admin/countries`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ name: 'Testland', cardImage: '/uploads/forbidden.jpg' }),
    })
    assert(rBadCountry.status === 400, `/uploads/ on country POST expected 400, got ${rBadCountry.status}`)
    results.push('Validation 400 checks (/uploads/ + email) OK')

    // 4. Persistence + Public API + Revalidation round-trip
    const origHp = await (await fetch(`${BASE_URL}/api/admin/homepage`, { headers: adminHeaders })).json()
    const origOt = await (await fetch(`${BASE_URL}/api/admin/one-team`, { headers: adminHeaders })).json()

    const marker = `STAGE1_VERIFY_${Date.now()}`
    const patchHp = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        collectionEyebrow: `SIGNATURE ${marker}`,
        contactEmail: 'advisory-test@apexpacificholdings.com',
      }),
    })
    assert(patchHp.status === 200, `PATCH /api/admin/homepage expected 200, got ${patchHp.status}`)

    const patchOt = await fetch(`${BASE_URL}/api/admin/one-team`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        sectionEyebrow: `WHAT WE DO ${marker}`,
      }),
    })
    assert(patchOt.status === 200, `PATCH /api/admin/one-team expected 200, got ${patchOt.status}`)

    const pubJson = await (await fetch(`${BASE_URL}/api/public/homepage`)).json()
    assert(pubJson.collectionEyebrow === `SIGNATURE ${marker}`, '/api/public/homepage missing updated collectionEyebrow')
    assert(pubJson.contactEmail === 'advisory-test@apexpacificholdings.com', '/api/public/homepage missing updated contactEmail')
    assert(pubJson.oneTeam?.sectionEyebrow === `WHAT WE DO ${marker}`, '/api/public/homepage missing updated oneTeam.sectionEyebrow')

    const ssrHtml = await (await fetch(`${BASE_URL}/`)).text()
    assert(ssrHtml.includes(`SIGNATURE ${marker}`), 'Homepage SSR HTML did not reflect revalidated collectionEyebrow')
    assert(ssrHtml.includes(`WHAT WE DO ${marker}`), 'Homepage SSR HTML did not reflect revalidated oneTeam sectionEyebrow')
    results.push('DB persistence + /api/public/homepage + SSR revalidation verified OK')

    // Restore original approved values cleanly
    await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        collectionEyebrow: origHp.collectionEyebrow,
        contactEmail: origHp.contactEmail,
      }),
    })
    await fetch(`${BASE_URL}/api/admin/one-team`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        sectionEyebrow: origOt.sectionEyebrow,
      }),
    })
    const restoredHtml = await (await fetch(`${BASE_URL}/`)).text()
    assert(!restoredHtml.includes(marker), 'Restored homepage still contained temporary marker')
    results.push('Original approved CMS values restored & revalidated OK')

    console.log(JSON.stringify({ ok: true, results }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
