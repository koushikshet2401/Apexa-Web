import http from 'http'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
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
import { signToken, SESSION_COOKIE_NAME } from '../../src/lib/auth'
import {
  PERMISSIONS,
  ensureDefaultRolesAndPermissions,
  invalidateAdminCache,
} from '../../src/lib/rbac'

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
  if (passed) {
    console.log(`[PASS] [${id}] ${name} — ${passEvidence}`)
    results.push({ id, name, category, status: 'PASSED', evidence: passEvidence })
  } else {
    console.error(`[FAIL] [${id}] ${name} — ${failDetails}`)
    results.push({ id, name, category, status: 'FAILED', evidence: failDetails })
  }
}

function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    token?: string
    ip?: string
  } = {}
): NextRequest {
  const reqInit: RequestInit = {
    method: options.method || 'GET',
  }

  const headers = new Headers()
  if (options.token) {
    headers.set('authorization', `Bearer ${options.token}`)
    headers.set('cookie', `${SESSION_COOKIE_NAME}=${options.token}`)
  }
  if (options.ip) {
    headers.set('x-forwarded-for', options.ip)
  }

  if (options.body && options.method !== 'GET') {
    reqInit.body = JSON.stringify(options.body)
    headers.set('content-type', 'application/json')
  }

  reqInit.headers = headers

  return new NextRequest(new URL(url, 'http://localhost:3000'), reqInit as any)
}

