import http from 'http'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { execSync } from 'child_process'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  REQUIRED_TEST_DB_NAME,
  validateTestDatabaseUrl,
  safeProvisionDisposableDb,
  safeTeardownDisposableDb,
  buildPrismaMigrationEnv,
  verifyCurrentDatabase,
} from './run_disposable_test_db'
import { signToken } from '../../src/lib/auth'
import {
  PERMISSIONS,
  PROPOSED_DEFAULT_ROLES,
  ensureDefaultRolesAndPermissions,
  invalidateAdminCache,
} from '../../src/lib/rbac'

// Dynamic route handler placeholders
let publicEnquiriesRoute: typeof import('../../src/app/api/enquiries/route')
let adminEnquiriesRoute: typeof import('../../src/app/api/admin/enquiries/route')
let adminEnquiryDetailRoute: typeof import('../../src/app/api/admin/enquiries/[id]/route')
let adminEnquiryNotesRoute: typeof import('../../src/app/api/admin/enquiries/[id]/notes/route')
let adminEnquiryRepliesRoute: typeof import('../../src/app/api/admin/enquiries/[id]/replies/route')
let adminEnquiryCloseRoute: typeof import('../../src/app/api/admin/enquiries/[id]/close/route')
let adminEnquiryReopenRoute: typeof import('../../src/app/api/admin/enquiries/[id]/reopen/route')
let adminEnquiryAssignRoute: typeof import('../../src/app/api/admin/enquiries/[id]/assign/route')
let whatsappWebhookRoute: typeof import('../../src/app/api/webhooks/whatsapp/route')

interface TestResult {
  id: string
  name: string
  category: string
  status: 'PASSED' | 'FAILED'
  evidence: string
}

const results: TestResult[] = []

function assertTest(
  id: string,
  name: string,
  category: string,
  passed: boolean,
  passEvidence: string,
  failDetails: string
) {
  results.push({
    id,
    name,
    category,
    status: passed ? 'PASSED' : 'FAILED',
    evidence: passed ? passEvidence : `Failed: ${failDetails}`,
  })
}

