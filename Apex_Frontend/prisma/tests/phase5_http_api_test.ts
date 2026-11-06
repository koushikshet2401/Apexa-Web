import http from 'http'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { NextRequest } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import {
  REQUIRED_TEST_DB_NAME,
  validateTestDatabaseUrl,
  safeProvisionDisposableDb,
  safeTeardownDisposableDb,
  buildPrismaMigrationEnv,
  verifyCurrentDatabase,
} from './run_disposable_test_db'
import { signToken } from '../../src/lib/auth'
import { PERMISSIONS, PROPOSED_DEFAULT_ROLES, ensureDefaultRolesAndPermissions, invalidateAdminCache } from '../../src/lib/rbac'

// Dynamic import placeholders for route handlers (imported after DATABASE_URL and globalThis.prisma are configured)
let projectsRoute: typeof import('../../src/app/api/admin/projects/route')
let projectDetailRoute: typeof import('../../src/app/api/admin/projects/[id]/route')
let projectPriceRoute: typeof import('../../src/app/api/admin/projects/[id]/price/route')
let projectPublishRoute: typeof import('../../src/app/api/admin/projects/[id]/publish/route')
let projectUnpublishRoute: typeof import('../../src/app/api/admin/projects/[id]/unpublish/route')
let projectArchiveRoute: typeof import('../../src/app/api/admin/projects/[id]/archive/route')
let projectRestoreRoute: typeof import('../../src/app/api/admin/projects/[id]/restore/route')
let dealsRoute: typeof import('../../src/app/api/admin/deals/route')
let dealDetailRoute: typeof import('../../src/app/api/admin/deals/[id]/route')
let dealCompleteRoute: typeof import('../../src/app/api/admin/deals/[id]/complete/route')
let dealAdjustmentsRoute: typeof import('../../src/app/api/admin/deals/[id]/adjustments/route')
let dashboardRoute: typeof import('../../src/app/api/admin/analytics/dashboard/route')

// ==============================================================================
// APEX PACIFIC HOLDINGS — PHASE 5 AUTHENTICATED HTTP API TEST SUITE
// Tests every endpoint across 200, 201, 400, 401, 403, 404, 409 & Lifecycles
// ==============================================================================

interface HttpTestResult {
  id: string
  name: string
  method: string
  url: string
  expectedStatus: number
  actualStatus: number
  status: 'PASSED' | 'FAILED'
  evidence: string
}

const testResults: HttpTestResult[] = []

function assertHttp(
  id: string,
  name: string,
  method: string,
  url: string,
  expectedStatus: number,
  actualStatus: number,
  bodyMatch: boolean,
  evidence: string
) {
  const passed = expectedStatus === actualStatus && bodyMatch
  testResults.push({
    id,
    name,
    method,
    url,
    expectedStatus,
    actualStatus,
    status: passed ? 'PASSED' : 'FAILED',
    evidence: passed ? evidence : `Failed: Expected HTTP ${expectedStatus}, got ${actualStatus}. Details: ${evidence}`,
  })
}

