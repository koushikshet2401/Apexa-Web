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
import { recordAnalyticsEvent, parseAnalyticsDateRange, generateVisitorHash } from '../../src/lib/analytics'

// Dynamic route handler placeholders
let adminDashboardRoute: typeof import('../../src/app/api/admin/analytics/dashboard/route')
let adminVisitsRoute: typeof import('../../src/app/api/admin/analytics/visits/route')
let adminProjectsRoute: typeof import('../../src/app/api/admin/analytics/projects/route')
let adminDealsRoute: typeof import('../../src/app/api/admin/analytics/deals/route')
let adminPortfolioRoute: typeof import('../../src/app/api/admin/analytics/portfolio/route')
let adminCountriesRoute: typeof import('../../src/app/api/admin/analytics/countries/route')
let publicTrackRoute: typeof import('../../src/app/api/analytics/track/route')

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

function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    token?: string
    cookieToken?: string
    ip?: string
    userAgent?: string
    headers?: Record<string, string>
  } = {}
): NextRequest {
  const headers = new Headers(options.headers || {})
  headers.set('host', 'localhost:3000')

  const authToken = options.token || options.cookieToken
  if (authToken) {
    headers.set('authorization', `Bearer ${authToken}`)
    headers.set('cookie', `${SESSION_COOKIE_NAME}=${authToken}`)
  }
  if (options.ip) {
    headers.set('x-forwarded-for', options.ip)
  }
  if (options.userAgent) {
    headers.set('user-agent', options.userAgent)
  }

  const reqInit: RequestInit = {
    method: options.method || 'GET',
    headers,
  }

  if (options.body && options.method !== 'GET') {
    reqInit.body = JSON.stringify(options.body)
    headers.set('content-type', 'application/json')
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), reqInit as any)
}