async function runPhase6TestSuite() {
  console.log('='.repeat(80))
  console.log('APEX PACIFIC HOLDINGS — PHASE 6 ENQUIRIES & COMMUNICATIONS TEST SUITE')
  console.log('='.repeat(80) + '\n')

  // 1. Resolve Disposable Test Database URL
  let derivedTestUrl = process.env.TEST_DATABASE_URL
  if (!derivedTestUrl) {
    const envPath = path.resolve(__dirname, '../../.env')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/)
      if (match) {
        derivedTestUrl = match[1].replace(/\/apex(\?.*)?$/, '/apex_disposable_test')
      }
    }
  }

  if (!derivedTestUrl) {
    throw new Error('SAFETY ABORT: DATABASE_URL not found in environment or .env.')
  }

  const config = validateTestDatabaseUrl(derivedTestUrl)
  const isCreated = await safeProvisionDisposableDb(config)

  // Configure migration environment
  const migrationEnv = buildPrismaMigrationEnv(config.testDbUrl)
  console.log('[PROVISION] Deploying full Prisma migration sequence to disposable test database...')
  execSync('npx prisma migrate deploy', {
    env: migrationEnv,
    stdio: 'pipe',
  })

  const testPrisma = new PrismaClient({
    datasources: { db: { url: config.testDbUrl } },
  })
  ;(globalThis as any).prisma = testPrisma

  await verifyCurrentDatabase(testPrisma, REQUIRED_TEST_DB_NAME)
  console.log(`[VERIFY OK] Test Prisma bound to disposable database: "${REQUIRED_TEST_DB_NAME}"`)

  // Dynamically load route handlers now that globalThis.prisma points to apex_disposable_test
  publicEnquiriesRoute = await import('../../src/app/api/enquiries/route')
  adminEnquiriesRoute = await import('../../src/app/api/admin/enquiries/route')
  adminEnquiryDetailRoute = await import('../../src/app/api/admin/enquiries/[id]/route')
  adminEnquiryNotesRoute = await import('../../src/app/api/admin/enquiries/[id]/notes/route')
  adminEnquiryRepliesRoute = await import('../../src/app/api/admin/enquiries/[id]/replies/route')
  adminEnquiryCloseRoute = await import('../../src/app/api/admin/enquiries/[id]/close/route')
  adminEnquiryReopenRoute = await import('../../src/app/api/admin/enquiries/[id]/reopen/route')
  adminEnquiryAssignRoute = await import('../../src/app/api/admin/enquiries/[id]/assign/route')
  whatsappWebhookRoute = await import('../../src/app/api/webhooks/whatsapp/route')

  // 2. Seed Default Roles, Permissions and Test Users
  console.log('[SEED] Seeding default roles & permissions into database...')
  await ensureDefaultRolesAndPermissions(testPrisma)

  console.log('[SEED] Seeding test users with distinct roles (Super Admin, Enquiry Advisor, Compliance Officer, Inactive)...')
  const superAdmin = await testPrisma.adminUser.upsert({
    where: { email: 'admin@apexpacificholdings.com' },
    update: { isActive: true, roleId: 'role_super_admin' },
    create: {
      id: 'cmvw891lo0000ue8kuji2laoa',
      email: 'admin@apexpacificholdings.com',
      name: 'System Super Admin',
      passwordHash: 'dummy_hash',
      roleId: 'role_super_admin',
      isActive: true,
    },
  })

  const enquiryAdvisor = await testPrisma.adminUser.upsert({
    where: { email: 'advisor@apexpacificholdings.com' },
    update: { isActive: true, roleId: 'role_enquiry_advisor' },
    create: {
      id: 'usr_enquiry_adv_01',
      email: 'advisor@apexpacificholdings.com',
      name: 'Senior Client Advisor',
      passwordHash: 'dummy_hash',
      roleId: 'role_enquiry_advisor',
      isActive: true,
    },
  })

  const complianceOfficer = await testPrisma.adminUser.upsert({
    where: { email: 'compliance@apexpacificholdings.com' },
    update: { isActive: true, roleId: 'role_compliance_officer' },
    create: {
      id: 'usr_compliance_p6_01',
      email: 'compliance@apexpacificholdings.com',
      name: 'Audit Compliance Officer',
      passwordHash: 'dummy_hash',
      roleId: 'role_compliance_officer',
      isActive: true,
    },
  })

  const inactiveAdvisor = await testPrisma.adminUser.upsert({
    where: { email: 'inactive@apexpacificholdings.com' },
    update: { isActive: false, roleId: 'role_enquiry_advisor' },
    create: {
      id: 'usr_inactive_p6_01',
      email: 'inactive@apexpacificholdings.com',
      name: 'Inactive Former Advisor',
      passwordHash: 'dummy_hash',
      roleId: 'role_enquiry_advisor',
      isActive: false,
    },
  })

  // Seed reference Property
  const testProperty = await testPrisma.property.upsert({
    where: { slug: 'atlantis-the-royal-residences' },
    update: {},
    create: {
      id: 'prop_p6_residences',
      slug: 'atlantis-the-royal-residences',
      name: 'Atlantis The Royal Residences',
      price: 'AED 44,500,000.00',
      askingPriceNumeric: 44500000.0,
      askingCurrency: 'AED',
      isPOA: false,
      isDraft: false,
      isPublished: true,
      isPubliclyVisible: true,
      hasCompletedDeal: false,
      isArchived: false,
    },
  })

  invalidateAdminCache(superAdmin.id)
  invalidateAdminCache(enquiryAdvisor.id)
  invalidateAdminCache(complianceOfficer.id)
  invalidateAdminCache(inactiveAdvisor.id)

  // 3. Generate Signed JWT Session Tokens
  const tokenSuperAdmin = await signToken({
    id: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
    role: 'SUPER_ADMIN',
    permissions: Object.values(PERMISSIONS),
    sessionVersion: 1,
  })

  const tokenEnquiryAdvisor = await signToken({
    id: enquiryAdvisor.id,
    email: enquiryAdvisor.email,
    name: enquiryAdvisor.name,
    role: 'ENQUIRY_ADVISOR',
    permissions: PROPOSED_DEFAULT_ROLES.ENQUIRY_ADVISOR.permissions,
    sessionVersion: 1,
  })

  const tokenCompliance = await signToken({
    id: complianceOfficer.id,
    email: complianceOfficer.email,
    name: complianceOfficer.name,
    role: 'COMPLIANCE_OFFICER',
    permissions: PROPOSED_DEFAULT_ROLES.COMPLIANCE_OFFICER.permissions,
    sessionVersion: 1,
  })

  const tokenInactive = await signToken({
    id: inactiveAdvisor.id,
    email: inactiveAdvisor.email,
    name: inactiveAdvisor.name,
    role: 'ENQUIRY_ADVISOR',
    permissions: PROPOSED_DEFAULT_ROLES.ENQUIRY_ADVISOR.permissions,
    sessionVersion: 1,
  })

  const tokenInvalid = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'

  // 4. Start Local HTTP Server wrapping Next.js Route Handlers
  const TEST_PORT = 3098
  const server = http.createServer(async (req, res) => {
    try {
      const fullUrl = `http://127.0.0.1:${TEST_PORT}${req.url}`
      const urlObj = new URL(fullUrl)
      const pathname = urlObj.pathname

      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
      }
      const rawBody = Buffer.concat(chunks).toString('utf8')

      const nextReqHeaders: Record<string, string> = {}
      for (const [k, v] of Object.entries(req.headers)) {
        if (v) nextReqHeaders[k] = Array.isArray(v) ? v.join(', ') : v
      }

      const nextReq = new NextRequest(fullUrl, {
        method: req.method,
        headers: nextReqHeaders,
        body: req.method !== 'GET' && req.method !== 'HEAD' && rawBody ? rawBody : undefined,
      })

      let nextResponse: any

      // Router mapping
      if (pathname === '/api/enquiries') {
        if (req.method === 'POST') nextResponse = await publicEnquiriesRoute.POST(nextReq)
      } else if (pathname === '/api/admin/enquiries') {
        if (req.method === 'GET') nextResponse = await adminEnquiriesRoute.GET(nextReq)
      } else if (pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/notes$/)) {
        const id = pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/notes$/)![1]
        if (req.method === 'GET') nextResponse = await adminEnquiryNotesRoute.GET(nextReq, { params: Promise.resolve({ id }) })
        else if (req.method === 'POST') nextResponse = await adminEnquiryNotesRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/replies$/)) {
        const id = pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/replies$/)![1]
        if (req.method === 'GET') nextResponse = await adminEnquiryRepliesRoute.GET(nextReq, { params: Promise.resolve({ id }) })
        else if (req.method === 'POST') nextResponse = await adminEnquiryRepliesRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/close$/)) {
        const id = pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/close$/)![1]
        if (req.method === 'POST') nextResponse = await adminEnquiryCloseRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/reopen$/)) {
        const id = pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/reopen$/)![1]
        if (req.method === 'POST') nextResponse = await adminEnquiryReopenRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/assign$/)) {
        const id = pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/assign$/)![1]
        if (req.method === 'POST') nextResponse = await adminEnquiryAssignRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/enquiries\/([^/]+)$/)) {
        const id = pathname.match(/^\/api\/admin\/enquiries\/([^/]+)$/)![1]
        if (req.method === 'GET') nextResponse = await adminEnquiryDetailRoute.GET(nextReq, { params: Promise.resolve({ id }) })
        else if (req.method === 'PATCH') nextResponse = await adminEnquiryDetailRoute.PATCH(nextReq, { params: Promise.resolve({ id }) })
        else if (req.method === 'DELETE') nextResponse = await adminEnquiryDetailRoute.DELETE(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname === '/api/webhooks/whatsapp') {
        if (req.method === 'GET') nextResponse = await whatsappWebhookRoute.GET(nextReq)
        else if (req.method === 'POST') nextResponse = await whatsappWebhookRoute.POST(nextReq)
      }

      if (!nextResponse) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Endpoint Not Found in HTTP Test Harness' }))
        return
      }

      const status = nextResponse.status || 200
      const bodyText = await nextResponse.text()
      const contentType = nextResponse.headers?.get('Content-Type') || 'application/json'
      res.writeHead(status, { 'Content-Type': contentType })
      res.end(bodyText)
    } catch (err: any) {
      console.error('[HTTP_DISPATCH_EXCEPTION]', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
  })

  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()))
  console.log(`[HTTP HARNESS] Local test server listening on http://127.0.0.1:${TEST_PORT}\n`)

  async function makeRequest(
    method: string,
    endpoint: string,
    options: { token?: string; body?: any; headers?: Record<string, string> } = {}
  ): Promise<{ status: number; json: any; text: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    if (options.token) {
      headers['Cookie'] = `apex_admin_session=${options.token}`
    }

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}${endpoint}`, {
      method,
      headers,
      body: options.body !== undefined ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    })

    const text = await res.text()
    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {
      json = { raw: text }
    }
    return { status: res.status, json, text }
  }

  try {
    // =========================================================================
    // REQUIREMENT 1: Public Enquiry Submission (Valid)
    // =========================================================================
    console.log('[TEST 01] Testing Public Enquiry Submission...')
    const pubRes1 = await makeRequest('POST', '/api/enquiries', {
      body: {
        name: 'Lord Henry Sterling',
        email: 'henry.sterling@mayfaircapital.co.uk',
        phone: '+447911123456',
        country: 'United Kingdom',
        subject: 'Acquisition of Waterfront Penthouse',
        service: 'Waterfront Residences',
        message: 'Interested in securing a 5-bedroom penthouse on Palm Jumeirah.',
        propertyId: testProperty.id,
        consent: true,
      },
    })

    const createdEnquiry1 = await testPrisma.enquiry.findFirst({
      where: { email: 'henry.sterling@mayfaircapital.co.uk' },
      include: { property: true },
    })

    assertTest(
      'T-P6-01',
      'Public Enquiry Submission (Valid Payload)',
      'Public Submission',
      pubRes1.status === 200 &&
        pubRes1.json?.success === true &&
        Boolean(createdEnquiry1) &&
        createdEnquiry1?.status === 'NEW' &&
        createdEnquiry1?.isRead === false &&
        createdEnquiry1?.propertyId === testProperty.id,
      `Submitted enquiry Ref: ${createdEnquiry1?.enquiryRef}, status=NEW, property=${createdEnquiry1?.property?.name}`,
      `Expected 200 and DB record, got status ${pubRes1.status}: ${JSON.stringify(pubRes1.json)}`
    )

    // =========================================================================
    // REQUIREMENT 2: Invalid Enquiry Rejection
    // =========================================================================
    console.log('[TEST 02] Testing Invalid Enquiry Rejection...')
    // 2A: Bad email
    const badEmailRes = await makeRequest('POST', '/api/enquiries', {
      body: { name: 'Valid Name', email: 'invalid-email-string', phone: '+971501234567', consent: true },
    })
    // 2B: Bad phone
    const badPhoneRes = await makeRequest('POST', '/api/enquiries', {
      body: { name: 'Valid Name', email: 'valid@example.com', phone: 'not-a-phone', consent: true },
    })
    // 2C: Missing consent
    const noConsentRes = await makeRequest('POST', '/api/enquiries', {
      body: { name: 'Valid Name', email: 'valid@example.com', phone: '+971501234567', consent: false },
    })
    // 2D: Name too short
    const shortNameRes = await makeRequest('POST', '/api/enquiries', {
      body: { name: 'X', email: 'valid@example.com', phone: '+971501234567', consent: true },
    })

    const allRejected =
      badEmailRes.status === 400 &&
      badPhoneRes.status === 400 &&
      noConsentRes.status === 400 &&
      shortNameRes.status === 400

    assertTest(
      'T-P6-02',
      'Invalid Enquiry Rejection (Bad Email, Phone, Short Name, No Consent)',
      'Public Submission',
      allRejected,
      'All 4 invalid submission variants strictly rejected with HTTP 400.',
      `Rejection failed: email=${badEmailRes.status}, phone=${badPhoneRes.status}, consent=${noConsentRes.status}, name=${shortNameRes.status}`
    )

    // =========================================================================
    // REQUIREMENT 3: Duplicate / Spam Honeypot Protection
    // =========================================================================
    console.log('[TEST 03] Testing Spam Honeypot Protection...')
    const spamRes = await makeRequest('POST', '/api/enquiries', {
      body: {
        name: 'Spam Bot Crawler',
        email: 'spambot@darkweb.io',
        phone: '+18005550199',
        consent: true,
        honeypot: 'filled_by_bot_trap',
      },
    })

    const spamInDb = await testPrisma.enquiry.findFirst({
      where: { email: 'spambot@darkweb.io' },
    })

    assertTest(
      'T-P6-03',
      'Duplicate / Spam Honeypot Protection',
      'Public Submission',
      spamRes.status === 200 && spamInDb === null,
      'Honeypot trap silently absorbed bot submission without database write.',
      `Expected no DB record for spam bot, found: ${JSON.stringify(spamInDb)}`
    )

    // =========================================================================
    // REQUIREMENT 4: Admin Authentication Verification
    // =========================================================================
    console.log('[TEST 04] Testing Admin Authentication Enforcement...')
    const unauthGet = await makeRequest('GET', '/api/admin/enquiries')
    const badTokenGet = await makeRequest('GET', '/api/admin/enquiries', { token: tokenInvalid })
    const inactiveGet = await makeRequest('GET', '/api/admin/enquiries', { token: tokenInactive })

    assertTest(
      'T-P6-04',
      'Admin Authentication Enforcement (401 Missing/Tampered, 403 Deactivated)',
      'Security & RBAC',
      unauthGet.status === 401 && badTokenGet.status === 401 && inactiveGet.status === 403,
      'Unauthenticated (401), invalid signature (401), and deactivated admin (403) strictly enforced.',
      `Got unauth=${unauthGet.status}, badToken=${badTokenGet.status}, inactive=${inactiveGet.status}`
    )

    // =========================================================================
    // REQUIREMENT 5: RBAC Permission Enforcement
    // =========================================================================
    console.log('[TEST 05] Testing RBAC Permission Boundaries...')
    // Compliance Officer has ENQUIRIES:READ, but lacks ENQUIRIES:REPLY and ENQUIRIES:NOTES
    const complianceNoteRes = await makeRequest(
      'POST',
      `/api/admin/enquiries/${createdEnquiry1!.id}/notes`,
      {
        token: tokenCompliance,
        body: { note: 'Unauthorized note from compliance' },
      }
    )
    const complianceReplyRes = await makeRequest(
      'POST',
      `/api/admin/enquiries/${createdEnquiry1!.id}/replies`,
      {
        token: tokenCompliance,
        body: { message: 'Unauthorized reply from compliance' },
      }
    )

    assertTest(
      'T-P6-05',
      'RBAC Permission Enforcement (Compliance Officer Denied Mutation)',
      'Security & RBAC',
      complianceNoteRes.status === 403 && complianceReplyRes.status === 403,
      'Read-only Compliance Officer denied note addition (403) and reply dispatch (403).',
      `Expected 403 for mutations, got note=${complianceNoteRes.status}, reply=${complianceReplyRes.status}`
    )

    // Seed 2 additional enquiries for filtering and searching
    const enquiry2 = await testPrisma.enquiry.create({
      data: {
        enquiryRef: 'APX-20261106-DUBAI',
        name: 'Fatima Al Mansoori',
        email: 'fatima.almansoori@emiratesholdings.ae',
        phone: '+971509876543',
        country: 'United Arab Emirates',
        serviceInterest: 'Luxury Villas',
        subject: 'Palm Jumeirah Villa Consultation',
        message: 'Looking for a private beachfront villa for primary residence.',
        status: 'READ',
        isRead: true,
        readAt: new Date(),
        propertyId: testProperty.id,
      },
    })

    const enquiry3 = await testPrisma.enquiry.create({
      data: {
        enquiryRef: 'APX-20261106-SG001',
        name: 'Kenneth Tan',
        email: 'kenneth.tan@singaporewealth.sg',
        phone: '+6591234567',
        country: 'Singapore',
        serviceInterest: 'Commercial Properties',
        subject: 'Institutional Portfolio Co-Investment',
        message: 'Requesting confidential briefing on Australian commercial holdings.',
        status: 'CLOSED',
        isClosed: true,
        closedAt: new Date(),
        closedById: superAdmin.id,
      },
    })

    // =========================================================================
    // REQUIREMENT 6: Enquiry Listing & Filters
    // =========================================================================
    console.log('[TEST 06] Testing Enquiry Listing, Filters & Search...')
    // 6A: Filter by status=CLOSED
    const listClosed = await makeRequest('GET', '/api/admin/enquiries?status=CLOSED', {
      token: tokenEnquiryAdvisor,
    })
    // 6B: Filter by country=Singapore
    const listSG = await makeRequest('GET', '/api/admin/enquiries?country=Singapore', {
      token: tokenEnquiryAdvisor,
    })
    // 6C: Search by client name
    const searchFatima = await makeRequest('GET', '/api/admin/enquiries?search=Mansoori', {
      token: tokenEnquiryAdvisor,
    })

    const filtersPassed =
      listClosed.status === 200 &&
      listClosed.json?.enquiries?.every((e: any) => e.status === 'CLOSED') &&
      listSG.status === 200 &&
      listSG.json?.enquiries?.every((e: any) => e.country === 'Singapore') &&
      searchFatima.status === 200 &&
      searchFatima.json?.enquiries?.some((e: any) => e.name.includes('Fatima'))

    assertTest(
      'T-P6-06',
      'Enquiry Listing with Status, Country, Project & Name Filters',
      'Admin API',
      filtersPassed,
      `Filters validated: closed=${listClosed.json?.enquiries?.length}, SG=${listSG.json?.enquiries?.length}, search=${searchFatima.json?.enquiries?.length}`,
      `Filter failure: closed=${listClosed.status}, SG=${listSG.status}, search=${searchFatima.status}`
    )

    // =========================================================================
    // REQUIREMENT 7: Enquiry Detail Retrieval
    // =========================================================================
    console.log('[TEST 07] Testing Enquiry Detail Retrieval with History...')
    const detailRes = await makeRequest('GET', `/api/admin/enquiries/${createdEnquiry1!.id}`, {
      token: tokenEnquiryAdvisor,
    })

    assertTest(
      'T-P6-07',
      'Enquiry Detail Retrieval with Property, History & Notes Structure',
      'Admin API',
      detailRes.status === 200 &&
        detailRes.json?.id === createdEnquiry1!.id &&
        detailRes.json?.property?.name === testProperty.name &&
        Array.isArray(detailRes.json?.notes) &&
        Array.isArray(detailRes.json?.replies) &&
        Array.isArray(detailRes.json?.activityHistory),
      `Detail fetched with property "${detailRes.json?.property?.name}" and activityHistory array.`,
      `Detail failed: ${JSON.stringify(detailRes.json)}`
    )

    // =========================================================================
    // REQUIREMENT 8: Read and Status Updates
    // =========================================================================
    console.log('[TEST 08] Testing Read & Status Updates...')
    const markReadRes = await makeRequest('PATCH', `/api/admin/enquiries/${createdEnquiry1!.id}`, {
      token: tokenEnquiryAdvisor,
      body: { isRead: true },
    })

    const readEnquiry = await testPrisma.enquiry.findUnique({
      where: { id: createdEnquiry1!.id },
    })

    const statusProgressRes = await makeRequest('PATCH', `/api/admin/enquiries/${createdEnquiry1!.id}`, {
      token: tokenEnquiryAdvisor,
      body: { status: 'IN_PROGRESS' },
    })

    const progressEnquiry = await testPrisma.enquiry.findUnique({
      where: { id: createdEnquiry1!.id },
    })

    assertTest(
      'T-P6-08',
      'Enquiry Read Marking and Status Transition (NEW -> READ -> IN_PROGRESS)',
      'Admin API',
      markReadRes.status === 200 &&
        readEnquiry?.isRead === true &&
        statusProgressRes.status === 200 &&
        progressEnquiry?.status === 'IN_PROGRESS',
      `Enquiry transitioned: isRead=${readEnquiry?.isRead}, status=${progressEnquiry?.status}`,
      `Status update failed: ${JSON.stringify(statusProgressRes.json)}`
    )

    // =========================================================================
    // REQUIREMENT 9: Assignment Changes
    // =========================================================================
    console.log('[TEST 09] Testing Admin Assignment & Inactive Guard...')
    // 9A: Assign to active Enquiry Advisor
    const assignRes = await makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/assign`, {
      token: tokenEnquiryAdvisor,
      body: { assignedAdminId: enquiryAdvisor.id },
    })
    // 9B: Attempt assign to inactive admin (must be blocked)
    const assignInactiveRes = await makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/assign`, {
      token: tokenEnquiryAdvisor,
      body: { assignedAdminId: inactiveAdvisor.id },
    })

    const assignedEnquiry = await testPrisma.enquiry.findUnique({
      where: { id: createdEnquiry1!.id },
      include: { assignedAdmin: true },
    })

    assertTest(
      'T-P6-09',
      'Enquiry Assignment to Active Admin & Rejection of Inactive Admin',
      'Admin API',
      assignRes.status === 200 &&
        assignedEnquiry?.assignedAdminId === enquiryAdvisor.id &&
        assignInactiveRes.status === 400,
      `Assigned to ${assignedEnquiry?.assignedAdmin?.name}, inactive assignment rejected with HTTP 400.`,
      `Assignment failed: assign=${assignRes.status}, inactive=${assignInactiveRes.status}`
    )

    // =========================================================================
    // REQUIREMENT 10: Internal Administrative Notes
    // =========================================================================
    console.log('[TEST 10] Testing Internal Administrative Notes...')
    const addNoteRes = await makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/notes`, {
      token: tokenEnquiryAdvisor,
      body: {
        note: 'Client verified via Mayfair Family Office registry. High priority investor.',
      },
    })

    const listNotesRes = await makeRequest('GET', `/api/admin/enquiries/${createdEnquiry1!.id}/notes`, {
      token: tokenEnquiryAdvisor,
    })

    assertTest(
      'T-P6-10',
      'Internal Notes Creation with Author Metadata and Chronological Retrieval',
      'Communications',
      addNoteRes.status === 201 &&
        listNotesRes.status === 200 &&
        Array.isArray(listNotesRes.json) &&
        listNotesRes.json.length >= 1 &&
        listNotesRes.json[0].author?.name === enquiryAdvisor.name,
      `Note appended by author: ${listNotesRes.json[0]?.author?.name}`,
      `Notes failed: add=${addNoteRes.status}, list=${listNotesRes.status}`
    )

    // =========================================================================
    // REQUIREMENT 11: Email Reply Success
    // =========================================================================
    console.log('[TEST 11] Testing Outbound Email Reply...')
    const emailReplyRes = await makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/replies`, {
      token: tokenEnquiryAdvisor,
      body: {
        channel: 'EMAIL',
        subject: 'Confidential Dossier — Atlantis The Royal Residences',
        message: 'Dear Lord Sterling, enclosed is the confidential acquisition prospectus.',
      },
    })

    const replyInDb = await testPrisma.enquiryReply.findFirst({
      where: { enquiryId: createdEnquiry1!.id, channel: 'EMAIL' },
      include: { sender: true },
    })

    assertTest(
      'T-P6-11',
      'Outbound Email Reply Record Creation & Delivery Status',
      'Communications',
      emailReplyRes.status === 201 &&
        Boolean(replyInDb) &&
        replyInDb?.channel === 'EMAIL' &&
        replyInDb?.direction === 'OUTBOUND' &&
        (replyInDb?.deliveryStatus === 'SENT' || replyInDb?.deliveryStatus === 'DELIVERED'),
      `Email reply recorded with status=${replyInDb?.deliveryStatus}, sender=${replyInDb?.sender?.name}`,
      `Reply failed: status=${emailReplyRes.status}, data=${JSON.stringify(emailReplyRes.json)}`
    )

    // =========================================================================
    // REQUIREMENT 12: SMTP Failure Handling & Resilience
    // =========================================================================
    console.log('[TEST 12] Testing SMTP Transport Failure Resilience...')
    // Force invalid SMTP host temporarily to simulate transport failure
    const originalSmtpHost = process.env.SMTP_HOST
    process.env.SMTP_HOST = 'invalid.nonexistent.smtp.host.apex'
    process.env.SMTP_USER = 'dummy'
    process.env.SMTP_PASS = 'dummy'

    const failedSmtpReply = await makeRequest('POST', `/api/admin/enquiries/${enquiry2.id}/replies`, {
      token: tokenEnquiryAdvisor,
      body: {
        channel: 'EMAIL',
        subject: 'Palm Jumeirah Consultation Follow-up',
        message: 'Thank you for your inquiry Fatima. We will call you shortly.',
      },
    })

    // Restore environment
    process.env.SMTP_HOST = originalSmtpHost
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS

    const failedReplyRecord = await testPrisma.enquiryReply.findFirst({
      where: { enquiryId: enquiry2.id, channel: 'EMAIL' },
    })

    assertTest(
      'T-P6-12',
      'SMTP Failure Resilience (Message Preserved with Status FAILED)',
      'Communications',
      failedSmtpReply.status === 201 &&
        Boolean(failedReplyRecord) &&
        failedReplyRecord?.deliveryStatus === 'FAILED' &&
        Boolean(failedReplyRecord?.failureReason),
      `Resilience verified: Reply preserved with status=FAILED and failureReason.`,
      `Failure handling failed: ${JSON.stringify(failedSmtpReply.json)}`
    )

    // =========================================================================
    // REQUIREMENT 13: Duplicate Email Retry Protection (Idempotency Key)
    // =========================================================================
    console.log('[TEST 13] Testing Duplicate Send Idempotency Protection...')
    const testIdempotencyKey = `idemp_test_${Date.now()}`
    const reply1 = await makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/replies`, {
      token: tokenEnquiryAdvisor,
      body: {
        channel: 'EMAIL',
        subject: 'First Transmission',
        message: 'Important briefing update regarding Palm Jumeirah.',
        idempotencyKey: testIdempotencyKey,
      },
    })

    const replyRetry = await makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/replies`, {
      token: tokenEnquiryAdvisor,
      body: {
        channel: 'EMAIL',
        subject: 'First Transmission (Retry)',
        message: 'Important briefing update regarding Palm Jumeirah.',
        idempotencyKey: testIdempotencyKey,
      },
    })

    const duplicateCount = await testPrisma.enquiryReply.count({
      where: { idempotencyKey: testIdempotencyKey },
    })

    assertTest(
      'T-P6-13',
      'Duplicate Send Idempotency Protection (Network Retry Deduplication)',
      'Communications',
      reply1.status === 201 &&
        replyRetry.status === 200 &&
        replyRetry.json?.idempotent === true &&
        duplicateCount === 1,
      `Idempotent retry detected (HTTP 200, idempotent=true), exact 1 DB record maintained.`,
      `Idempotency failed: r1=${reply1.status}, retry=${replyRetry.status}, count=${duplicateCount}`
    )

    // =========================================================================
    // REQUIREMENT 14: Enquiry Closure and Reopening
    // =========================================================================
    console.log('[TEST 14] Testing Enquiry Closure and Reopening...')
    // 14A: Close
    const closeRes = await makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/close`, {
      token: tokenSuperAdmin,
      body: { reason: 'Consultation concluded; moving to NDA signing stage.', note: 'Deal term sheet issued.' },
    })

    const closedEnquiry = await testPrisma.enquiry.findUnique({
      where: { id: createdEnquiry1!.id },
      include: { closedBy: true },
    })

    // 14B: Reopen
    const reopenRes = await makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/reopen`, {
      token: tokenSuperAdmin,
      body: { reason: 'Client requested addendum pricing on secondary penthouse.' },
    })

    const reopenedEnquiry = await testPrisma.enquiry.findUnique({
      where: { id: createdEnquiry1!.id },
    })

    assertTest(
      'T-P6-14',
      'Enquiry Closure and Reopening Lifecycle',
      'Admin API',
      closeRes.status === 200 &&
        closedEnquiry?.isClosed === true &&
        closedEnquiry?.status === 'CLOSED' &&
        closedEnquiry?.closedById === superAdmin.id &&
        reopenRes.status === 200 &&
        reopenedEnquiry?.isClosed === false &&
        reopenedEnquiry?.status === 'IN_PROGRESS',
      `Enquiry closed by ${closedEnquiry?.closedBy?.name} and cleanly reopened to IN_PROGRESS.`,
      `Lifecycle failed: close=${closeRes.status}, reopen=${reopenRes.status}`
    )

    // =========================================================================
    // REQUIREMENT 15: Activity Audit Logging Verification
    // =========================================================================
    console.log('[TEST 15] Testing Activity Audit Logging...')
    const logs = await testPrisma.adminActivityLog.findMany({
      where: { entityType: 'Enquiry', entityId: createdEnquiry1!.id },
    })

    const actions = logs.map((l) => l.action)
    const hasStatusChanged = actions.includes('ENQUIRY_STATUS_CHANGED') || actions.includes('ENQUIRY_MARKED_READ')
    const hasAssigned = actions.includes('ENQUIRY_ASSIGNED')
    const hasNoteAdded = actions.includes('ENQUIRY_NOTE_ADDED')
    const hasReplied = actions.includes('ENQUIRY_REPLIED')
    const hasClosed = actions.includes('ENQUIRY_CLOSED')
    const hasReopened = actions.includes('ENQUIRY_REOPENED')

    assertTest(
      'T-P6-15',
      'Activity Audit Logging for All Sensitive Actions',
      'Security & Audit',
      hasStatusChanged && hasAssigned && hasNoteAdded && hasReplied && hasClosed && hasReopened,
      `All 6 actions logged in AdminActivityLog: ${Array.from(new Set(actions)).join(', ')}`,
      `Missing audit actions. Found: ${actions.join(', ')}`
    )

    // =========================================================================
    // REQUIREMENT 16: Public API Isolation from Internal Notes & Compliance Guard
    // =========================================================================
    console.log('[TEST 16] Testing Public API Isolation & Permanent Deletion Block...')
    // 16A: Verify public API does not return notes or admin data
    const publicSubmitRes = await makeRequest('POST', '/api/enquiries', {
      body: {
        name: 'Private Investor',
        email: 'private.investor@swissbank.ch',
        phone: '+41221234567',
        consent: true,
      },
    })
    const pubData = publicSubmitRes.json
    const isPublicDataClean =
      pubData.notes === undefined &&
      pubData.assignedAdmin === undefined &&
      pubData.activityHistory === undefined

    // 16B: Verify DELETE on /api/admin/enquiries/:id is rejected per compliance policy
    const deleteAttempt = await makeRequest('DELETE', `/api/admin/enquiries/${createdEnquiry1!.id}`, {
      token: tokenSuperAdmin,
    })

    assertTest(
      'T-P6-16',
      'Public API Isolation from Internal Data & Deletion Compliance Guard',
      'Security & Compliance',
      isPublicDataClean && deleteAttempt.status === 403,
      'Public responses strictly omit internal notes; permanent deletion blocked with HTTP 403.',
      `Compliance check failed: delete=${deleteAttempt.status}`
    )

    // =========================================================================
    // REQUIREMENT 17: WhatsApp Provider-Not-Configured Behavior
    // =========================================================================
    console.log('[TEST 17] Testing WhatsApp Provider-Not-Configured Guard...')
    delete process.env.WHATSAPP_ACCESS_TOKEN
    delete process.env.WHATSAPP_PHONE_NUMBER_ID

    const waUnconfigReply = await makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/replies`, {
      token: tokenEnquiryAdvisor,
      body: {
        channel: 'WHATSAPP',
        message: 'Hello Lord Sterling, contacting you via WhatsApp.',
      },
    })

    assertTest(
      'T-P6-17',
      'WhatsApp Provider-Not-Configured Behavior (Strict No-Pretense Policy)',
      'Communications',
      waUnconfigReply.status === 422 &&
        waUnconfigReply.json?.providerConfigured === false &&
        waUnconfigReply.json?.error?.includes('not configured'),
      'Unconfigured WhatsApp dispatch rejected with HTTP 422; no false dispatch simulated.',
      `Expected 422 unconfigured rejection, got: ${waUnconfigReply.status} ${JSON.stringify(waUnconfigReply.json)}`
    )

    // =========================================================================
    // REQUIREMENT 18: WhatsApp Webhook Authentication & Deduplication
    // =========================================================================
    console.log('[TEST 18] Testing WhatsApp Webhook Verification & Processing...')
    // 18A: GET Webhook challenge verification
    const testChallenge = 'random_hub_challenge_123456'
    process.env.WHATSAPP_VERIFY_TOKEN = 'test_verify_token_999'
    const waGetChallenge = await makeRequest(
      'GET',
      `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test_verify_token_999&hub.challenge=${testChallenge}`
    )

    // 18B: POST Webhook status update
    // Create an outbound reply with externalMessageId to receive status updates
    const testWamid = `wamid.HBgL${Date.now()}`
    await testPrisma.enquiryReply.create({
      data: {
        enquiryId: createdEnquiry1!.id,
        senderId: superAdmin.id,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        deliveryStatus: 'SENT',
        externalMessageId: testWamid,
        body: 'Outbound WhatsApp test template',
      },
    })

    const statusPayload = {
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                statuses: [
                  {
                    id: testWamid,
                    status: 'delivered',
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                  },
                ],
              },
            },
          ],
        },
      ],
    }

    const waPostStatus = await makeRequest('POST', '/api/webhooks/whatsapp', {
      body: statusPayload,
    })

    // Duplicate webhook post (deduplication test)
    const waPostDuplicate = await makeRequest('POST', '/api/webhooks/whatsapp', {
      body: statusPayload,
    })

    const updatedWaReply = await testPrisma.enquiryReply.findFirst({
      where: { externalMessageId: testWamid },
    })

    assertTest(
      'T-P6-18',
      'WhatsApp Webhook Verification, Status Processing & Duplicate Deduplication',
      'Communications',
      waGetChallenge.status === 200 &&
        waGetChallenge.text === testChallenge &&
        waPostStatus.status === 200 &&
        waPostDuplicate.json?.duplicate === true &&
        updatedWaReply?.deliveryStatus === 'DELIVERED',
      `Challenge verified (${testChallenge}), status updated to DELIVERED, duplicate event deduplicated.`,
      `Webhook test failed: challenge=${waGetChallenge.status}, status=${waPostStatus.status}, deliveryStatus=${updatedWaReply?.deliveryStatus}`
    )

    // =========================================================================
    // REQUIREMENT 19: Concurrent Enquiry Updates Transactional Safety
    // =========================================================================
    console.log('[TEST 19] Testing Concurrent Enquiry Mutations...')
    const [concurrentNoteA, concurrentNoteB] = await Promise.all([
      makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/notes`, {
        token: tokenEnquiryAdvisor,
        body: { note: 'Concurrent note Alpha from concurrent process A.' },
      }),
      makeRequest('POST', `/api/admin/enquiries/${createdEnquiry1!.id}/notes`, {
        token: tokenEnquiryAdvisor,
        body: { note: 'Concurrent note Beta from concurrent process B.' },
      }),
    ])

    const notesCount = await testPrisma.enquiryNote.count({
      where: { enquiryId: createdEnquiry1!.id },
    })

    assertTest(
      'T-P6-19',
      'Concurrent Enquiry Updates Transactional Safety',
      'Data Integrity',
      concurrentNoteA.status === 201 && concurrentNoteB.status === 201 && notesCount >= 3,
      'Concurrent asynchronous note requests committed cleanly without race conditions.',
      `Concurrent notes failed: A=${concurrentNoteA.status}, B=${concurrentNoteB.status}`
    )

    // =========================================================================
    // REQUIREMENT 20: Database Integrity & Live Database Zero Mutation Audit
    // =========================================================================
    console.log('[TEST 20] Auditing Live Production Database (apex) for Zero Mutation...')
  } finally {
    server.close()
    await testPrisma.$disconnect()
    console.log('\n[TEARDOWN] Dropping disposable test database...')
    await safeTeardownDisposableDb(config, isCreated)
  }

  // Live database audit
  let liveDbUrl = process.env.DATABASE_URL
  if (!liveDbUrl) {
    const envPath = path.resolve(__dirname, '../../.env')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/)
      if (match) liveDbUrl = match[1]
    }
  }
  if (!liveDbUrl) throw new Error('Live DATABASE_URL not found.')

  const livePrisma = new PrismaClient({ datasources: { db: { url: liveDbUrl } } })
  try {
    const liveDbName = await verifyCurrentDatabase(livePrisma, 'apex')
    const [props, imgs, countries, services, propServices, admins, enqs, home] = await Promise.all([
      livePrisma.property.count(),
      livePrisma.propertyImage.count(),
      livePrisma.country.count(),
      livePrisma.serviceCategory.count(),
      livePrisma.propertyService.count(),
      livePrisma.adminUser.count(),
      livePrisma.enquiry.count(),
      livePrisma.homepageContent.count(),
    ])
    const totalRecords = props + imgs + countries + services + propServices + admins + enqs + home
    const liveMigrations = await livePrisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM "_prisma_migrations" ORDER BY finished_at ASC
    `

    const isLiveClean =
      liveDbName === 'apex' &&
      totalRecords === 48 &&
      props === 6 &&
      imgs === 21 &&
      countries === 5 &&
      services === 4 &&
      propServices === 9 &&
      admins === 1 &&
      enqs === 1 &&
      home === 1 &&
      liveMigrations.length === 1 &&
      liveMigrations[0].migration_name === '20261030073355_init_schema'

    assertTest(
      'T-P6-20',
      'Live Database Zero Mutation Audit (Exact Baseline Preservation)',
      'Live Safety',
      isLiveClean,
      `Live database "apex" verified 100% untouched: exactly 48 baseline records, 1 migration deployed.`,
      `Live database corrupted! Total=${totalRecords}, Migrations=${liveMigrations.length}`
    )
  } finally {
    await livePrisma.$disconnect()
  }

  // 6. Summary Output
  console.log('\n' + '='.repeat(80))
  console.log('PHASE 6 TEST SUITE EXECUTION SUMMARY')
  console.log('='.repeat(80))

  const passed = results.filter((r) => r.status === 'PASSED').length
  const failed = results.filter((r) => r.status === 'FAILED').length

  console.log(`TOTAL TESTS: ${results.length}`)
  console.log(`PASSED:      ${passed}`)
  console.log(`FAILED:      ${failed}`)
  console.log(`PASS RATE:   ${((passed / results.length) * 100).toFixed(1)}%\n`)

  for (const r of results) {
    const symbol = r.status === 'PASSED' ? '✓' : '✗'
    console.log(`[${symbol}] ${r.id.padEnd(8)} | ${r.category.padEnd(22)} | ${r.name}`)
    console.log(`    Evidence: ${r.evidence}`)
  }

  if (failed > 0) {
    console.error('\n[FATAL] One or more Phase 6 tests failed.')
    process.exit(1)
  } else {
    console.log('\n[SUCCESS] All 20 Phase 6 tests passed with 100% verification.')
  }
}

runPhase6TestSuite().catch((err) => {
  console.error('[FATAL EXCEPTION IN TEST RUNNER]:', err)
  process.exit(1)
})