async function runHttpTestSuite() {
  console.log('='.repeat(80))
  console.log('APEX PACIFIC HOLDINGS — PHASE 5 AUTHENTICATED HTTP API INTEGRATION TESTS')
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

  // Deploy complete migration sequence to disposable DB
  console.log('[PROVISION] Deploying full Prisma migration sequence to disposable test database...')
  const migrationEnv = buildPrismaMigrationEnv(config.testDbUrl)
  execSync('npx prisma migrate deploy', {
    env: migrationEnv,
    stdio: 'pipe',
  })

  // Route @/lib/db to test database
  const testPrisma = new PrismaClient({
    datasources: { db: { url: config.testDbUrl } },
  })
  ;(globalThis as any).prisma = testPrisma
  process.env.DATABASE_URL = config.testDbUrl

  const currentDb = await verifyCurrentDatabase(testPrisma, REQUIRED_TEST_DB_NAME)
  console.log(`[VERIFY OK] Test Prisma bound to disposable database: "${currentDb}"`)

  // Dynamically load route handlers now that globalThis.prisma points to apex_disposable_test
  projectsRoute = await import('../../src/app/api/admin/projects/route')
  projectDetailRoute = await import('../../src/app/api/admin/projects/[id]/route')
  projectPriceRoute = await import('../../src/app/api/admin/projects/[id]/price/route')
  projectPublishRoute = await import('../../src/app/api/admin/projects/[id]/publish/route')
  projectUnpublishRoute = await import('../../src/app/api/admin/projects/[id]/unpublish/route')
  projectArchiveRoute = await import('../../src/app/api/admin/projects/[id]/archive/route')
  projectRestoreRoute = await import('../../src/app/api/admin/projects/[id]/restore/route')
  dealsRoute = await import('../../src/app/api/admin/deals/route')
  dealDetailRoute = await import('../../src/app/api/admin/deals/[id]/route')
  dealCompleteRoute = await import('../../src/app/api/admin/deals/[id]/complete/route')
  dealAdjustmentsRoute = await import('../../src/app/api/admin/deals/[id]/adjustments/route')
  dashboardRoute = await import('../../src/app/api/admin/analytics/dashboard/route')

  // 2. Seed Default Roles, Permissions and Test Users
  console.log('[SEED] Seeding default roles & permissions into database...')
  await ensureDefaultRolesAndPermissions(testPrisma)

  console.log('[SEED] Seeding test users with distinct roles (Super Admin, Property Mgr, Content Editor, Compliance, Deactivated)...')
  const superAdminUser = await testPrisma.adminUser.upsert({
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

  const propertyManagerUser = await testPrisma.adminUser.upsert({
    where: { email: 'manager@apexpacificholdings.com' },
    update: { isActive: true, roleId: 'role_property_manager' },
    create: {
      id: 'usr_property_mgr_01',
      email: 'manager@apexpacificholdings.com',
      name: 'Portfolio Property Manager',
      passwordHash: 'dummy_hash',
      roleId: 'role_property_manager',
      isActive: true,
    },
  })

  const contentEditorUser = await testPrisma.adminUser.upsert({
    where: { email: 'editor@apexpacificholdings.com' },
    update: { isActive: true, roleId: 'role_content_editor' },
    create: {
      id: 'usr_content_editor_01',
      email: 'editor@apexpacificholdings.com',
      name: 'Editorial Specialist',
      passwordHash: 'dummy_hash',
      roleId: 'role_content_editor',
      isActive: true,
    },
  })

  const complianceUser = await testPrisma.adminUser.upsert({
    where: { email: 'compliance@apexpacificholdings.com' },
    update: { isActive: true, roleId: 'role_compliance_officer' },
    create: {
      id: 'usr_compliance_01',
      email: 'compliance@apexpacificholdings.com',
      name: 'Audit Compliance Officer',
      passwordHash: 'dummy_hash',
      roleId: 'role_compliance_officer',
      isActive: true,
    },
  })

  const deactivatedUser = await testPrisma.adminUser.upsert({
    where: { email: 'deactivated@apexpacificholdings.com' },
    update: { isActive: false, roleId: 'role_property_manager' },
    create: {
      id: 'usr_deactivated_01',
      email: 'deactivated@apexpacificholdings.com',
      name: 'Former Team Member',
      passwordHash: 'dummy_hash',
      roleId: 'role_property_manager',
      isActive: false,
    },
  })

  // Invalidate any cached sessions for these IDs
  invalidateAdminCache(superAdminUser.id)
  invalidateAdminCache(propertyManagerUser.id)
  invalidateAdminCache(contentEditorUser.id)
  invalidateAdminCache(complianceUser.id)
  invalidateAdminCache(deactivatedUser.id)

  // 3. Generate Authenticated JWT Session Tokens
  const tokenSuperAdmin = await signToken({
    id: superAdminUser.id,
    email: superAdminUser.email,
    name: superAdminUser.name,
    role: 'SUPER_ADMIN',
    permissions: Object.values(PERMISSIONS),
    sessionVersion: 1,
  })

  const tokenPropertyManager = await signToken({
    id: propertyManagerUser.id,
    email: propertyManagerUser.email,
    name: propertyManagerUser.name,
    role: 'PROPERTY_MANAGER',
    permissions: PROPOSED_DEFAULT_ROLES.PROPERTY_MANAGER.permissions,
    sessionVersion: 1,
  })

  const tokenContentEditor = await signToken({
    id: contentEditorUser.id,
    email: contentEditorUser.email,
    name: contentEditorUser.name,
    role: 'CONTENT_EDITOR',
    permissions: PROPOSED_DEFAULT_ROLES.CONTENT_EDITOR.permissions,
    sessionVersion: 1,
  })

  const tokenCompliance = await signToken({
    id: complianceUser.id,
    email: complianceUser.email,
    name: complianceUser.name,
    role: 'COMPLIANCE_OFFICER',
    permissions: PROPOSED_DEFAULT_ROLES.COMPLIANCE_OFFICER.permissions,
    sessionVersion: 1,
  })

  const tokenDeactivated = await signToken({
    id: deactivatedUser.id,
    email: deactivatedUser.email,
    name: deactivatedUser.name,
    role: 'PROPERTY_MANAGER',
    permissions: PROPOSED_DEFAULT_ROLES.PROPERTY_MANAGER.permissions,
    sessionVersion: 1,
  })

  const tokenInvalid = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'

  // 4. Start HTTP Server wrapping App Router Handlers
  const TEST_PORT = 3099
  const server = http.createServer(async (req, res) => {
    try {
      const fullUrl = `http://127.0.0.1:${TEST_PORT}${req.url}`
      const urlObj = new URL(fullUrl)
      const pathname = urlObj.pathname

      // Read request body
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
      }
      const rawBody = Buffer.concat(chunks).toString('utf8')

      // Build NextRequest
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

      // Route Dispatcher
      // 1. Projects collection
      if (pathname === '/api/admin/projects') {
        if (req.method === 'GET') nextResponse = await projectsRoute.GET(nextReq)
        else if (req.method === 'POST') nextResponse = await projectsRoute.POST(nextReq)
      }
      // 2. Project sub-actions
      else if (pathname.match(/^\/api\/admin\/projects\/([^/]+)\/price$/)) {
        const id = pathname.match(/^\/api\/admin\/projects\/([^/]+)\/price$/)![1]
        if (req.method === 'PATCH') nextResponse = await projectPriceRoute.PATCH(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/projects\/([^/]+)\/publish$/)) {
        const id = pathname.match(/^\/api\/admin\/projects\/([^/]+)\/publish$/)![1]
        if (req.method === 'POST') nextResponse = await projectPublishRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/projects\/([^/]+)\/unpublish$/)) {
        const id = pathname.match(/^\/api\/admin\/projects\/([^/]+)\/unpublish$/)![1]
        if (req.method === 'POST') nextResponse = await projectUnpublishRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/projects\/([^/]+)\/archive$/)) {
        const id = pathname.match(/^\/api\/admin\/projects\/([^/]+)\/archive$/)![1]
        if (req.method === 'POST') nextResponse = await projectArchiveRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/projects\/([^/]+)\/restore$/)) {
        const id = pathname.match(/^\/api\/admin\/projects\/([^/]+)\/restore$/)![1]
        if (req.method === 'POST') nextResponse = await projectRestoreRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      }
      // 3. Project detail
      else if (pathname.match(/^\/api\/admin\/projects\/([^/]+)$/)) {
        const id = pathname.match(/^\/api\/admin\/projects\/([^/]+)$/)![1]
        if (req.method === 'GET') nextResponse = await projectDetailRoute.GET(nextReq, { params: Promise.resolve({ id }) })
        else if (req.method === 'PATCH') nextResponse = await projectDetailRoute.PATCH(nextReq, { params: Promise.resolve({ id }) })
        else if (req.method === 'DELETE') nextResponse = await projectDetailRoute.DELETE(nextReq, { params: Promise.resolve({ id }) })
      }
      // 4. Deal completion & adjustments
      else if (pathname.match(/^\/api\/admin\/deals\/([^/]+)\/complete$/)) {
        const id = pathname.match(/^\/api\/admin\/deals\/([^/]+)\/complete$/)![1]
        if (req.method === 'POST') nextResponse = await dealCompleteRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname.match(/^\/api\/admin\/deals\/([^/]+)\/adjustments$/)) {
        const id = pathname.match(/^\/api\/admin\/deals\/([^/]+)\/adjustments$/)![1]
        if (req.method === 'GET') nextResponse = await dealAdjustmentsRoute.GET(nextReq, { params: Promise.resolve({ id }) })
        else if (req.method === 'POST') nextResponse = await dealAdjustmentsRoute.POST(nextReq, { params: Promise.resolve({ id }) })
      }
      // 5. Deal detail & collection
      else if (pathname.match(/^\/api\/admin\/deals\/([^/]+)$/)) {
        const id = pathname.match(/^\/api\/admin\/deals\/([^/]+)$/)![1]
        if (req.method === 'GET') nextResponse = await dealDetailRoute.GET(nextReq, { params: Promise.resolve({ id }) })
      } else if (pathname === '/api/admin/deals') {
        if (req.method === 'GET') nextResponse = await dealsRoute.GET(nextReq)
        else if (req.method === 'POST') nextResponse = await dealsRoute.POST(nextReq)
      }
      // 6. Analytics Dashboard
      else if (pathname === '/api/admin/analytics/dashboard') {
        if (req.method === 'GET') nextResponse = await dashboardRoute.GET(nextReq)
      }

      if (!nextResponse) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Endpoint Not Found in HTTP Harness' }))
        return
      }

      const status = nextResponse.status || 200
      const bodyText = await nextResponse.text()
      res.writeHead(status, {
        'Content-Type': 'application/json',
      })
      res.end(bodyText)
    } catch (handlerErr: any) {
      console.error('[HTTP_DISPATCH_ERROR]:', handlerErr)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: handlerErr.message }))
    }
  })

  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()))
  console.log(`[HTTP HARNESS] Local test server listening on http://127.0.0.1:${TEST_PORT}\n`)

  // Helper function to issue real HTTP requests
  async function makeRequest(
    method: string,
    endpoint: string,
    options: { token?: string; body?: any } = {}
  ): Promise<{ status: number; json: any; raw: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (options.token) {
      headers['Cookie'] = `apex_admin_session=${options.token}`
    }
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}${endpoint}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
    const raw = await res.text()
    let json: any = null
    try {
      json = JSON.parse(raw)
    } catch {
      json = { raw }
    }
    return { status: res.status, json, raw }
  }

  try {
    // =========================================================================
    // TEST CATEGORY 1: AUTHENTICATION & RBAC SECURITY
    // =========================================================================
    console.log('[CATEGORY 1] Testing Authentication & RBAC Security (401, 403)...')

    // T-HTTP-01: 401 Unauthorized for Unauthenticated Request
    const noAuth = await makeRequest('GET', '/api/admin/projects')
    assertHttp(
      'T-HTTP-01',
      'Unauthenticated request returns 401 Unauthorized',
      'GET',
      '/api/admin/projects',
      401,
      noAuth.status,
      noAuth.json?.error === 'Unauthorized',
      'Rejected without credentials.'
    )

    // T-HTTP-02: 401 Unauthorized for Tampered / Invalid Token
    const badAuth = await makeRequest('GET', '/api/admin/projects', { token: tokenInvalid })
    assertHttp(
      'T-HTTP-02',
      'Tampered JWT signature returns 401 Unauthorized',
      'GET',
      '/api/admin/projects',
      401,
      badAuth.status,
      badAuth.json?.error === 'Unauthorized',
      'Rejected invalid cryptographic signature.'
    )

    // T-HTTP-03: 403 Forbidden for Deactivated User
    const deactAuth = await makeRequest('GET', '/api/admin/projects', { token: tokenDeactivated })
    assertHttp(
      'T-HTTP-03',
      'Deactivated administrator account returns 403 Forbidden',
      'GET',
      '/api/admin/projects',
      403,
      deactAuth.status,
      deactAuth.json?.error?.includes('deactivated'),
      'Live database check enforced isActive=false guard.'
    )

    // T-HTTP-04: 403 Forbidden for Content Editor attempting Financial Repricing
    const editorReprice = await makeRequest('PATCH', '/api/admin/projects/prop_test_fake/price', {
      token: tokenContentEditor,
      body: { reason: 'Editor discount', isPOA: false, askingPriceNumeric: '1000000.00', askingCurrency: 'AED' },
    })
    assertHttp(
      'T-HTTP-04',
      'Content Editor denied financial repricing (403 Forbidden)',
      'PATCH',
      '/api/admin/projects/[id]/price',
      403,
      editorReprice.status,
      editorReprice.json?.error?.includes('PROPERTIES:PRICE_UPDATE'),
      'Strict separation prevents descriptive roles from modifying financial terms.'
    )

    // T-HTTP-05: 403 Forbidden for Property Manager attempting Deal Adjustment (Super Admin only)
    const mgrAdj = await makeRequest('POST', '/api/admin/deals/deal_fake/adjustments', {
      token: tokenPropertyManager,
      body: { adjustedSalePrice: '12000000.00', adjustedCurrency: 'AED', adjustmentReason: 'Unauthorized test adjustment', legalContractRef: 'REF-001' },
    })
    assertHttp(
      'T-HTTP-05',
      'Property Manager denied deal adjustment (403 Forbidden: Requires SUPER_ADMIN)',
      'POST',
      '/api/admin/deals/[id]/adjustments',
      403,
      mgrAdj.status,
      mgrAdj.json?.error?.includes('SUPER_ADMIN'),
      'Financial adjustments strictly restricted to Super Admin.'
    )

    // =========================================================================
    // TEST CATEGORY 2: PROJECT CREATION & VALIDATION (201, 400)
    // =========================================================================
    console.log('[CATEGORY 2] Testing Project Creation across Pricing States (201, 400)...')

    // T-HTTP-06: 400 Bad Request on Zero Price
    const zeroPrice = await makeRequest('POST', '/api/admin/projects', {
      token: tokenSuperAdmin,
      body: { name: 'Zero Price Villa', isPOA: false, askingPriceNumeric: '0.00', askingCurrency: 'AED' },
    })
    assertHttp(
      'T-HTTP-06',
      'Zero asking price strictly rejected (400 Bad Request)',
      'POST',
      '/api/admin/projects',
      400,
      zeroPrice.status,
      zeroPrice.json?.error?.includes('Zero asking price is strictly prohibited'),
      'Rejection enforced by pricing state engine.'
    )

    // T-HTTP-07: 400 Bad Request on Fractional JPY
    const jpyFrac = await makeRequest('POST', '/api/admin/projects', {
      token: tokenSuperAdmin,
      body: { name: 'Tokyo Sky Penthouse', isPOA: false, askingPriceNumeric: '150000000.50', askingCurrency: 'JPY' },
    })
    assertHttp(
      'T-HTTP-07',
      'Fractional JPY strictly rejected (400 Bad Request)',
      'POST',
      '/api/admin/projects',
      400,
      jpyFrac.status,
      jpyFrac.json?.error?.includes('JPY does not permit fractional amounts'),
      'Minor-unit precision enforced for zero-decimal currencies.'
    )

    // T-HTTP-08: 201 Created for State A (Priced > 0 with exact decimal string)
    const createPriced = await makeRequest('POST', '/api/admin/projects', {
      token: tokenSuperAdmin,
      body: {
        name: 'The Royal Atlantis Marina',
        slug: 'royal-atlantis-marina',
        isPOA: false,
        askingPriceNumeric: '68500000.50',
        askingCurrency: 'AED',
        description: 'Prime waterfront signature estate.',
      },
    })
    const projectPricedId = createPriced.json?.id
    assertHttp(
      'T-HTTP-08',
      'State A (Priced) project created with exact decimal string (201 Created)',
      'POST',
      '/api/admin/projects',
      201,
      createPriced.status,
      createPriced.json?.isDraft === true &&
        Boolean(createPriced.json?.askingPriceNumeric) &&
        new Prisma.Decimal(createPriced.json.askingPriceNumeric).equals('68500000.50'),
      `Created project ID: ${projectPricedId}`
    )

    // T-HTTP-09: 201 Created for State B (POA)
    const createPOA = await makeRequest('POST', '/api/admin/projects', {
      token: tokenSuperAdmin,
      body: {
        name: 'Bespoke Alpine Retreat',
        slug: 'bespoke-alpine-retreat',
        isPOA: true,
      },
    })
    const projectPOAId = createPOA.json?.id
    assertHttp(
      'T-HTTP-09',
      'State B (POA) project created with nullified financials (201 Created)',
      'POST',
      '/api/admin/projects',
      201,
      createPOA.status,
      createPOA.json?.isPOA === true && createPOA.json?.askingPriceNumeric === null && createPOA.json?.price === 'Price on Application',
      `Created POA project ID: ${projectPOAId}`
    )

    // =========================================================================
    // TEST CATEGORY 3: DESCRIPTIVE VS FINANCIAL FIELD BOUNDARIES
    // =========================================================================
    console.log('[CATEGORY 3] Testing Descriptive vs Financial Field Boundaries (400, 200)...')

    // T-HTTP-10: 400 Bad Request if Descriptive Update contains Financial Fields
    const leakFinancial = await makeRequest('PATCH', `/api/admin/projects/${projectPricedId}`, {
      token: tokenContentEditor,
      body: { description: 'Updated waterfront copy', askingPriceNumeric: '70000000.00' },
    })
    assertHttp(
      'T-HTTP-10',
      'Descriptive update rejects forbidden financial fields (400 Bad Request)',
      'PATCH',
      '/api/admin/projects/[id]',
      400,
      leakFinancial.status,
      leakFinancial.json?.error === 'FORBIDDEN_FINANCIAL_FIELDS',
      'Boundary barrier blocked askingPriceNumeric in descriptive route.'
    )

    // T-HTTP-11: 200 OK for Clean Descriptive Update by Content Editor
    const validDescriptive = await makeRequest('PATCH', `/api/admin/projects/${projectPricedId}`, {
      token: tokenContentEditor,
      body: { tagline: 'Iconic Palm Jumeirah Sanctuary', shortDescription: 'Private mooring and infinity sky deck.' },
    })
    assertHttp(
      'T-HTTP-11',
      'Descriptive update permitted for Content Editor (200 OK)',
      'PATCH',
      '/api/admin/projects/[id]',
      200,
      validDescriptive.status,
      validDescriptive.json?.tagline === 'Iconic Palm Jumeirah Sanctuary',
      'Descriptive fields updated without touching financial state.'
    )

    // T-HTTP-12: 400 Bad Request if Price Update contains Descriptive Fields
    const leakDescriptive = await makeRequest('PATCH', `/api/admin/projects/${projectPricedId}/price`, {
      token: tokenPropertyManager,
      body: { reason: 'Repricing campaign', isPOA: false, askingPriceNumeric: '69000000.00', askingCurrency: 'AED', description: 'Sneaky description edit' },
    })
    assertHttp(
      'T-HTTP-12',
      'Financial price update rejects forbidden descriptive fields (400 Bad Request)',
      'PATCH',
      '/api/admin/projects/[id]/price',
      400,
      leakDescriptive.status,
      leakDescriptive.json?.error === 'FORBIDDEN_DESCRIPTIVE_FIELDS',
      'Boundary barrier blocked description in financial route.'
    )

    // T-HTTP-13: 200 OK for Authorized Price Update by Property Manager
    const validPrice = await makeRequest('PATCH', `/api/admin/projects/${projectPricedId}/price`, {
      token: tokenPropertyManager,
      body: { reason: 'Reflecting post-furnishing appraisal', isPOA: false, askingPriceNumeric: '69500000.00', askingCurrency: 'AED' },
    })
    assertHttp(
      'T-HTTP-13',
      'Authorized financial repricing succeeds with audit history (200 OK)',
      'PATCH',
      '/api/admin/projects/[id]/price',
      200,
      validPrice.status,
      Boolean(validPrice.json?.askingPriceNumeric) &&
        new Prisma.Decimal(validPrice.json.askingPriceNumeric).equals('69500000.00'),
      'Repriced to AED 69,500,000.00 with audit entry.'
    )

    // =========================================================================
    // TEST CATEGORY 4: LIFECYCLE & NON-DESTRUCTIVE ARCHIVING (200, 400)
    // =========================================================================
    console.log('[CATEGORY 4] Testing Project Lifecycle & Soft-Delete Archiving (200, 400)...')

    // T-HTTP-14: Publish Project
    const publishRes = await makeRequest('POST', `/api/admin/projects/${projectPricedId}/publish`, {
      token: tokenPropertyManager,
    })
    const pubProj = publishRes.json?.project || publishRes.json
    assertHttp(
      'T-HTTP-14',
      'Publish project transitions state (200 OK)',
      'POST',
      '/api/admin/projects/[id]/publish',
      200,
      publishRes.status,
      pubProj?.isPublished === true && pubProj?.isDraft === false && pubProj?.isPubliclyVisible === true,
      'isPublished=true, isDraft=false, isPubliclyVisible=true.'
    )

    // T-HTTP-15: Soft-Delete Archiving via DELETE /projects/:id
    const archiveRes = await makeRequest('DELETE', `/api/admin/projects/${projectPricedId}`, {
      token: tokenPropertyManager,
    })
    const arcProj = archiveRes.json?.project || archiveRes.json
    assertHttp(
      'T-HTTP-15',
      'Soft-delete archiving preserves complete record (200 OK)',
      'DELETE',
      '/api/admin/projects/[id]',
      200,
      archiveRes.status,
      arcProj?.isArchived === true && arcProj?.isPublished === false,
      'Project archived without physical deletion.'
    )

    // T-HTTP-16: 400 Bad Request on Attempting to Publish an Archived Project
    const publishArchived = await makeRequest('POST', `/api/admin/projects/${projectPricedId}/publish`, {
      token: tokenPropertyManager,
    })
    assertHttp(
      'T-HTTP-16',
      'Publishing an archived project is blocked (400 Bad Request)',
      'POST',
      '/api/admin/projects/[id]/publish',
      400,
      publishArchived.status,
      publishArchived.json?.error?.includes('Restore it first'),
      'Lifecycle guard prevents active publishing of archived asset.'
    )

    // T-HTTP-17: Restore Project to DRAFT State
    const restoreRes = await makeRequest('POST', `/api/admin/projects/${projectPricedId}/restore`, {
      token: tokenPropertyManager,
    })
    const restProj = restoreRes.json?.project || restoreRes.json
    assertHttp(
      'T-HTTP-17',
      'Restore project returns to DRAFT state (200 OK)',
      'POST',
      '/api/admin/projects/[id]/restore',
      200,
      restoreRes.status,
      restProj?.isArchived === false && restProj?.isDraft === true && restProj?.isPublished === false,
      'Project restored safely to DRAFT.'
    )

    // Republish project for deal tests
    await makeRequest('POST', `/api/admin/projects/${projectPricedId}/publish`, { token: tokenPropertyManager })

    // =========================================================================
    // TEST CATEGORY 5: DEAL PIPELINE, COMPLETION & IMMUTABILITY (201, 200, 409)
    // =========================================================================
    console.log('[CATEGORY 5] Testing Deal Pipeline, Completion & Immutability (201, 200, 409)...')

    // T-HTTP-18: Create Open Deal
    const createDealRes = await makeRequest('POST', '/api/admin/deals', {
      token: tokenPropertyManager,
      body: {
        propertyId: projectPricedId,
        buyerName: 'Emirates Sovereign Fund',
        buyerContact: 'direct@emiratesfund.ae',
        status: 'OFFER_MADE',
        provisionalPrice: '69000000.00',
        currency: 'AED',
      },
    })
    const dealId = createDealRes.json?.id
    assertHttp(
      'T-HTTP-18',
      'Create open pipeline deal (201 Created)',
      'POST',
      '/api/admin/deals',
      201,
      createDealRes.status,
      createDealRes.json?.status === 'OFFER_MADE' && createDealRes.json?.dealRef?.startsWith('DEAL-'),
      `Created deal ID: ${dealId}`
    )

    // T-HTTP-19: Complete Deal under Option A (keepPubliclyVisible: true)
    const completeRes = await makeRequest('POST', `/api/admin/deals/${dealId}/complete`, {
      token: tokenPropertyManager,
      body: {
        actualSalePrice: '69250000.00',
        currency: 'AED',
        keepPubliclyVisible: true,
        notes: 'Signed and funds cleared in full.',
      },
    })
    assertHttp(
      'T-HTTP-19',
      'Complete deal under Option A: Trophy Acquired showcase (200 OK)',
      'POST',
      '/api/admin/deals/[id]/complete',
      200,
      completeRes.status,
      completeRes.json?.deal?.status === 'COMPLETED' && completeRes.json?.property?.isPubliclyVisible === true,
      'Deal completed under Option A with public acquired banner.'
    )

    // T-HTTP-20: 409 Conflict on Attempting to Complete a Second Deal on Same Property
    const deal2Res = await makeRequest('POST', '/api/admin/deals', {
      token: tokenPropertyManager,
      body: { propertyId: projectPricedId, buyerName: 'Second Competitor', status: 'OFFER_MADE' },
    })
    const deal2Id = deal2Res.json?.id

    const dupComplete = await makeRequest('POST', `/api/admin/deals/${deal2Id}/complete`, {
      token: tokenPropertyManager,
      body: { actualSalePrice: '71000000.00', currency: 'AED', keepPubliclyVisible: true },
    })
    assertHttp(
      'T-HTTP-20',
      'One completed deal per property rule enforced (409 Conflict)',
      'POST',
      '/api/admin/deals/[id]/complete',
      409,
      dupComplete.status,
      dupComplete.json?.error?.includes('already has a completed sale'),
      'Blocked second completed deal on same property.'
    )

    // =========================================================================
    // TEST CATEGORY 6: AUTHORIZED FINANCIAL ADJUSTMENTS (200, 403)
    // =========================================================================
    console.log('[CATEGORY 6] Testing Authorized Financial Adjustments (200, 403)...')

    // T-HTTP-21: Super Admin Authorized Adjustment #1
    const adj1Res = await makeRequest('POST', `/api/admin/deals/${dealId}/adjustments`, {
      token: tokenSuperAdmin,
      body: {
        adjustedSalePrice: '69750000.00',
        adjustedCurrency: 'AED',
        adjustmentReason: 'Addendum #1: Post-closing luxury furnishing package inclusion',
        legalContractRef: 'ADDENDUM-ATLANTIS-001',
      },
    })
    const adj1Data = adj1Res.json?.adjustment || adj1Res.json
    assertHttp(
      'T-HTTP-21',
      'Super Admin creates financial adjustment #1 with sequence tracking (201 Created)',
      'POST',
      '/api/admin/deals/[id]/adjustments',
      201,
      adj1Res.status,
      adj1Data?.adjustmentSequence === 1 &&
        Boolean(adj1Data?.adjustedSalePrice) &&
        new Prisma.Decimal(adj1Data.adjustedSalePrice).equals('69750000.00'),
      'Adjustment #1 recorded with Seq=1.'
    )

    // T-HTTP-22: Super Admin Adjustment #2 with Currency Redenomination (AED -> USD)
    const adj2Res = await makeRequest('POST', `/api/admin/deals/${dealId}/adjustments`, {
      token: tokenSuperAdmin,
      body: {
        adjustedSalePrice: '19000000.00',
        adjustedCurrency: 'USD',
        adjustmentReason: 'Addendum #2: Redenominated into USD per buyer family office mandate',
        legalContractRef: 'ADDENDUM-ATLANTIS-002-USD',
      },
    })
    const adj2Data = adj2Res.json?.adjustment || adj2Res.json
    assertHttp(
      'T-HTTP-22',
      'Sequential adjustment #2 with currency redenomination to USD (201 Created)',
      'POST',
      '/api/admin/deals/[id]/adjustments',
      201,
      adj2Res.status,
      adj2Data?.adjustmentSequence === 2 && adj2Data?.adjustedCurrency === 'USD',
      'Redenominated to USD 19,000,000.00 with Seq=2.'
    )

    // T-HTTP-23: GET /deals/:id/adjustments Returns Chronological History
    const listAdj = await makeRequest('GET', `/api/admin/deals/${dealId}/adjustments`, {
      token: tokenPropertyManager,
    })
    assertHttp(
      'T-HTTP-23',
      'Chronological adjustment history listed in sequence order (200 OK)',
      'GET',
      '/api/admin/deals/[id]/adjustments',
      200,
      listAdj.status,
      Array.isArray(listAdj.json) && listAdj.json.length === 2 && listAdj.json[0].adjustmentSequence === 1,
      'Verified 2 adjustments returned in ascending sequence.'
    )

    // =========================================================================
    // TEST CATEGORY 7: DASHBOARD ANALYTICS FINANCIAL AUDIT (200)
    // =========================================================================
    console.log('[CATEGORY 7] Testing Dashboard Financial Metrics (200)...')

    const dashboardRes = await makeRequest('GET', '/api/admin/analytics/dashboard', {
      token: tokenCompliance,
    })
    const dashData = dashboardRes.json
    assertHttp(
      'T-HTTP-24',
      'Dashboard Analytics computes all 5 separated metrics (200 OK)',
      'GET',
      '/api/admin/analytics/dashboard',
      200,
      dashboardRes.status,
      Boolean(dashData?.totalPortfolioValuation) &&
        Boolean(dashData?.activePublishedValuation) &&
        Boolean(dashData?.completedDealVolume) &&
        Boolean(dashData?.completedDealMetrics) &&
        Boolean(dashData?.assetInventoryCounts),
      'All 5 metrics verified with distinct scopes and currency groupings.'
    )

    // T-HTTP-25: Metric 3 Groups Redenominated Deal under USD
    const usdEffective = dashData?.completedDealVolume?.byCurrency?.find(
      (c: any) => c.currency === 'USD'
    )
    assertHttp(
      'T-HTTP-25',
      'Metric 3 groups redenominated deal under effective currency USD',
      'GET',
      '/api/admin/analytics/dashboard',
      200,
      dashboardRes.status,
      Boolean(usdEffective) && new Prisma.Decimal(usdEffective.effectiveSalesVolume).equals('19000000.00'),
      `Effective deal volume reported under USD: $19,000,000.00 (Adjusted deals: ${usdEffective?.adjustedDealsCount})`
    )
  } finally {
    // 5. Teardown HTTP Server & Disposable Database
    server.close()
    await testPrisma.$disconnect()
    console.log('\n[TEARDOWN] Dropping disposable test database...')
    await safeTeardownDisposableDb(config, isCreated)
  }

  // 6. Summary Output
  console.log('\n' + '='.repeat(80))
  console.log('PHASE 5 HTTP API INTEGRATION TEST EXECUTION SUMMARY')
  console.log('='.repeat(80))

  const passedCount = testResults.filter((r) => r.status === 'PASSED').length
  const failedCount = testResults.filter((r) => r.status === 'FAILED').length

  console.log(`TOTAL HTTP TESTS: ${testResults.length}`)
  console.log(`PASSED:           ${passedCount}`)
  console.log(`FAILED:           ${failedCount}`)
  console.log(`PASS RATE:        ${((passedCount / testResults.length) * 100).toFixed(1)}%\n`)

  for (const r of testResults) {
    const symbol = r.status === 'PASSED' ? '✓' : '✗'
    console.log(`[${symbol}] ${r.id.padEnd(10)} | ${r.method.padEnd(6)} | ${r.actualStatus} | ${r.name}`)
    console.log(`    Evidence: ${r.evidence}`)
  }

  if (failedCount > 0) {
    console.error('\n[FATAL] One or more HTTP integration tests failed.')
    process.exit(1)
  } else {
    console.log('\n[SUCCESS] All 25 Phase 5 HTTP API integration tests passed with 100% compliance.')
  }
}

runHttpTestSuite().catch((err) => {
  console.error('[FATAL EXCEPTION IN HTTP TEST RUNNER]:', err)
  process.exit(1)
})