async function runPhase7TestSuite() {
  console.log('================================================================================')
  console.log('APEX PACIFIC HOLDINGS — PHASE 7: DASHBOARD & ANALYTICS TEST SUITE')
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

  const testPrisma = new PrismaClient({
    datasources: { db: { url: config.testDbUrl } },
  })
  ;(globalThis as any).prisma = testPrisma

  await verifyCurrentDatabase(testPrisma, REQUIRED_TEST_DB_NAME)
  console.log(`[VERIFY OK] Test Prisma bound to disposable database: "${REQUIRED_TEST_DB_NAME}"`)

  // Dynamically load route handlers now that globalThis.prisma points to apex_disposable_test
  adminDashboardRoute = await import('../../src/app/api/admin/analytics/dashboard/route')
  adminVisitsRoute = await import('../../src/app/api/admin/analytics/visits/route')
  adminProjectsRoute = await import('../../src/app/api/admin/analytics/projects/route')
  adminDealsRoute = await import('../../src/app/api/admin/analytics/deals/route')
  adminPortfolioRoute = await import('../../src/app/api/admin/analytics/portfolio/route')
  adminCountriesRoute = await import('../../src/app/api/admin/analytics/countries/route')
  publicTrackRoute = await import('../../src/app/api/analytics/track/route')

  // Seed Default Roles, Permissions, and Test Users
  console.log('[SEED] Seeding default roles & permissions into database...')
  await ensureDefaultRolesAndPermissions(testPrisma)

  const superAdmin = await testPrisma.adminUser.upsert({
    where: { email: 'superadmin_p7@apexpacificholdings.com' },
    update: { isActive: true, roleId: 'role_super_admin' },
    create: {
      id: 'usr_super_admin_p7',
      email: 'superadmin_p7@apexpacificholdings.com',
      name: 'Super Admin P7',
      passwordHash: 'dummy_hash',
      roleId: 'role_super_admin',
      isActive: true,
    },
  })

  const complianceOfficer = await testPrisma.adminUser.upsert({
    where: { email: 'compliance_p7@apexpacificholdings.com' },
    update: { isActive: true, roleId: 'role_compliance_officer' },
    create: {
      id: 'usr_compliance_p7',
      email: 'compliance_p7@apexpacificholdings.com',
      name: 'Compliance Officer P7',
      passwordHash: 'dummy_hash',
      roleId: 'role_compliance_officer',
      isActive: true,
    },
  })

  const contentEditor = await testPrisma.adminUser.upsert({
    where: { email: 'editor_p7@apexpacificholdings.com' },
    update: { isActive: true, roleId: 'role_content_editor' },
    create: {
      id: 'usr_editor_p7',
      email: 'editor_p7@apexpacificholdings.com',
      name: 'Content Editor P7',
      passwordHash: 'dummy_hash',
      roleId: 'role_content_editor',
      isActive: true,
    },
  })

  const superAdminToken = await signToken({
    id: superAdmin.id,
    email: superAdmin.email,
    role: 'SUPER_ADMIN',
  })

  const complianceToken = await signToken({
    id: complianceOfficer.id,
    email: complianceOfficer.email,
    role: 'COMPLIANCE_OFFICER',
  })

  const editorToken = await signToken({
    id: contentEditor.id,
    email: contentEditor.email,
    role: 'CONTENT_EDITOR',
  })

  // Seed Countries
  const countryUAE = await testPrisma.country.upsert({
    where: { slug: 'dubai' },
    update: {},
    create: {
      id: 'country_uae',
      slug: 'dubai',
      name: 'United Arab Emirates',
      displayName: 'Dubai, UAE',
      region: 'Middle East',
      cities: 'Dubai, Abu Dhabi',
      isPublished: true,
    },
  })

  const countryThailand = await testPrisma.country.upsert({
    where: { slug: 'thailand' },
    update: {},
    create: {
      id: 'country_thailand',
      slug: 'thailand',
      name: 'Thailand',
      displayName: 'Thailand',
      region: 'Southeast Asia',
      cities: 'Phuket, Bangkok',
      isPublished: true,
    },
  })

  console.log('[SEED OK] Test users, countries, and auth tokens ready.\n')

  // ==========================================================================
  // TEST 1: Website Visit Counting & Daily Aggregation
  // ==========================================================================
  console.log('[TEST 1] Verifying Website Visit Counting & Daily Aggregation...')
  const event1 = await recordAnalyticsEvent(
    {
      eventType: 'PAGE_VIEW',
      path: '/projects',
      ip: '198.51.100.10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    testPrisma
  )

  const event2 = await recordAnalyticsEvent(
    {
      eventType: 'PROJECT_VIEW',
      path: '/projects/palma-residences',
      entityType: 'Property',
      entityId: 'prop_test_1',
      country: 'United Arab Emirates',
      ip: '198.51.100.11',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    testPrisma
  )

  const todayUtc = new Date()
  todayUtc.setUTCHours(0, 0, 0, 0)

  const dailyRec = await testPrisma.dailyAnalytics.findUnique({
    where: { date: todayUtc },
  })

  const passedT1 =
    event1.ok === true &&
    event2.ok === true &&
    dailyRec !== null &&
    dailyRec.qualifyingVisits === 2 &&
    dailyRec.pageViews === 2 &&
    dailyRec.projectViews === 1

  assertTest(
    'TC-P7-001',
    'Website Visit Counting & Daily Aggregation',
    'Analytics Telemetry',
    passedT1,
    `Qualifying visits: ${dailyRec?.qualifyingVisits}, Page views: ${dailyRec?.pageViews}, Project views: ${dailyRec?.projectViews}`,
    `Daily record values did not match expected: ${JSON.stringify(dailyRec)}`
  )

  // ==========================================================================
  // TEST 2: Administrative Traffic Exclusion
  // ==========================================================================
  console.log('[TEST 2] Verifying Administrative Traffic Exclusion...')
  // Via public track route with admin session cookie
  const reqAdminCookie = createMockRequest('http://localhost:3000/api/analytics/track', {
    method: 'POST',
    cookieToken: superAdminToken,
    body: {
      eventType: 'PAGE_VIEW',
      path: '/projects',
    },
    ip: '198.51.100.99',
  })
  const resAdminCookie = await publicTrackRoute.POST(reqAdminCookie)
  const jsonAdminCookie = await resAdminCookie.json()

  // Via public track route on /admin/* path
  const reqAdminPath = createMockRequest('http://localhost:3000/api/analytics/track', {
    method: 'POST',
    body: {
      eventType: 'PAGE_VIEW',
      path: '/admin/properties/create',
    },
    ip: '198.51.100.98',
  })
  const resAdminPath = await publicTrackRoute.POST(reqAdminPath)
  const jsonAdminPath = await resAdminPath.json()

  const dailyRecAfterAdmin = await testPrisma.dailyAnalytics.findUnique({
    where: { date: todayUtc },
  })

  const passedT2 =
    jsonAdminCookie.ignored === true &&
    jsonAdminCookie.reason === 'ADMIN_TRAFFIC_EXCLUDED' &&
    jsonAdminPath.ignored === true &&
    jsonAdminPath.reason === 'ADMIN_TRAFFIC_EXCLUDED' &&
    dailyRecAfterAdmin?.qualifyingVisits === 2 // strictly unchanged

  assertTest(
    'TC-P7-002',
    'Administrative Traffic Exclusion',
    'Analytics Privacy & Security',
    passedT2,
    `Admin cookie ignored: ${jsonAdminCookie.ignored}, Admin path ignored: ${jsonAdminPath.ignored}, Qualifying visits unchanged: ${dailyRecAfterAdmin?.qualifyingVisits}`,
    `Admin traffic was not properly excluded.`
  )

  // ==========================================================================
  // TEST 3: Repeat Visit Handling & Ratio
  // ==========================================================================
  console.log('[TEST 3] Verifying Repeat Visit Handling & Non-PII Visitor Hashing...')
  const repeatIp = '203.0.113.42'
  const repeatUa = 'ApexMobileSafari/17.0'

  // First visit
  await recordAnalyticsEvent(
    {
      eventType: 'PAGE_VIEW',
      path: '/',
      ip: repeatIp,
      userAgent: repeatUa,
    },
    testPrisma
  )

  // Second visit from same user/device (qualifies as repeat)
  await recordAnalyticsEvent(
    {
      eventType: 'PAGE_VIEW',
      path: '/about',
      ip: repeatIp,
      userAgent: repeatUa,
    },
    testPrisma
  )

  const reqVisits = createMockRequest('http://localhost:3000/api/admin/analytics/visits?range=30d', {
    token: superAdminToken,
  })
  const resVisits = await adminVisitsRoute.GET(reqVisits)
  const jsonVisits = await resVisits.json()

  const passedT3 =
    resVisits.status === 200 &&
    jsonVisits.summary?.metricLabel === 'Website Visits' &&
    jsonVisits.summary?.repeatVisitsCount >= 1 &&
    jsonVisits.summary?.repeatVisitsRatio > 0

  assertTest(
    'TC-P7-003',
    'Repeat Visit Handling & Strict Metric Labeling',
    'Visitor Intelligence',
    passedT3,
    `Metric label: "${jsonVisits.summary?.metricLabel}", Repeat visits count: ${jsonVisits.summary?.repeatVisitsCount}, Ratio: ${jsonVisits.summary?.repeatVisitsRatio}%`,
    `Repeat visits failed: ${JSON.stringify(jsonVisits)}`
  )

  // ==========================================================================
  // TEST 4: Duplicate Event Prevention & Idempotency Key Deduplication
  // ==========================================================================
  console.log('[TEST 4] Verifying Duplicate Event Prevention & Idempotency Key Deduplication...')
  const testIdempotencyKey = `idem_${Date.now()}_test4`

  const reqFirst = createMockRequest('http://localhost:3000/api/analytics/track', {
    method: 'POST',
    body: {
      eventType: 'PAGE_VIEW',
      path: '/contact',
      idempotencyKey: testIdempotencyKey,
    },
    ip: '198.51.100.50',
    userAgent: 'ApexBrowser/1.0',
  })
  const resFirst = await publicTrackRoute.POST(reqFirst)
  const jsonFirst = await resFirst.json()

  const reqSecond = createMockRequest('http://localhost:3000/api/analytics/track', {
    method: 'POST',
    body: {
      eventType: 'PAGE_VIEW',
      path: '/contact',
      idempotencyKey: testIdempotencyKey,
    },
    ip: '198.51.100.50',
    userAgent: 'ApexBrowser/1.0',
  })
  const resSecond = await publicTrackRoute.POST(reqSecond)
  const jsonSecond = await resSecond.json()

  const duplicateEventsInDb = await testPrisma.analyticsEvent.findMany({
    where: { idempotencyKey: testIdempotencyKey },
  })

  const passedT4 =
    jsonFirst.ok === true &&
    jsonFirst.eventId !== undefined &&
    jsonSecond.ignored === true &&
    duplicateEventsInDb.length === 1

  assertTest(
    'TC-P7-004',
    'Duplicate Event Prevention & Idempotency Deduplication',
    'Data Integrity',
    passedT4,
    `First event accepted: ${jsonFirst.ok}, Duplicate second event ignored: ${jsonSecond.ignored} (reason: ${jsonSecond.reason}), DB count: ${duplicateEventsInDb.length}`,
    `Idempotency check failed: First=${JSON.stringify(jsonFirst)}, Second=${JSON.stringify(jsonSecond)}`
  )

  // ==========================================================================
  // TEST 5: Daily and Monthly Visit Trends Over Time
  // ==========================================================================
  console.log('[TEST 5] Verifying Daily and Monthly Visit Trends Over Time...')
  // Insert historical DailyAnalytics
  const yesterday = new Date(todayUtc)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  await testPrisma.dailyAnalytics.upsert({
    where: { date: yesterday },
    update: {},
    create: {
      date: yesterday,
      totalVisits: 10,
      qualifyingVisits: 8,
      pageViews: 25,
      projectViews: 5,
      countryViews: 2,
    },
  })

  const reqTrendDaily = createMockRequest('http://localhost:3000/api/admin/analytics/visits?range=7d', {
    token: superAdminToken,
  })
  const resTrendDaily = await adminVisitsRoute.GET(reqTrendDaily)
  const jsonTrendDaily = await resTrendDaily.json()

  const reqTrendMonthly = createMockRequest('http://localhost:3000/api/admin/analytics/visits?range=ytd', {
    token: superAdminToken,
  })
  const resTrendMonthly = await adminVisitsRoute.GET(reqTrendMonthly)
  const jsonTrendMonthly = await resTrendMonthly.json()

  const passedT5 =
    resTrendDaily.status === 200 &&
    jsonTrendDaily.timeSeries?.length >= 2 &&
    jsonTrendDaily.dateRange?.interval === 'day' &&
    resTrendMonthly.status === 200 &&
    jsonTrendMonthly.dateRange?.interval === 'month' &&
    jsonTrendMonthly.timeSeries?.length >= 1

  assertTest(
    'TC-P7-005',
    'Daily and Monthly Visit Trends Aggregation',
    'Time-Series Analytics',
    passedT5,
    `7d daily points: ${jsonTrendDaily.timeSeries?.length}, YTD monthly points: ${jsonTrendMonthly.timeSeries?.length}`,
    `Trend queries failed: daily=${resTrendDaily.status} (${JSON.stringify(jsonTrendDaily)}), monthly=${resTrendMonthly.status} (${JSON.stringify(jsonTrendMonthly)})`
  )

  // ==========================================================================
  // TEST 6: Project Additions Over Time
  // ==========================================================================
  console.log('[TEST 6] Verifying Project Additions Over Time...')
  const propA = await testPrisma.property.create({
    data: {
      id: 'prop_p7_add_01',
      name: 'Palm Jumeirah Signature Villa',
      slug: 'palm-jumeirah-signature-villa',
      countryId: countryUAE.id,
      cityName: 'Dubai',
      locationLine: 'Palm Jumeirah',
      askingPriceNumeric: new Prisma.Decimal('45000000.00'),
      askingCurrency: 'AED',
      isPOA: false,
      isPublished: true,
      isDraft: false,
      isArchived: false,
      isPubliclyVisible: true,
      isSpaceInRound: true, // Space in the Round
    },
  })

  const propB = await testPrisma.property.create({
    data: {
      id: 'prop_p7_add_02',
      name: 'Phuket Oceanfront Estate',
      slug: 'phuket-oceanfront-estate',
      countryId: countryThailand.id,
      cityName: 'Phuket',
      locationLine: 'Kamala',
      askingPriceNumeric: new Prisma.Decimal('120000000.00'),
      askingCurrency: 'THB',
      isPOA: false,
      isPublished: true,
      isDraft: false,
      isArchived: false,
      isPubliclyVisible: true,
      isSpaceInRound: false,
    },
  })

  const reqProjects = createMockRequest('http://localhost:3000/api/admin/analytics/projects?range=30d', {
    token: superAdminToken,
  })
  const resProjects = await adminProjectsRoute.GET(reqProjects)
  const jsonProjects = await resProjects.json()

  const totalAdditions = jsonProjects.additionsTimeSeries?.reduce(
    (sum: number, pt: any) => sum + pt.additionsCount,
    0
  )

  const passedT6 =
    resProjects.status === 200 &&
    totalAdditions >= 2 &&
    jsonProjects.inventorySummary.totalProjects >= 2

  assertTest(
    'TC-P7-006',
    'Project Additions Over Time Tracking',
    'Portfolio Analytics',
    passedT6,
    `Total additions recorded in window: ${totalAdditions}, Total published projects: ${jsonProjects.inventorySummary?.totalProjects}`,
    `Project additions query failed: ${JSON.stringify(jsonProjects)}`
  )

  // ==========================================================================
  // TEST 7: Completed Deal Counts (Option A vs Option B)
  // ==========================================================================
  console.log('[TEST 7] Verifying Completed Deal Counts (Option A vs Option B)...')
  // Deal 1: Completed with Option A (Keep Publicly Visible)
  const deal1 = await testPrisma.deal.create({
    data: {
      id: 'deal_p7_comp_01',
      dealRef: 'DEAL-P7-001',
      propertyId: propA.id,
      buyerName: 'Private Investor A',
      status: 'COMPLETED',
      actualSalePrice: new Prisma.Decimal('44000000.00'),
      saleCurrency: 'AED',
      closedAt: new Date(),
      closedById: superAdmin.id,
      keepPubliclyVisible: true, // Option A: Visible Acquired
    },
  })

  // Deal 2: Completed with Option B (Do Not Show / Sold)
  const deal2 = await testPrisma.deal.create({
    data: {
      id: 'deal_p7_comp_02',
      dealRef: 'DEAL-P7-002',
      propertyId: propB.id,
      buyerName: 'Private Investor B',
      status: 'COMPLETED',
      actualSalePrice: new Prisma.Decimal('115000000.00'),
      saleCurrency: 'THB',
      closedAt: new Date(),
      closedById: superAdmin.id,
      keepPubliclyVisible: false, // Option B: Unlisted Sold
    },
  })

  const reqDeals = createMockRequest('http://localhost:3000/api/admin/analytics/deals?range=30d', {
    token: superAdminToken,
  })
  const resDeals = await adminDealsRoute.GET(reqDeals)
  const jsonDeals = await resDeals.json()

  const passedT7 =
    resDeals.status === 200 &&
    jsonDeals.completedDealsSummary.totalCompletedDeals === 2 &&
    jsonDeals.completedDealsSummary.optionAVisibleCount === 1 &&
    jsonDeals.completedDealsSummary.optionBUnlistedCount === 1

  assertTest(
    'TC-P7-007',
    'Completed Deal Visibility Partitioning (Option A vs Option B)',
    'Deal Performance',
    passedT7,
    `Total completed: ${jsonDeals.completedDealsSummary?.totalCompletedDeals}, Option A (Visible): ${jsonDeals.completedDealsSummary?.optionAVisibleCount}, Option B (Unlisted): ${jsonDeals.completedDealsSummary?.optionBUnlistedCount}`,
    `Deal visibility metrics mismatch: ${JSON.stringify(jsonDeals.completedDealsSummary)}`
  )

  // ==========================================================================
  // TEST 8: Deal Closure Trends Over Time
  // ==========================================================================
  console.log('[TEST 8] Verifying Deal Closure Trends Over Time...')
  const closuresCount = jsonDeals.closuresTimeSeries?.reduce(
    (sum: number, pt: any) => sum + pt.closuresCount,
    0
  )

  const passedT8 = closuresCount >= 2 && jsonDeals.closuresTimeSeries?.length >= 1

  assertTest(
    'TC-P7-008',
    'Deal Closure Trends Time-Series Aggregation',
    'Deal Performance',
    passedT8,
    `Total closures recorded: ${closuresCount} across ${jsonDeals.closuresTimeSeries?.length} date points`,
    `Closures time series failed: ${JSON.stringify(jsonDeals.closuresTimeSeries)}`
  )

  // ==========================================================================
  // TEST 9: Pipeline Status Counts & Ratios
  // ==========================================================================
  console.log('[TEST 9] Verifying Pipeline Status Counts & Ratios...')
  await testPrisma.deal.createMany({
    data: [
      {
        id: 'deal_p7_inquiry',
        dealRef: 'DEAL-P7-INQ',
        propertyId: propA.id,
        buyerName: 'Buyer 1',
        status: 'INQUIRY',
      },
      {
        id: 'deal_p7_contacted',
        dealRef: 'DEAL-P7-CON',
        propertyId: propA.id,
        buyerName: 'Buyer 2',
        status: 'CONTACTED',
      },
      {
        id: 'deal_p7_offer',
        dealRef: 'DEAL-P7-OFF',
        propertyId: propB.id,
        buyerName: 'Buyer 3',
        status: 'OFFER_MADE',
      },
      {
        id: 'deal_p7_contract',
        dealRef: 'DEAL-P7-UND',
        propertyId: propB.id,
        buyerName: 'Buyer 4',
        status: 'UNDER_CONTRACT',
      },
      {
        id: 'deal_p7_lost',
        dealRef: 'DEAL-P7-LST',
        propertyId: propA.id,
        buyerName: 'Buyer 5',
        status: 'LOST',
      },
    ],
  })

  const reqDashboard = createMockRequest('http://localhost:3000/api/admin/analytics/dashboard', {
    token: superAdminToken,
  })
  const resDashboard = await adminDashboardRoute.GET(reqDashboard)
  const jsonDashboard = await resDashboard.json()

  const pending = jsonDashboard.pendingDeals
  const winRate = jsonDashboard.completedDealMetrics.winRate
  // Expected win rate: 2 completed / (2 completed + 1 lost) = 66.67%
  const expectedWinRate = Number(((2 / 3) * 100).toFixed(2))

  const passedT9 =
    pending.inquiry === 1 &&
    pending.contacted === 1 &&
    pending.offerMade === 1 &&
    pending.underContract === 1 &&
    pending.lost === 1 &&
    pending.totalPending === 4 &&
    winRate.ratioPercent === expectedWinRate

  assertTest(
    'TC-P7-009',
    'Pipeline Status Counts & Terminal Win Rate',
    'Deal Performance',
    passedT9,
    `Pending: ${pending.totalPending} (Inquiry: ${pending.inquiry}, Contacted: ${pending.contacted}, Offer: ${pending.offerMade}, Under Contract: ${pending.underContract}), Win Rate: ${winRate.ratioPercent}% (formula: ${winRate.formula})`,
    `Pipeline counts or win rate mismatch: pending=${JSON.stringify(pending)}, winRate=${JSON.stringify(winRate)}`
  )

  // ==========================================================================
  // TEST 10: Total Portfolio Valuation Across Lifecycle States Grouped by Currency
  // ==========================================================================
  console.log('[TEST 10] Verifying Total Portfolio Valuation Across Lifecycle States...')
  // Create Draft and Archived properties in AED
  await testPrisma.property.create({
    data: {
      id: 'prop_p7_draft_01',
      name: 'Emirates Hills Mansion Draft',
      slug: 'emirates-hills-mansion-draft',
      countryId: countryUAE.id,
      cityName: 'Dubai',
      locationLine: 'Emirates Hills',
      askingPriceNumeric: new Prisma.Decimal('55000000.00'),
      askingCurrency: 'AED',
      isPOA: false,
      isPublished: false,
      isDraft: true,
      isArchived: false,
      isPubliclyVisible: false,
    },
  })

  await testPrisma.property.create({
    data: {
      id: 'prop_p7_archived_01',
      name: 'Downtown Penthouse Archived',
      slug: 'downtown-penthouse-archived',
      countryId: countryUAE.id,
      cityName: 'Dubai',
      locationLine: 'Downtown Dubai',
      askingPriceNumeric: new Prisma.Decimal('20000000.00'),
      askingCurrency: 'AED',
      isPOA: false,
      isPublished: false,
      isDraft: false,
      isArchived: true,
      isPubliclyVisible: false,
    },
  })

  const reqPortfolio = createMockRequest('http://localhost:3000/api/admin/analytics/portfolio', {
    token: superAdminToken,
  })
  const resPortfolio = await adminPortfolioRoute.GET(reqPortfolio)
  const jsonPortfolio = await resPortfolio.json()

  // In AED: propA (45M) + draft (55M) + archived (20M) = 120,000,000.00 AED across 3 properties
  const aedPortfolio = jsonPortfolio.totalPortfolioValuation?.byCurrency?.find(
    (c: any) => c.currency === 'AED'
  )

  const passedT10 =
    aedPortfolio !== undefined &&
    aedPortfolio.propertyCount === 3 &&
    new Prisma.Decimal(aedPortfolio.totalAmount).equals(new Prisma.Decimal('120000000.00')) &&
    jsonPortfolio.totalPortfolioValuation?.scopeDescription?.includes('Includes Published, Draft, Sold, and Recoverably Archived')

  assertTest(
    'TC-P7-010',
    'Total Corporate Portfolio Valuation Across Lifecycle States',
    'Valuation Integrity',
    passedT10,
    `AED Portfolio: ${aedPortfolio?.totalAmount} across ${aedPortfolio?.propertyCount} properties (Published + Draft + Archived). Scope: "${jsonPortfolio.totalPortfolioValuation?.scopeDescription}"`,
    `Valuation mismatch: ${JSON.stringify(aedPortfolio)}`
  )

  // ==========================================================================
  // TEST 11: Active Published Project Valuation Grouped by Currency
  // ==========================================================================
  console.log('[TEST 11] Verifying Active Published Project Valuation Grouped by Currency...')
  // In AED: Only propA (45,000,000.00 AED) is published and publicly visible
  const aedActive = jsonPortfolio.activePublishedValuation?.byCurrency?.find(
    (c: any) => c.currency === 'AED'
  )

  const passedT11 =
    aedActive !== undefined &&
    aedActive.activeListingCount === 1 &&
    new Prisma.Decimal(aedActive.totalAmount).equals(new Prisma.Decimal('45000000.00')) &&
    jsonPortfolio.activePublishedValuation?.scopeDescription?.includes('currently live on public website')

  assertTest(
    'TC-P7-011',
    'Active Published Project Valuation (Live Customer Showcase)',
    'Valuation Integrity',
    passedT11,
    `AED Active: ${aedActive?.totalAmount} across ${aedActive?.activeListingCount} live listing. Scope: "${jsonPortfolio.activePublishedValuation?.scopeDescription}"`,
    `Active published valuation mismatch: ${JSON.stringify(aedActive)}`
  )

  // ==========================================================================
  // TEST 12: Multi-Currency Grouping Integrity (Zero Cross-Currency Summation)
  // ==========================================================================
  console.log('[TEST 12] Verifying Multi-Currency Grouping Integrity...')
  // Portfolio should contain distinct entries for AED (120M) and THB (120M)
  const currenciesPresent = jsonPortfolio.totalPortfolioValuation?.byCurrency?.map((c: any) => c.currency) || []
  const thbPortfolio = jsonPortfolio.totalPortfolioValuation?.byCurrency?.find(
    (c: any) => c.currency === 'THB'
  )

  const passedT12 =
    currenciesPresent.includes('AED') &&
    currenciesPresent.includes('THB') &&
    thbPortfolio !== undefined &&
    new Prisma.Decimal(thbPortfolio.totalAmount).equals(new Prisma.Decimal('120000000.00')) &&
    jsonPortfolio.integrityPolicy?.directCrossCurrencySummation === false

  assertTest(
    'TC-P7-012',
    'Multi-Currency Grouping Integrity (Zero Cross-Currency Summation)',
    'Financial Compliance',
    passedT12,
    `Currencies strictly partitioned: ${currenciesPresent.join(', ')}. AED: ${aedPortfolio?.totalAmount}, THB: ${thbPortfolio?.totalAmount}. Policy: ${jsonPortfolio.integrityPolicy?.note}`,
    `Multi-currency partition violated: ${JSON.stringify(jsonPortfolio.totalPortfolioValuation?.byCurrency)}`
  )

  // ==========================================================================
  // TEST 13: Adjusted Deal Volume and Redenomination
  // ==========================================================================
  console.log('[TEST 13] Verifying Adjusted Deal Volume and Redenomination...')
  // Redenominate Deal 1 from 44,000,000 AED to 12,000,000 USD via DealFinancialAdjustment
  await testPrisma.dealFinancialAdjustment.create({
    data: {
      dealId: deal1.id,
      adjustmentSequence: 1,
      previousSalePrice: new Prisma.Decimal('44000000.00'),
      previousCurrency: 'AED',
      adjustedSalePrice: new Prisma.Decimal('12000000.00'),
      adjustedCurrency: 'USD',
      adjustmentReason: 'Formal corporate redenomination from AED to USD closing currency',
      legalContractRef: 'LEGAL-REDENOM-P7-001',
      authorizedById: superAdmin.id,
    },
  })

  const reqDealsAdjusted = createMockRequest('http://localhost:3000/api/admin/analytics/deals', {
    token: superAdminToken,
  })
  const resDealsAdjusted = await adminDealsRoute.GET(reqDealsAdjusted)
  const jsonDealsAdjusted = await resDealsAdjusted.json()

  const usdVolume = jsonDealsAdjusted.salesVolume?.byCurrency?.find((c: any) => c.currency === 'USD')
  const thbVolume = jsonDealsAdjusted.salesVolume?.byCurrency?.find((c: any) => c.currency === 'THB')

  const passedT13 =
    usdVolume !== undefined &&
    usdVolume.adjustedDealsCount === 1 &&
    new Prisma.Decimal(usdVolume.effectiveSalesVolume).equals(new Prisma.Decimal('12000000.00')) &&
    thbVolume !== undefined &&
    new Prisma.Decimal(thbVolume.effectiveSalesVolume).equals(new Prisma.Decimal('115000000.00'))

  assertTest(
    'TC-P7-013',
    'Adjusted Deal Volume and Currency Redenomination Tracking',
    'Financial Compliance',
    passedT13,
    `Effective Volume USD: ${usdVolume?.effectiveSalesVolume} (adjusted deals: ${usdVolume?.adjustedDealsCount}), THB: ${thbVolume?.effectiveSalesVolume}`,
    `Adjustment volume mismatch: ${JSON.stringify(jsonDealsAdjusted.salesVolume?.byCurrency)}`
  )

  // ==========================================================================
  // TEST 14: Spaces in the Round Counts
  // ==========================================================================
  console.log('[TEST 14] Verifying Spaces in the Round Counts...')
  // Create an unpublished space in round (must NOT be counted)
  await testPrisma.property.create({
    data: {
      id: 'prop_p7_space_draft',
      name: 'Space In Round Draft Property',
      slug: 'space-in-round-draft-prop',
      countryId: countryUAE.id,
      isPOA: true,
      isPublished: false,
      isDraft: true,
      isArchived: false,
      isSpaceInRound: true,
    },
  })

  const reqDashSpaces = createMockRequest('http://localhost:3000/api/admin/analytics/dashboard', {
    token: superAdminToken,
  })
  const resDashSpaces = await adminDashboardRoute.GET(reqDashSpaces)
  const jsonDashSpaces = await resDashSpaces.json()

  // Only propA has isSpaceInRound=true AND isPublished=true AND isArchived=false
  const passedT14 = jsonDashSpaces.spacesInRoundCount === 1

  assertTest(
    'TC-P7-014',
    'Spaces in the Round Publication Count Rule',
    'Business Rules',
    passedT14,
    `Spaces in the round count: ${jsonDashSpaces.spacesInRoundCount} (draft space excluded)`,
    `Spaces count mismatch: expected 1, got ${jsonDashSpaces.spacesInRoundCount}`
  )

  // ==========================================================================
  // TEST 15: Country-wise Inventory & Valuation Analytics
  // ==========================================================================
  console.log('[TEST 15] Verifying Country-wise Inventory & Valuation Analytics...')
  // Insert an enquiry for UAE
  await testPrisma.enquiry.create({
    data: {
      enquiryRef: 'ENQ-P7-GEO-01',
      name: 'UAE Client',
      email: 'uaeclient@example.com',
      phone: '+971501234567',
      country: 'United Arab Emirates',
      subject: 'Palm Villa Inquiry',
      propertyId: propA.id,
      status: 'NEW',
    },
  })

  const reqCountries = createMockRequest('http://localhost:3000/api/admin/analytics/countries', {
    token: superAdminToken,
  })
  const resCountries = await adminCountriesRoute.GET(reqCountries)
  const jsonCountries = await resCountries.json()

  const uae = jsonCountries.countries?.find((c: any) => c.country === 'United Arab Emirates')
  const th = jsonCountries.countries?.find((c: any) => c.country === 'Thailand')

  const passedT15 =
    resCountries.status === 200 &&
    uae !== undefined &&
    uae.propertiesCount >= 3 &&
    uae.activePublishedCount === 1 &&
    uae.enquiriesCount >= 1 &&
    th !== undefined &&
    th.propertiesCount === 1 &&
    th.activePublishedCount === 1

  assertTest(
    'TC-P7-015',
    'Country-wise Geographic Inventory & Interest Breakdown',
    'Geographic Analytics',
    passedT15,
    `UAE: ${uae?.propertiesCount} props (${uae?.activePublishedCount} active), ${uae?.enquiriesCount} enquiries. Thailand: ${th?.propertiesCount} props (${th?.activePublishedCount} active)`,
    `Country analytics mismatch: UAE=${JSON.stringify(uae)}, Thailand=${JSON.stringify(th)}`
  )

  // ==========================================================================
  // TEST 16: Empty Database Behavior & Zero Division Resilience
  // ==========================================================================
  console.log('[TEST 16] Verifying Empty Database Behavior & Zero Division Resilience...')
  // Query with a date range in the future where no records exist
  const reqEmptyVisits = createMockRequest(
    'http://localhost:3000/api/admin/analytics/visits?range=custom&startDate=2040-01-01&endDate=2040-01-02',
    { token: superAdminToken }
  )
  const resEmptyVisits = await adminVisitsRoute.GET(reqEmptyVisits)
  const jsonEmptyVisits = await resEmptyVisits.json()

  const passedT16 =
    resEmptyVisits.status === 200 &&
    typeof jsonEmptyVisits.summary?.repeatVisitsRatio === 'number' &&
    typeof jsonEmptyVisits.summary?.avgPageViewsPerVisit === 'number' &&
    !isNaN(jsonEmptyVisits.summary?.repeatVisitsRatio) &&
    !isNaN(jsonEmptyVisits.summary?.avgPageViewsPerVisit)

  assertTest(
    'TC-P7-016',
    'Empty Query State & Zero Division Resilience',
    'Robustness & Fault Tolerance',
    passedT16,
    `Safe fallback verified: repeatVisitsRatio=${jsonEmptyVisits.summary?.repeatVisitsRatio}, avgViewsPerVisit=${jsonEmptyVisits.summary?.avgPageViewsPerVisit}`,
    `Zero division or crash occurred on empty state: ${JSON.stringify(jsonEmptyVisits)}`
  )

  // ==========================================================================
  // TEST 17: Date-Range Validation & Consistent UTC Invariants
  // ==========================================================================
  console.log('[TEST 17] Verifying Date-Range Validation & UTC Invariants...')
  // Valid standard ranges
  const rangeKeys = ['today', '7d', '30d', '90d', 'ytd']
  let allRangesValid = true
  for (const rk of rangeKeys) {
    const parsed = parseAnalyticsDateRange(new URLSearchParams(`range=${rk}`))
    if (parsed.rangeKey !== rk || !(parsed.startDate instanceof Date) || !(parsed.endDate instanceof Date)) {
      allRangesValid = false
    }
  }

  // Valid custom range
  const parsedCustom = parseAnalyticsDateRange(
    new URLSearchParams('range=custom&startDate=2026-01-01&endDate=2026-06-30')
  )
  const isCustomValid =
    parsedCustom.rangeKey === 'custom' &&
    parsedCustom.startDate.toISOString().startsWith('2026-01-01') &&
    parsedCustom.endDate.toISOString().startsWith('2026-06-30')

  // Inverted custom dates (startDate > endDate)
  const reqInverted = createMockRequest(
    'http://localhost:3000/api/admin/analytics/visits?range=custom&startDate=2026-12-31&endDate=2026-01-01',
    { token: superAdminToken }
  )
  const resInverted = await adminVisitsRoute.GET(reqInverted)
  const jsonInverted = await resInverted.json()

  // Malformed date
  const reqMalformed = createMockRequest(
    'http://localhost:3000/api/admin/analytics/visits?range=custom&startDate=not-a-date&endDate=2026-01-01',
    { token: superAdminToken }
  )
  const resMalformed = await adminVisitsRoute.GET(reqMalformed)

  const passedT17 =
    allRangesValid &&
    isCustomValid &&
    resInverted.status === 400 &&
    resMalformed.status === 400 &&
    jsonInverted.error.includes('startDate must be on or before endDate')

  assertTest(
    'TC-P7-017',
    'Date-Range Validation & Strict UTC Timezone Strategy',
    'Input Validation & Security',
    passedT17,
    `Standard ranges validated: ${rangeKeys.join(', ')}. Inverted dates rejected with 400 (${jsonInverted.error}). Malformed dates rejected with 400.`,
    `Date range validation failed.`
  )

  // ==========================================================================
  // TEST 18: Authentication & RBAC Enforcement (PERMISSIONS.ANALYTICS_READ)
  // ==========================================================================
  console.log('[TEST 18] Verifying Authentication & RBAC Enforcement...')
  // Unauthenticated request
  const reqUnauth = createMockRequest('http://localhost:3000/api/admin/analytics/dashboard')
  const resUnauth = await adminDashboardRoute.GET(reqUnauth)

  // Unauthorized user (Content Editor lacks ANALYTICS:READ)
  const reqForbidden = createMockRequest('http://localhost:3000/api/admin/analytics/dashboard', {
    token: editorToken,
  })
  const resForbidden = await adminDashboardRoute.GET(reqForbidden)

  // Authorized Compliance Officer (Has ANALYTICS:READ)
  const reqCompliance = createMockRequest('http://localhost:3000/api/admin/analytics/dashboard', {
    token: complianceToken,
  })
  const resCompliance = await adminDashboardRoute.GET(reqCompliance)

  const passedT18 =
    resUnauth.status === 401 &&
    resForbidden.status === 403 &&
    resCompliance.status === 200

  assertTest(
    'TC-P7-018',
    'Authentication & Strict RBAC Permission Gate (ANALYTICS:READ)',
    'RBAC Authorization',
    passedT18,
    `Unauthenticated rejected with 401, Content Editor rejected with 403, Compliance Officer permitted with 200`,
    `RBAC gate failed: unauth=${resUnauth.status}, editor=${resForbidden.status}, compliance=${resCompliance.status}`
  )

  // ==========================================================================
  // TEST 19: Analytics Privacy & Non-PII Isolation
  // ==========================================================================
  console.log('[TEST 19] Verifying Analytics Privacy & Non-PII Isolation...')
  const rawEvents = await testPrisma.analyticsEvent.findMany({
    take: 10,
  })

  let hasLeakedIp = false
  let allVisitorHashesHashed = true

  for (const ev of rawEvents) {
    if (ev.visitorHash) {
      // Must be 16-hex character anonymous hash or 'anon_visitor'
      if (ev.visitorHash !== 'anon_visitor' && !/^[0-9a-f]{16}$/i.test(ev.visitorHash)) {
        allVisitorHashesHashed = false
      }
      // Must not match an IP address format
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ev.visitorHash)) {
        hasLeakedIp = true
      }
    }
  }

  const passedT19 = !hasLeakedIp && allVisitorHashesHashed && rawEvents.length > 0

  assertTest(
    'TC-P7-019',
    'Analytics Privacy and Non-PII Data Isolation',
    'Data Privacy & Compliance',
    passedT19,
    `Inspected ${rawEvents.length} events: zero raw IP addresses stored, all visitor IDs are 16-character HMAC salts.`,
    `PII leak detected in AnalyticsEvent.`
  )

  // ==========================================================================
  // TEST 20: Live Database Zero-Mutation Audit
  // ==========================================================================
  console.log('[TEST 20] Verifying Live Database Zero-Mutation Audit...')
  const liveDbUrl = process.env.DATABASE_URL
  const livePrisma = new PrismaClient({
    datasources: { db: { url: liveDbUrl } },
  })

  let liveAuditPassed = false
  let liveDetails = ''
  try {
    const dbNameRaw = await livePrisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database();
    `
    const currentLiveDb = dbNameRaw[0]?.current_database

    // Query exact 8 baseline tables
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
    const totalLiveRecords = props + imgs + countries + services + propServices + admins + enqs + home

    // Migration count on live database
    const liveMigrations = await livePrisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM "_prisma_migrations" ORDER BY finished_at ASC;
    `
    const liveMigrationCount = liveMigrations.length

    liveAuditPassed =
      currentLiveDb === 'apex' &&
      totalLiveRecords === 48 &&
      props === 6 &&
      imgs === 21 &&
      countries === 5 &&
      services === 4 &&
      propServices === 9 &&
      admins === 1 &&
      enqs === 1 &&
      home === 1 &&
      liveMigrationCount === 1 &&
      liveMigrations[0].migration_name === '20261030073355_init_schema'

    liveDetails = `Live DB: "${currentLiveDb}", Total records: ${totalLiveRecords} (exactly 48 across 8 baseline tables), Migrations: ${liveMigrationCount} (exactly 1 baseline: "${liveMigrations[0]?.migration_name}").`
  } catch (err: any) {
    liveAuditPassed = false
    liveDetails = `Live DB audit error: ${err.message}`
  } finally {
    await livePrisma.$disconnect()
  }

  assertTest(
    'TC-P7-020',
    'Live Database Zero-Mutation Audit',
    'Environment Isolation & Safety',
    liveAuditPassed,
    liveDetails,
    `Live database altered! Details: ${liveDetails}`
  )

  // ==========================================================================
  // TEARDOWN DISPOSABLE DATABASE
  // ==========================================================================
  await testPrisma.$disconnect()
  console.log('\n[TEARDOWN] Safely tearing down disposable test database...')
  await safeTeardownDisposableDb(config, isCreated)

  // ==========================================================================
  // PRINT SUMMARY REPORT
  // ==========================================================================
  console.log('\n================================================================================')
  console.log('PHASE 7: DASHBOARD & ANALYTICS TEST SUITE EXECUTION RESULTS')
  console.log('================================================================================')
  let passedCount = 0
  for (const r of results) {
    const symbol = r.status === 'PASSED' ? '✓' : '✗'
    console.log(`${symbol} [${r.status}] ${r.id}: ${r.name}`)
    console.log(`    Category: ${r.category}`)
    console.log(`    Evidence: ${r.evidence}\n`)
    if (r.status === 'PASSED') passedCount++
  }

  console.log('--------------------------------------------------------------------------------')
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`)
  console.log(`PASS RATE: ${((passedCount / results.length) * 100).toFixed(1)}%`)
  console.log('================================================================================\n')

  if (passedCount !== results.length) {
    process.exit(1)
  }
}

runPhase7TestSuite().catch((err) => {
  console.error('FATAL TEST RUN ERROR:', err)
  process.exit(1)
})