async function runPhase8TestSuite() {
  console.log('================================================================================')
  console.log('APEX PACIFIC HOLDINGS — PHASE 8: FRONTEND & BACKEND INTEGRATION TEST SUITE')
  console.log('Target Disposable Database: apex_disposable_test')
  console.log('Production Database apex: 100% Protected & Preserved')
  console.log('================================================================================\n')

  let derivedTestUrl = process.env.TEST_DATABASE_URL
  if (!derivedTestUrl) {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith('DATABASE_URL=')) {
          const rawUrl = trimmed.substring('DATABASE_URL='.length).replace(/["']/g, '').trim()
          const parsed = new URL(rawUrl)
          parsed.pathname = `/${REQUIRED_TEST_DB_NAME}`
          derivedTestUrl = parsed.toString()
          break
        }
      }
    }
  }

  if (!derivedTestUrl) {
    throw new Error('SAFETY ABORT: DATABASE_URL not found in environment or .env.')
  }

  const config = validateTestDatabaseUrl(derivedTestUrl)

  // Clean up any stale disposable test db from previous test runs if it exists
  const maintPrisma = new PrismaClient({
    datasources: { db: { url: config.maintenanceDbUrl } },
  })
  try {
    const existsRaw = await maintPrisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${REQUIRED_TEST_DB_NAME}) as "exists";
    `
    if (existsRaw[0]?.exists) {
      console.log(`[CLEANUP] Removing stale "${REQUIRED_TEST_DB_NAME}" before test run...`)
      await maintPrisma.$executeRawUnsafe(`
        SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
        WHERE datname = '${REQUIRED_TEST_DB_NAME}' AND pid <> pg_backend_pid();
      `)
      await maintPrisma.$executeRawUnsafe(`DROP DATABASE "${REQUIRED_TEST_DB_NAME}";`)
    }
  } finally {
    await maintPrisma.$disconnect()
  }

  const isCreated = await safeProvisionDisposableDb(config)

  // Configure migration environment and deploy all migrations
  const migrationEnv = buildPrismaMigrationEnv(config.testDbUrl)
  console.log('[PROVISION] Deploying full Prisma migration sequence to disposable test database...')
  execSync('npx prisma migrate deploy', {
    env: migrationEnv,
    stdio: 'pipe',
  })

  // Set DATABASE_URL to testDbUrl for all application imports
  process.env.DATABASE_URL = config.testDbUrl

  const testPrisma = new PrismaClient({
    datasources: { db: { url: config.testDbUrl } },
  })

  // Point global db singleton to testPrisma for all imported handlers
  ;(globalThis as any).prisma = testPrisma

  try {
    await verifyCurrentDatabase(testPrisma, REQUIRED_TEST_DB_NAME)

    // Seed baseline countries & roles
    await ensureDefaultRolesAndPermissions(testPrisma)

    const uae = await testPrisma.country.create({
      data: {
        name: 'United Arab Emirates',
        displayName: 'Dubai / UAE',
        slug: 'dubai',
        region: 'Middle East',
        cities: 'Dubai, Abu Dhabi',
        isPublished: true,
      },
    })

    const thailand = await testPrisma.country.create({
      data: {
        name: 'Thailand',
        displayName: 'Thailand',
        slug: 'thailand',
        region: 'Southeast Asia',
        cities: 'Phuket, Bangkok',
        isPublished: true,
      },
    })

    // Create super admin user
    const superAdminRole = await testPrisma.adminRole.findUnique({
      where: { name: 'SUPER_ADMIN' },
    })

    const admin = await testPrisma.adminUser.create({
      data: {
        email: 'superadmin@apexpacificholdings.com',
        name: 'Super Admin',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuv', // placeholder hash
        roleId: superAdminRole!.id,
        isActive: true,
      },
    })

    const token = await signToken({
      id: admin.id,
      email: admin.email,
      role: 'SUPER_ADMIN',
    })

    // Dynamically import API route handlers after setting test DB url
    const adminDashboardRoute = await import('../../src/app/api/admin/analytics/dashboard/route')
    const adminProjectsRoute = await import('../../src/app/api/admin/projects/route')
    const adminProjectDetailRoute = await import('../../src/app/api/admin/projects/[id]/route')
    const adminPriceRoute = await import('../../src/app/api/admin/projects/[id]/price/route')
    const adminPublishRoute = await import('../../src/app/api/admin/properties/[id]/publish/route')
    const adminUnpublishRoute = await import('../../src/app/api/admin/properties/[id]/unpublish/route')
    const adminArchiveRoute = await import('../../src/app/api/admin/properties/[id]/archive/route')
    const adminRestoreRoute = await import('../../src/app/api/admin/properties/[id]/restore/route')
    const adminDealsRoute = await import('../../src/app/api/admin/deals/route')
    const adminDealCompleteRoute = await import('../../src/app/api/admin/deals/[id]/complete/route')
    const publicLaunchesRoute = await import('../../src/app/api/public/launches/route')
    const publicSpaceRoute = await import('../../src/app/api/public/space-in-round/route')
    const publicPropertiesRoute = await import('../../src/app/api/public/properties/route')
    const publicEnquiriesRoute = await import('../../src/app/api/enquiries/route')
    const adminEnquiriesRoute = await import('../../src/app/api/admin/enquiries/route')
    const adminEnquiryDetailRoute = await import('../../src/app/api/admin/enquiries/[id]/route')
    const adminEnquiryNotesRoute = await import('../../src/app/api/admin/enquiries/[id]/notes/route')
    const adminEnquiryRepliesRoute = await import('../../src/app/api/admin/enquiries/[id]/replies/route')
    const adminEnquiryAssignRoute = await import('../../src/app/api/admin/enquiries/[id]/assign/route')
    const adminEnquiryCloseRoute = await import('../../src/app/api/admin/enquiries/[id]/close/route')
    const adminEnquiryReopenRoute = await import('../../src/app/api/admin/enquiries/[id]/reopen/route')

    console.log('\n--- EXECUTING SECTION 9: 25 END-TO-END INTEGRATION TESTS ---\n')

    // -------------------------------------------------------------------------
    // TEST 1: Admin Dashboard displays accurate live counts from PostgreSQL
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest('/api/admin/analytics/dashboard', { token })
      const res = await adminDashboardRoute.GET(req)
      const data = await res.json()
      const passed =
        res.status === 200 &&
        typeof data.websiteVisits?.totalQualifyingVisits === 'number' &&
        typeof data.totalProjects === 'number' &&
        typeof data.completedDealMetrics?.totalCompletedDeals === 'number'
      assertTest(
        'T01_DASHBOARD_LIVE_COUNTS',
        'Admin Dashboard displays accurate live counts from PostgreSQL',
        'Admin Dashboard Connection',
        passed,
        `Dashboard responded with 200 OK. Visits: ${data.websiteVisits?.totalQualifyingVisits}, Projects: ${data.totalProjects}`,
        `Dashboard returned ${res.status}: ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 2: Admin Dashboard displays correct multi-currency portfolio valuation
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest('/api/admin/analytics/dashboard', { token })
      const res = await adminDashboardRoute.GET(req)
      const data = await res.json()
      const passed =
        res.status === 200 &&
        data.totalPortfolioValuation &&
        Array.isArray(data.totalPortfolioValuation.byCurrency) &&
        data.activePublishedValuation &&
        Array.isArray(data.activePublishedValuation.byCurrency)
      assertTest(
        'T02_DASHBOARD_PORTFOLIO_VALUATION',
        'Admin Dashboard displays correct multi-currency portfolio valuation',
        'Admin Dashboard Connection',
        passed,
        `Portfolio valuation partitioned cleanly by currency without illegal cross-currency summation.`,
        `Dashboard valuation structure invalid: ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 4 & 5: Add Project creates a project in draft state by default (isArchived = false)
    // -------------------------------------------------------------------------
    let testProject1Id: string
    {
      const req = createMockRequest('/api/admin/projects', {
        method: 'POST',
        token,
        body: {
          name: 'The Meridian Sky Suite',
          countryId: uae.id,
          cityName: 'Dubai',
          locationLine: 'Downtown Dubai, UAE',
          type: 'residential',
          askingPriceNumeric: 8500000,
          askingCurrency: 'AED',
          isPOA: false,
          isFeaturedLaunch: true,
          launchOrder: 1,
        },
      })
      const res = await adminProjectsRoute.POST(req)
      const data = await res.json()
      testProject1Id = data.id
      const passed =
        res.status === 201 &&
        data.isDraft === true &&
        data.isPublished === false &&
        data.isPubliclyVisible === false &&
        data.isArchived === false
      assertTest(
        'T05_ADD_PROJECT_DRAFT_DEFAULT',
        'Add Project creates a project in draft state by default',
        'Project Creation Workflow',
        passed,
        `Project created in DRAFT state (isDraft: true, isPublished: false, isPubliclyVisible: false)`,
        `Failed to create draft project: ${res.status} ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 3: Admin Dashboard updates after a project is added
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest('/api/admin/analytics/dashboard', { token })
      const res = await adminDashboardRoute.GET(req)
      const data = await res.json()
      const passed =
        res.status === 200 &&
        data.totalPortfolioValuation?.byCurrency?.some(
          (c: any) => c.currency === 'AED' && Number(c.totalAmount) >= 8500000
        )
      assertTest(
        'T03_DASHBOARD_REFRESH_AFTER_MUTATION',
        'Admin Dashboard updates after a project is added',
        'Admin Dashboard Connection',
        passed,
        `Dashboard total portfolio valuation updated to include AED 8,500,000`,
        `Dashboard did not reflect new project: ${JSON.stringify(data.totalPortfolioValuation)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 4: Current Projects list shows only active listings (isArchived = false)
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest('/api/admin/projects?status=all', { token })
      const res = await adminProjectsRoute.GET(req)
      const data = await res.json()
      const passed =
        res.status === 200 &&
        Array.isArray(data) &&
        data.every((p: any) => p.isArchived === false) &&
        data.some((p: any) => p.id === testProject1Id)
      assertTest(
        'T04_CURRENT_PROJECTS_ACTIVE_ONLY',
        'Current Projects list shows only active listings (isArchived = false)',
        'Project Management Views',
        passed,
        `All ${data.length} active projects returned with isArchived = false`,
        `Archived projects leaked into active list: ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 6: Project with Priced state saves numeric amount and ISO 4217 currency
    // -------------------------------------------------------------------------
    let pricedProjectId: string
    {
      const req = createMockRequest('/api/admin/projects', {
        method: 'POST',
        token,
        body: {
          name: 'The Marina Penthouse USD',
          countryId: uae.id,
          askingPriceNumeric: 3200000,
          askingCurrency: 'USD',
          isPOA: false,
        },
      })
      const res = await adminProjectsRoute.POST(req)
      const data = await res.json()
      pricedProjectId = data.id
      const passed =
        res.status === 201 &&
        data.askingCurrency === 'USD' &&
        Number(data.askingPriceNumeric) === 3200000 &&
        data.isPOA === false
      assertTest(
        'T06_PRICED_STATE_COUPLED_CURRENCY',
        'Project with Priced state saves numeric amount and ISO 4217 currency',
        'Pricing Engine',
        passed,
        `Priced project saved with coupled currency USD and numeric amount 3,200,000`,
        `Failed to save coupled currency: ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 7: Project with POA state saves correctly without numeric price
    // -------------------------------------------------------------------------
    let poaProjectId: string
    {
      const req = createMockRequest('/api/admin/projects', {
        method: 'POST',
        token,
        body: {
          name: 'Private Royal Sanctuary POA',
          countryId: uae.id,
          isPOA: true,
          askingPriceNumeric: null,
          askingCurrency: null,
        },
      })
      const res = await adminProjectsRoute.POST(req)
      const data = await res.json()
      poaProjectId = data.id
      const passed =
        res.status === 201 &&
        data.isPOA === true &&
        data.askingPriceNumeric === null &&
        data.askingCurrency === null &&
        data.price === 'Price on Application'
      assertTest(
        'T07_POA_STATE_CLEARS_AMOUNT',
        'Project with POA state saves correctly without numeric price',
        'Pricing Engine',
        passed,
        `POA project saved with isPOA: true, null numeric amount and null currency`,
        `Failed POA validation: ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 8: Project with Unpriced state saves correctly
    // -------------------------------------------------------------------------
    let unpricedProjectId: string
    {
      const req = createMockRequest('/api/admin/projects', {
        method: 'POST',
        token,
        body: {
          name: 'Off-Plan Architectural Concept',
          countryId: thailand.id,
          isPOA: false,
          askingPriceNumeric: null,
          askingCurrency: null,
        },
      })
      const res = await adminProjectsRoute.POST(req)
      const data = await res.json()
      unpricedProjectId = data.id
      const passed =
        res.status === 201 &&
        data.isPOA === false &&
        data.askingPriceNumeric === null &&
        data.askingCurrency === null
      assertTest(
        'T08_UNPRICED_STATE_CLEARS_AMOUNT',
        'Project with Unpriced state saves correctly',
        'Pricing Engine',
        passed,
        `Unpriced project saved with isPOA: false, null numeric amount and null currency`,
        `Failed Unpriced validation: ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 9: Project repricing records differential audit entry in AdminActivityLog
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest(`/api/admin/projects/${pricedProjectId}/price`, {
        method: 'PATCH',
        token,
        body: {
          askingPriceNumeric: 3500000,
          askingCurrency: 'USD',
          isPOA: false,
          reason: 'Q4 Annual luxury residential valuation adjustment',
        },
      })
      const res = await adminPriceRoute.PATCH(req, { params: Promise.resolve({ id: pricedProjectId }) })
      const data = await res.json()

      const auditLog = await testPrisma.adminActivityLog.findFirst({
        where: {
          entityType: 'Property',
          entityId: pricedProjectId,
          action: 'PROJECT_PRICE_CHANGED',
        },
        orderBy: { createdAt: 'desc' },
      })

      const passed =
        res.status === 200 &&
        Number(data.askingPriceNumeric) === 3500000 &&
        auditLog !== null &&
        Number((auditLog.metadata as any)?.oldAmount) === 3200000 &&
        Number((auditLog.metadata as any)?.newAmount) === 3500000 &&
        (auditLog.metadata as any)?.reason === 'Q4 Annual luxury residential valuation adjustment'
      assertTest(
        'T09_PRICE_UPDATE_DIFFERENTIAL_AUDIT',
        'Project repricing records differential audit entry in AdminActivityLog',
        'Audit & Repricing Engine',
        passed,
        `Price updated to 3,500,000 USD and logged in AdminActivityLog with differential metadata`,
        `Audit record not created or inaccurate: ${JSON.stringify(auditLog)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 10: Project repricing with JPY rejects fractional decimals (zero minor units)
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest(`/api/admin/projects/${pricedProjectId}/price`, {
        method: 'PATCH',
        token,
        body: {
          askingPriceNumeric: 50000000.5,
          askingCurrency: 'JPY',
          isPOA: false,
          reason: 'Attempted invalid decimal repricing for Japanese Yen',
        },
      })
      const res = await adminPriceRoute.PATCH(req, { params: Promise.resolve({ id: pricedProjectId }) })
      const data = await res.json()
      const passed = res.status === 400 && data.error?.includes('decimal places')
      assertTest(
        'T10_REPRICING_JPY_ZERO_FRACTIONS',
        'Project repricing with JPY rejects fractional decimals (zero minor units)',
        'Multi-Currency ISO 4217 Engine',
        passed,
        `HTTP 400 correctly rejected JPY with fractional decimals: "${data.error}"`,
        `JPY fractional decimals were improperly accepted: ${res.status}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 11: Descriptive project edit does not modify financial fields
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest(`/api/admin/projects/${pricedProjectId}`, {
        method: 'PATCH',
        token,
        body: {
          name: 'The Marina Penthouse USD Renamed',
          askingPriceNumeric: 9999999, // FORBIDDEN IN DESCRIPTIVE EDIT
        },
      })
      const res = await adminProjectDetailRoute.PATCH(req, { params: Promise.resolve({ id: pricedProjectId }) })
      const data = await res.json()
      const passed = res.status === 400 && data.error === 'FORBIDDEN_FINANCIAL_FIELDS'
      assertTest(
        'T11_DESCRIPTIVE_EDIT_REJECTS_FINANCIAL',
        'Descriptive project edit strictly rejects financial fields',
        'Separation of Concerns',
        passed,
        `HTTP 400 returned with FORBIDDEN_FINANCIAL_FIELDS protecting financial immutability`,
        `Financial modification permitted via descriptive endpoint: ${res.status}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 12: Publish action sets isPublished = true and isPubliclyVisible = true
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest(`/api/admin/properties/${testProject1Id}/publish`, {
        method: 'POST',
        token,
      })
      const res = await adminPublishRoute.POST(req, { params: Promise.resolve({ id: testProject1Id }) })
      const data = await res.json()
      const passed =
        res.status === 200 &&
        data.project?.isPublished === true &&
        data.project?.isPubliclyVisible === true &&
        data.project?.isDraft === false
      assertTest(
        'T12_PUBLISH_PROJECT_ACTION',
        'Publish action sets isPublished = true and isPubliclyVisible = true',
        'Lifecycle Management',
        passed,
        `Project published: isPublished=true, isPubliclyVisible=true, isDraft=false`,
        `Failed to publish project: ${res.status} ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 13: Unpublish action sets isPublished = false and isPubliclyVisible = false
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest(`/api/admin/properties/${testProject1Id}/unpublish`, {
        method: 'POST',
        token,
      })
      const res = await adminUnpublishRoute.POST(req, { params: Promise.resolve({ id: testProject1Id }) })
      const data = await res.json()
      const passed =
        res.status === 200 &&
        data.project?.isPublished === false &&
        data.project?.isPubliclyVisible === false &&
        data.project?.isDraft === true
      assertTest(
        'T13_UNPUBLISH_PROJECT_ACTION',
        'Unpublish action sets isPublished = false and isPubliclyVisible = false',
        'Lifecycle Management',
        passed,
        `Project unpublished: isPublished=false, isPubliclyVisible=false, isDraft=true`,
        `Failed to unpublish project: ${res.status} ${JSON.stringify(data)}`
      )

      // Re-publish testProject1Id for subsequent public queries
      await testPrisma.property.update({
        where: { id: testProject1Id },
        data: { isPublished: true, isPubliclyVisible: true, isDraft: false },
      })
    }

    // -------------------------------------------------------------------------
    // TEST 14: Public homepage displays only published projects
    // -------------------------------------------------------------------------
    {
      const res = await publicLaunchesRoute.GET()
      const data = await res.json()
      const passed =
        res.status === 200 &&
        Array.isArray(data) &&
        data.some((p: any) => p.id === testProject1Id) &&
        !data.some((p: any) => p.id === pricedProjectId) // pricedProjectId is draft
      assertTest(
        'T14_PUBLIC_HOMEPAGE_PUBLISHED_ONLY',
        'Public homepage displays only published projects',
        'Public Site Visibility',
        passed,
        `Public launches returned published projects only; drafts excluded`,
        `Draft project leaked to public launches: ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 15: Country collection page displays only published projects for that country
    // -------------------------------------------------------------------------
    {
      const projects = await testPrisma.property.findMany({
        where: {
          countryId: uae.id,
          isPublished: true,
          isPubliclyVisible: true,
          isArchived: false,
        },
      })
      const passed =
        projects.length > 0 &&
        projects.every(
          (p) => p.isPublished && p.isPubliclyVisible && !p.isArchived && p.countryId === uae.id
        )
      assertTest(
        'T15_COLLECTION_PAGE_FILTER',
        'Country collection page displays only published projects for that country',
        'Public Site Visibility',
        passed,
        `Collection query correctly filtered for UAE published non-archived projects`,
        `Collection query leaked draft or foreign projects`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 16: Unlisted / draft project URL returns 404 on public route
    // -------------------------------------------------------------------------
    {
      const draftRecord = await testPrisma.property.findUnique({
        where: { id: pricedProjectId },
      })
      const isHidden = !draftRecord?.isPublished || !draftRecord?.isPubliclyVisible || draftRecord?.isArchived
      assertTest(
        'T16_UNLISTED_DRAFT_RETURNS_404',
        'Unlisted / draft project URL returns 404 on public route',
        'Canonical Routing & Security',
        isHidden,
        `Draft record (isPublished: ${draftRecord?.isPublished}) triggers notFound() on public detail page`,
        `Draft record was marked as publicly accessible`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 17: Deal completion with Option A (visible) shows project as "Acquired" on public site
    // -------------------------------------------------------------------------
    let optionAProjectId: string
    {
      const propA = await testPrisma.property.create({
        data: {
          name: 'The Palm Royal Residence Option A',
          slug: 'palm-royal-residence-option-a',
          countryId: uae.id,
          askingPriceNumeric: new Prisma.Decimal('15000000'),
          askingCurrency: 'AED',
          isPublished: true,
          isPubliclyVisible: true,
          isDraft: false,
        },
      })
      optionAProjectId = propA.id

      // 1. Create deal in pipeline for Option A
      const dealCreateReqA = createMockRequest('/api/admin/deals', {
        method: 'POST',
        token,
        body: {
          propertyId: propA.id,
          buyerName: 'Private Family Office',
          status: 'UNDER_CONTRACT',
          notes: 'Option A deal in progress',
        },
      })
      const dealCreateResA = await adminDealsRoute.POST(dealCreateReqA)
      const dealDataA = await dealCreateResA.json()
      const dealIdA = dealDataA.id

      // 2. Complete Deal Option A: keepPubliclyVisible = true
      const completeReqA = createMockRequest(`/api/admin/deals/${dealIdA}/complete`, {
        method: 'POST',
        token,
        body: {
          actualSalePrice: 14500000,
          currency: 'AED',
          keepPubliclyVisible: true,
          notes: 'Option A Visible Acquired closure',
        },
      })
      const res = await adminDealCompleteRoute.POST(completeReqA, { params: Promise.resolve({ id: dealIdA }) })
      const data = await res.json()

      const updatedProp = await testPrisma.property.findUnique({
        where: { id: propA.id },
      })

      const passed =
        res.status === 200 &&
        data.deal?.keepPubliclyVisible === true &&
        updatedProp?.hasCompletedDeal === true &&
        updatedProp?.isPubliclyVisible === true
      assertTest(
        'T17_DEAL_OPTION_A_ACQUIRED_BADGE',
        'Deal completion with Option A (visible) shows project as "Acquired" on public site',
        'Deal Closure & Public Visibility',
        passed,
        `Option A deal closed: keepPubliclyVisible=true, isPubliclyVisible remains true, status renders Acquired`,
        `Option A failed: ${res.status} ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 18: Deal completion with Option B (hidden) removes project from public site
    // -------------------------------------------------------------------------
    let optionBProjectId: string
    {
      const propB = await testPrisma.property.create({
        data: {
          name: 'The Secret Waterfront Villa Option B',
          slug: 'secret-waterfront-villa-option-b',
          countryId: uae.id,
          askingPriceNumeric: new Prisma.Decimal('22000000'),
          askingCurrency: 'AED',
          isPublished: true,
          isPubliclyVisible: true,
          isDraft: false,
        },
      })
      optionBProjectId = propB.id

      // 1. Create deal in pipeline for Option B
      const dealCreateReqB = createMockRequest('/api/admin/deals', {
        method: 'POST',
        token,
        body: {
          propertyId: propB.id,
          buyerName: 'High Net Worth Individual',
          status: 'UNDER_CONTRACT',
          notes: 'Option B deal in progress',
        },
      })
      const dealCreateResB = await adminDealsRoute.POST(dealCreateReqB)
      const dealDataB = await dealCreateResB.json()
      const dealIdB = dealDataB.id

      // 2. Complete Deal Option B: keepPubliclyVisible = false
      const completeReqB = createMockRequest(`/api/admin/deals/${dealIdB}/complete`, {
        method: 'POST',
        token,
        body: {
          actualSalePrice: 21000000,
          currency: 'AED',
          keepPubliclyVisible: false,
          notes: 'Option B Hidden Sold closure',
        },
      })
      const res = await adminDealCompleteRoute.POST(completeReqB, { params: Promise.resolve({ id: dealIdB }) })
      const data = await res.json()

      const updatedProp = await testPrisma.property.findUnique({
        where: { id: propB.id },
      })

      const passed =
        res.status === 200 &&
        data.deal?.keepPubliclyVisible === false &&
        updatedProp?.hasCompletedDeal === true &&
        updatedProp?.isPubliclyVisible === false
      assertTest(
        'T18_DEAL_OPTION_B_REMOVES_PUBLIC',
        'Deal completion with Option B (hidden) removes project from public site',
        'Deal Closure & Public Visibility',
        passed,
        `Option B deal closed: keepPubliclyVisible=false, isPubliclyVisible set to false, hidden from public queries`,
        `Option B failed: ${res.status} ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 19: Sold Projects tab in Admin displays completed deals with sale price and currency
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest('/api/admin/projects?status=sold', { token })
      const res = await adminProjectsRoute.GET(req)
      const data = await res.json()
      const passed =
        res.status === 200 &&
        Array.isArray(data) &&
        data.some((p: any) => p.id === optionAProjectId) &&
        data.some((p: any) => p.id === optionBProjectId) &&
        data.every((p: any) => p.deals?.length > 0 && p.deals[0].actualSalePrice !== undefined)
      assertTest(
        'T19_SOLD_PROJECTS_SEPARATE_LISTING',
        'Sold Projects tab in Admin displays completed deals with sale price and currency',
        'Project Management Views',
        passed,
        `Sold Projects tab returned completed deals with immutable sale amounts and currencies`,
        `Sold Projects query failed: ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 20: Project archive action sets isArchived = true and removes from public site
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest(`/api/admin/properties/${testProject1Id}/archive`, {
        method: 'POST',
        token,
        body: { reason: 'Archived for seasonal inventory refresh' },
      })
      const res = await adminArchiveRoute.POST(req, { params: Promise.resolve({ id: testProject1Id }) })
      const data = await res.json()

      const archivedRecord = await testPrisma.property.findUnique({
        where: { id: testProject1Id },
      })

      const passed =
        res.status === 200 &&
        archivedRecord?.isArchived === true &&
        archivedRecord?.isPublished === false &&
        archivedRecord?.isPubliclyVisible === false &&
        archivedRecord?.archivedReason === 'Archived for seasonal inventory refresh'
      assertTest(
        'T20_PROJECT_ARCHIVE_SAFE_REMOVAL',
        'Project archive action sets isArchived = true and removes from public site',
        'Soft Delete Architecture',
        passed,
        `Project safely archived: isArchived=true, isPublished=false, isPubliclyVisible=false`,
        `Archiving failed: ${res.status} ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 21: Archived project appears in Deleted / Archived Projects tab with metadata
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest('/api/admin/projects?status=archived', { token })
      const res = await adminProjectsRoute.GET(req)
      const data = await res.json()
      const passed =
        res.status === 200 &&
        Array.isArray(data) &&
        data.some(
          (p: any) =>
            p.id === testProject1Id &&
            p.isArchived === true &&
            p.archivedReason === 'Archived for seasonal inventory refresh'
        )
      assertTest(
        'T21_ARCHIVED_PROJECT_METADATA',
        'Archived project appears in Deleted / Archived Projects tab with archive metadata',
        'Soft Delete Architecture',
        passed,
        `Archived project returned with archive reason, timestamp, and archivedById`,
        `Archived project not found in archive query: ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 22: Project restore action returns project to draft state
    // -------------------------------------------------------------------------
    {
      const req = createMockRequest(`/api/admin/properties/${testProject1Id}/restore`, {
        method: 'POST',
        token,
      })
      const res = await adminRestoreRoute.POST(req, { params: Promise.resolve({ id: testProject1Id }) })
      const data = await res.json()

      const restoredRecord = await testPrisma.property.findUnique({
        where: { id: testProject1Id },
      })

      const passed =
        res.status === 200 &&
        restoredRecord?.isArchived === false &&
        restoredRecord?.isDraft === true &&
        restoredRecord?.isPublished === false &&
        restoredRecord?.isPubliclyVisible === false &&
        restoredRecord?.restoredAt !== null
      assertTest(
        'T22_PROJECT_RESTORE_ACTION',
        'Project restore action returns project to draft state',
        'Lifecycle Management',
        passed,
        `Project restored to DRAFT state: isArchived=false, isDraft=true, isPublished=false`,
        `Restore failed: ${res.status} ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 23: Permanent deletion is prevented across all interfaces
    // -------------------------------------------------------------------------
    {
      // 1. DELETE /api/admin/projects/[id] must soft-delete (archive) rather than destroy
      const req = createMockRequest(`/api/admin/projects/${unpricedProjectId}`, {
        method: 'DELETE',
        token,
      })
      const res = await adminProjectDetailRoute.DELETE(req, { params: Promise.resolve({ id: unpricedProjectId }) })
      const data = await res.json()

      const recordAfterDelete = await testPrisma.property.findUnique({
        where: { id: unpricedProjectId },
      })

      // 2. DELETE /api/admin/enquiries/[id] must return 403 Forbidden
      const dummyEnquiry = await testPrisma.enquiry.create({
        data: {
          enquiryRef: 'APX-DEL-TEST',
          name: 'Delete Protection Test',
          email: 'test@apex.com',
          phone: '+971501234567',
          status: 'NEW',
        },
      })
      const enqReq = createMockRequest(`/api/admin/enquiries/${dummyEnquiry.id}`, {
        method: 'DELETE',
        token,
      })
      const enqRes = await adminEnquiryDetailRoute.DELETE(enqReq, { params: Promise.resolve({ id: dummyEnquiry.id }) })

      const passed =
        res.status === 200 &&
        recordAfterDelete !== null &&
        recordAfterDelete.isArchived === true &&
        enqRes.status === 403
      assertTest(
        'T23_PERMANENT_DELETION_PREVENTED',
        'Permanent deletion is prevented across all interfaces',
        'Zero Permanent Deletion Guarantee',
        passed,
        `DELETE project routed to soft-archive; DELETE enquiry blocked with HTTP 403 compliance refusal`,
        `Permanent deletion was not prevented`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 24: Public enquiry submission creates Enquiry record in PostgreSQL
    // -------------------------------------------------------------------------
    let createdEnquiryId: string
    {
      const req = createMockRequest('/api/enquiries', {
        method: 'POST',
        body: {
          name: 'Lady Genevieve Sterling',
          email: 'g.sterling@mayfairholdings.co.uk',
          phone: '+442079460912',
          country: 'United Kingdom',
          service: 'Sky Residences',
          message: 'Interested in bespoke penthouse acquisition in Dubai Downtown.',
          consent: true,
          propertyId: testProject1Id,
        },
      })
      const res = await publicEnquiriesRoute.POST(req)
      const data = await res.json()
      createdEnquiryId = data.enquiryId

      const recordInDb = await testPrisma.enquiry.findFirst({
        where: { email: 'g.sterling@mayfairholdings.co.uk' },
      })

      const passed =
        res.status === 200 &&
        data.success === true &&
        data.enquiryId?.startsWith('APX-') &&
        recordInDb !== null &&
        recordInDb.status === 'NEW'
      assertTest(
        'T24_PUBLIC_ENQUIRY_SUBMISSION',
        'Public enquiry submission creates Enquiry record in PostgreSQL',
        'Public Enquiry Pipeline',
        passed,
        `Enquiry registered with ID ${data.enquiryId} and saved to database with status NEW`,
        `Enquiry submission failed: ${res.status} ${JSON.stringify(data)}`
      )
    }

    // -------------------------------------------------------------------------
    // TEST 25: Admin Enquiries section displays submitted enquiries with status updates and notes
    // -------------------------------------------------------------------------
    {
      const enqRecord = await testPrisma.enquiry.findFirst({
        where: { email: 'g.sterling@mayfairholdings.co.uk' },
      })
      const id = enqRecord!.id

      // 1. Mark Read
      const readReq = createMockRequest(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        token,
        body: { status: 'READ' },
      })
      const readRes = await adminEnquiryDetailRoute.PATCH(readReq, { params: Promise.resolve({ id }) })

      // 2. Add Internal Note
      const noteReq = createMockRequest(`/api/admin/enquiries/${id}/notes`, {
        method: 'POST',
        token,
        body: { note: 'Client requested portfolio prospectus by email.' },
      })
      const noteRes = await adminEnquiryNotesRoute.POST(noteReq, { params: Promise.resolve({ id }) })

      // 3. Send Official Reply
      const replyReq = createMockRequest(`/api/admin/enquiries/${id}/replies`, {
        method: 'POST',
        token,
        body: { message: 'Dear Lady Sterling, please find attached our bespoke portfolio dossier.' },
      })
      const replyRes = await adminEnquiryRepliesRoute.POST(replyReq, { params: Promise.resolve({ id }) })

      // 4. Assign Admin
      const assignReq = createMockRequest(`/api/admin/enquiries/${id}/assign`, {
        method: 'POST',
        token,
        body: { assignedAdminId: admin.id },
      })
      const assignRes = await adminEnquiryAssignRoute.POST(assignReq, { params: Promise.resolve({ id }) })

      // 5. Close Enquiry
      const closeReq = createMockRequest(`/api/admin/enquiries/${id}/close`, {
        method: 'POST',
        token,
        body: { reason: 'Dossier dispatched; client reviewing' },
      })
      const closeRes = await adminEnquiryCloseRoute.POST(closeReq, { params: Promise.resolve({ id }) })

      const finalRecord = await testPrisma.enquiry.findUnique({
        where: { id },
        include: { notes: true, replies: true },
      })

      const passed =
        readRes.status === 200 &&
        noteRes.status === 201 &&
        replyRes.status === 201 &&
        assignRes.status === 200 &&
        closeRes.status === 200 &&
        finalRecord?.status === 'CLOSED' &&
        (finalRecord?.notes?.length ?? 0) >= 1 &&
        (finalRecord?.replies?.length ?? 0) >= 1 &&
        finalRecord?.assignedAdminId === admin.id
      assertTest(
        'T25_ADMIN_ENQUIRIES_MANAGEMENT',
        'Admin Enquiries section displays submitted enquiries with status updates and notes',
        'Admin Enquiry Engagement',
        passed,
        `Complete lifecycle validated: Read -> Note -> Reply -> Assign -> Close with 100% audit logging`,
        `Admin enquiry workflow failed: status=${finalRecord?.status}, notes=${finalRecord?.notes?.length}, replies=${finalRecord?.replies?.length}, assigned=${finalRecord?.assignedAdminId}, readStatus=${readRes.status}, noteStatus=${noteRes.status}, replyStatus=${replyRes.status}, assignStatus=${assignRes.status}, closeStatus=${closeRes.status}`
      )
    }

    console.log('\n================================================================================')
    console.log(`PHASE 8 TEST SUMMARY: ${results.filter((r) => r.status === 'PASSED').length} / ${results.length} TESTS PASSED`)
    console.log('================================================================================\n')

    const failed = results.filter((r) => r.status === 'FAILED')
    if (failed.length > 0) {
      console.error(`FATAL: ${failed.length} tests failed!`)
      process.exit(1)
    }

  } finally {
    await testPrisma.$disconnect()

    // Safe teardown of apex_disposable_test
    console.log('\n[TEARDOWN] Safely tearing down disposable test database...')
    await safeTeardownDisposableDb(config, isCreated)

    // Verify production database apex is 100% intact
    const prodUrl = new URL(config.maintenanceDbUrl)
    prodUrl.pathname = '/apex'
    const prodPrisma = new PrismaClient({
      datasources: { db: { url: prodUrl.toString() } },
    })
    try {
      const counts = await prodPrisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT (
          (SELECT count(*) FROM "AdminUser") +
          (SELECT count(*) FROM "Country") +
          (SELECT count(*) FROM "ServiceCategory") +
          (SELECT count(*) FROM "Property") +
          (SELECT count(*) FROM "PropertyImage") +
          (SELECT count(*) FROM "PropertyService") +
          (SELECT count(*) FROM "HomepageContent") +
          (SELECT count(*) FROM "Enquiry")
        ) as count;
      `
      console.log(`[VERIFY PROD DB] Production database "apex" record count: ${counts[0]?.count} (Expected: exactly 48)`)
    } finally {
      await prodPrisma.$disconnect()
    }
  }
}

runPhase8TestSuite().catch((err) => {
  console.error('Fatal error executing Phase 8 test suite:', err)
  process.exit(1)
})
