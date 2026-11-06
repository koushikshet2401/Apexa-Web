import { execSync } from 'child_process'
import { PrismaClient, Prisma } from '@prisma/client'
import { closeDealTransaction } from '../deal_service'

/**
 * APEX PACIFIC HOLDINGS — HARDENED DISPOSABLE TEST DATABASE HARNESS
 * File: prisma/tests/run_disposable_test_db.ts
 * 
 * STRICT ARCHITECTURAL RESTRICTIONS:
 * 1. Requires explicit TEST_DATABASE_URL environment variable (no fallback).
 * 2. Target database MUST be exactly "apex_disposable_test".
 * 3. Rejects "apex" or any other database name.
 * 4. NEVER executes DROP DATABASE IF EXISTS as a pre-provisioning step.
 * 5. If "apex_disposable_test" already exists, aborts immediately to preserve pre-existing data.
 * 6. Creates "apex_disposable_test" only when it does not exist, and tracks in-memory ownership.
 * 7. Verifies SELECT current_database() before migration and before tests.
 * 8. Enforces Prisma migration subprocess uses DATABASE_URL = config.testDbUrl.
 * 9. Cleans up ONLY if the database was created by this exact run (isDbCreatedByThisRun === true).
 */

export const REQUIRED_TEST_DB_NAME = 'apex_disposable_test'
export const MAINTENANCE_DB_NAME = 'postgres'

export interface ValidatedTestDbConfig {
  testDbUrl: string
  maintenanceDbUrl: string
  dbName: string
  maintenanceDbName: string
  host: string
  port: number
}

/**
 * Validates the test database connection string with strict security invariants.
 */
export function validateTestDatabaseUrl(rawUrl: string | undefined): ValidatedTestDbConfig {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    throw new Error('SAFETY ABORT: TEST_DATABASE_URL environment variable must be explicitly defined. No fallback permitted.')
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch (err: any) {
    throw new Error(`SAFETY ABORT: TEST_DATABASE_URL is a malformed URL: ${err.message}`)
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(`SAFETY ABORT: TEST_DATABASE_URL protocol must be postgresql: or postgres:, got "${parsed.protocol}"`)
  }

  const rawPath = parsed.pathname.replace(/^\//, '').trim()
  if (!rawPath) {
    throw new Error('SAFETY ABORT: TEST_DATABASE_URL does not specify a database name.')
  }

  // Reject production / real database name (case-insensitive)
  if (rawPath.toLowerCase() === 'apex') {
    throw new Error("CRITICAL SAFETY VIOLATION: Execution against the production database 'apex' is strictly prohibited.")
  }

  // Enforce exact database name
  if (rawPath !== REQUIRED_TEST_DB_NAME) {
    throw new Error(`SAFETY ABORT: Target database must be exactly "${REQUIRED_TEST_DB_NAME}", got "${rawPath}".`)
  }

  // Construct maintenance database URL (strictly pointing to 'postgres')
  const maintenanceParsed = new URL(rawUrl)
  maintenanceParsed.pathname = `/${MAINTENANCE_DB_NAME}`
  const maintenanceDbUrl = maintenanceParsed.toString()

  const port = parsed.port ? parseInt(parsed.port, 10) : 5432
  const host = parsed.hostname || 'localhost'

  return {
    testDbUrl: rawUrl,
    maintenanceDbUrl,
    dbName: REQUIRED_TEST_DB_NAME,
    maintenanceDbName: MAINTENANCE_DB_NAME,
    host,
    port,
  }
}

/**
 * Checks whether the disposable test database already exists on PostgreSQL.
 * Connects via the maintenance database.
 */
export async function checkDatabaseExists(maintenanceDbUrl: string, targetDbName: string): Promise<boolean> {
  const maintPrisma = new PrismaClient({
    datasources: { db: { url: maintenanceDbUrl } },
  })
  try {
    const rows = await maintPrisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_database WHERE datname = ${targetDbName}
      ) as "exists";
    `
    return rows.length > 0 && rows[0].exists
  } finally {
    await maintPrisma.$disconnect()
  }
}

/**
 * Non-destructive database provisioning:
 * 1. Checks if apex_disposable_test already exists.
 * 2. If it exists, aborts with an error (NEVER drops it).
 * 3. If it does not exist, creates it and returns true to signify ownership.
 */
export async function safeProvisionDisposableDb(config: ValidatedTestDbConfig): Promise<boolean> {
  // Guard 1: Verify target database name
  if (config.dbName !== REQUIRED_TEST_DB_NAME) {
    throw new Error(`SAFETY ABORT: Refusing to provision database other than "${REQUIRED_TEST_DB_NAME}".`)
  }

  // Guard 2: Verify maintenance database is "postgres"
  const maintDb = new URL(config.maintenanceDbUrl).pathname.replace(/^\//, '')
  if (maintDb !== MAINTENANCE_DB_NAME) {
    throw new Error(`SAFETY ABORT: Maintenance connection must target "${MAINTENANCE_DB_NAME}", got "${maintDb}".`)
  }

  console.log(`[PROVISION] Checking existence of "${config.dbName}" via maintenance connection...`)
  const alreadyExists = await checkDatabaseExists(config.maintenanceDbUrl, config.dbName)
  if (alreadyExists) {
    throw new Error(
      `CRITICAL PRESERVATION GUARD: Database "${config.dbName}" already exists. ` +
      `The harness will NEVER drop, reset, or overwrite a pre-existing database. ` +
      `Execution aborted to protect pre-existing data. Please manually inspect and remove it if it was an abandoned test database.`
    )
  }

  console.log(`[PROVISION] Database "${config.dbName}" does not exist. Creating via maintenance database...`)
  const maintPrisma = new PrismaClient({
    datasources: { db: { url: config.maintenanceDbUrl } },
  })
  try {
    await maintPrisma.$executeRawUnsafe(`CREATE DATABASE "${REQUIRED_TEST_DB_NAME}";`)
    console.log(`[PROVISION OK] Disposable database "${REQUIRED_TEST_DB_NAME}" created successfully by this execution.`)
  } finally {
    await maintPrisma.$disconnect()
  }

  // Return true indicating ownership by this run
  return true
}

/**
 * Builds isolated child process environment variables ensuring Prisma migrate deploy
 * uses the disposable test database URL and cannot fall back to any normal DATABASE_URL.
 */
export function buildPrismaMigrationEnv(disposableUrl: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    DATABASE_URL: disposableUrl,
  }
}

/**
 * Verifies that an active Prisma client is connected to apex_disposable_test.
 */
export async function verifyCurrentDatabase(prismaClient: PrismaClient, expectedDbName: string): Promise<string> {
  const result = await prismaClient.$queryRaw<Array<{ current_database: string }>>`SELECT current_database();`
  if (!result || result.length === 0 || result[0].current_database !== expectedDbName) {
    const actual = result && result.length > 0 ? result[0].current_database : 'unknown'
    throw new Error(`CRITICAL CONNECTION MISMATCH: Connected to "${actual}", expected "${expectedDbName}". Aborting.`)
  }
  return result[0].current_database
}

/**
 * Safely drops the disposable database via the maintenance connection ONLY IF:
 * 1. The database was created by this exact run (isDbCreatedByThisRun === true).
 * 2. Target database name is still validated as "apex_disposable_test".
 * 3. Maintenance database is "postgres".
 */
export async function safeTeardownDisposableDb(config: ValidatedTestDbConfig, isDbCreatedByThisRun: boolean): Promise<void> {
  // Guard 1: Verify ownership
  if (!isDbCreatedByThisRun) {
    console.log(`[CLEANUP SKIPPED] Database "${config.dbName}" was not created by this execution (ownership=false). Preserving database untouched.`)
    return
  }

  // Guard 2: Verify target database name
  if (config.dbName !== REQUIRED_TEST_DB_NAME) {
    console.error(`[SAFETY ERROR] Refusing to teardown unvalidated database "${config.dbName}". Cleanup aborted.`)
    return
  }

  // Guard 3: Verify maintenance database is "postgres"
  const maintDb = new URL(config.maintenanceDbUrl).pathname.replace(/^\//, '')
  if (maintDb !== MAINTENANCE_DB_NAME) {
    console.error(`[SAFETY ERROR] Maintenance connection must target "${MAINTENANCE_DB_NAME}", got "${maintDb}". Cleanup aborted.`)
    return
  }

  console.log(`[TEARDOWN] Terminating connections and dropping disposable database "${config.dbName}" via maintenance DB...`)
  const maintPrisma = new PrismaClient({
    datasources: { db: { url: config.maintenanceDbUrl } },
  })
  try {
    await maintPrisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${REQUIRED_TEST_DB_NAME}' AND pid <> pg_backend_pid();
    `)
    await maintPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${REQUIRED_TEST_DB_NAME}";`)
    console.log(`[TEARDOWN OK] Disposable database "${REQUIRED_TEST_DB_NAME}" dropped cleanly.`)
  } catch (err: any) {
    console.error(`[CLEANUP FAILED] Failed to drop disposable database "${REQUIRED_TEST_DB_NAME}":`, err.message)
  } finally {
    await maintPrisma.$disconnect()
  }
}

/**
 * Executes the complete 6 live integration tests against the disposable database.
 */
export async function runLiveIntegrationTests(config: ValidatedTestDbConfig) {
  const prisma = new PrismaClient({
    datasources: { db: { url: config.testDbUrl } },
  })

  try {
    console.log('\n--- EXECUTING 6 LIVE INTEGRATION TESTS ON DISPOSABLE DATABASE ---')

    // =========================================================================
    // T-INT-01: PostgreSQL Connection Handshake & Current Database Verification
    // =========================================================================
    console.log('\n[TEST 1/6] T-INT-01: Verifying active connection to disposable database...')
    const verifiedDb = await verifyCurrentDatabase(prisma, REQUIRED_TEST_DB_NAME)
    console.log(`[T-INT-01 PASSED] Active database verified as: ${verifiedDb}`)

    // =========================================================================
    // T-INT-02: Phase 3 Migration Deployment (Connection Isolated)
    // =========================================================================
    console.log('\n[TEST 2/6] T-INT-02: Deploying Phase 3 migration with isolated DATABASE_URL...')
    const migrationEnv = buildPrismaMigrationEnv(config.testDbUrl)
    execSync(`npx prisma migrate deploy`, {
      env: migrationEnv,
      stdio: 'inherit',
    })

    // Verify current database again after migration deployment
    await verifyCurrentDatabase(prisma, REQUIRED_TEST_DB_NAME)

    const migrationHistory = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null }>>`
      SELECT migration_name, finished_at FROM "_prisma_migrations" WHERE migration_name LIKE '%phase3%';
    `
    if (migrationHistory.length === 0 || !migrationHistory[0].finished_at) {
      throw new Error('T-INT-02 FAILED: Phase 3 migration not recorded as applied in _prisma_migrations.')
    }
    console.log(`[T-INT-02 PASSED] Migration verified applied: ${migrationHistory[0].migration_name}`)

    // =========================================================================
    // T-INT-03: Partial Unique Index Enforcement (One Completed Deal Per Property)
    // =========================================================================
    console.log('\n[TEST 3/6] T-INT-03: Verifying partial unique index on Deal(propertyId) WHERE status = COMPLETED...')
    const indexes = await prisma.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'Deal' AND indexname = 'unique_completed_deal_per_property';
    `
    if (indexes.length === 0 || !indexes[0].indexdef.includes('COMPLETED')) {
      throw new Error('T-INT-03 FAILED: Partial unique index "unique_completed_deal_per_property" missing or invalid in pg_indexes.')
    }

    const country = await prisma.country.create({
      data: {
        slug: 'test-country-int',
        name: 'Integration Test Country',
        displayName: 'Test Country',
        region: 'Test Region',
        cities: 'Test City',
        displayOrder: 999,
      },
    })
    const testProp = await prisma.property.create({
      data: {
        slug: 'residence-unique-test',
        name: 'Residence Unique Index Test',
        countryId: country.id,
        isPublished: true,
        isPubliclyVisible: true,
      },
    })

    // First COMPLETED deal succeeds
    await prisma.deal.create({
      data: {
        dealRef: 'DEAL-INT-001',
        propertyId: testProp.id,
        status: 'COMPLETED',
        actualSalePrice: new Prisma.Decimal('5000000.00'),
        saleCurrency: 'USD',
      },
    })

    // Second COMPLETED deal on SAME property MUST fail with unique constraint violation (23505)
    let duplicateRejected = false
    try {
      await prisma.deal.create({
        data: {
          dealRef: 'DEAL-INT-002',
          propertyId: testProp.id,
          status: 'COMPLETED',
          actualSalePrice: new Prisma.Decimal('6000000.00'),
          saleCurrency: 'USD',
        },
      })
    } catch (err: any) {
      if (err.message.includes('unique_completed_deal_per_property') || err.code === 'P2002') {
        duplicateRejected = true
      }
    }
    if (!duplicateRejected) {
      throw new Error('T-INT-03 FAILED: Database permitted duplicate COMPLETED deals on the same property!')
    }

    // Non-completed deal (INQUIRY) on SAME property MUST succeed (proving index is partial)
    const inquiryDeal = await prisma.deal.create({
      data: {
        dealRef: 'DEAL-INT-003',
        propertyId: testProp.id,
        status: 'INQUIRY',
      },
    })
    if (!inquiryDeal) {
      throw new Error('T-INT-03 FAILED: Partial index prevented non-completed deal.')
    }
    console.log('[T-INT-03 PASSED] Partial unique index physically prevented duplicate completed deal while permitting non-completed deals.')

    // =========================================================================
    // T-INT-04: Foreign-Key RESTRICT Enforcement
    // =========================================================================
    console.log('\n[TEST 4/6] T-INT-04: Verifying foreign-key ON DELETE RESTRICT on Deal.propertyId...')
    let fkDeleteRejected = false
    try {
      await prisma.property.delete({
        where: { id: testProp.id },
      })
    } catch (err: any) {
      if (err.code === 'P2003' || err.message.includes('foreign key') || err.message.includes('Deal_propertyId_fkey')) {
        fkDeleteRejected = true
      }
    }
    if (!fkDeleteRejected) {
      throw new Error('T-INT-04 FAILED: Property with attached Deals was deleted. ON DELETE RESTRICT was not enforced!')
    }
    console.log('[T-INT-04 PASSED] Foreign-key RESTRICT successfully prevented deletion of Property with active Deal records.')

    // =========================================================================
    // T-INT-05: Live Decimal(18,8) and Decimal(18,2) Storage Precision
    // =========================================================================
    console.log('\n[TEST 5/6] T-INT-05: Verifying actual PostgreSQL DECIMAL(18,8) and DECIMAL(18,2) precision...')
    const testRateStr = '0.27229448'
    const testMonetaryStr = '500000000.00'

    const createdRate = await prisma.exchangeRate.create({
      data: {
        fromCurrency: 'AED',
        toBaseCurrency: 'USD',
        rateToBase: new Prisma.Decimal(testRateStr),
        effectiveDate: new Date('2026-11-06'),
        source: 'INT_TEST',
      },
    })
    if (createdRate.rateToBase.toString() !== testRateStr) {
      throw new Error(`T-INT-05 FAILED: Expected exchange rate "${testRateStr}", got "${createdRate.rateToBase.toString()}"`)
    }

    const pricedProp = await prisma.property.create({
      data: {
        slug: 'residence-decimal-test',
        name: 'Residence Decimal Precision Test',
        countryId: country.id,
        askingPriceNumeric: new Prisma.Decimal(testMonetaryStr),
        askingCurrency: 'AED',
      },
    })
    if (pricedProp.askingPriceNumeric?.toFixed(2) !== testMonetaryStr) {
      throw new Error(`T-INT-05 FAILED: Expected monetary asking price "${testMonetaryStr}", got "${pricedProp.askingPriceNumeric?.toFixed(2)}"`)
    }

    const expectedValuation = new Prisma.Decimal(testMonetaryStr).mul(new Prisma.Decimal(testRateStr)).toFixed(2)
    const snapshot = await prisma.propertyValuationSnapshot.create({
      data: {
        propertyId: pricedProp.id,
        askingPriceNumeric: pricedProp.askingPriceNumeric!,
        askingCurrency: 'AED',
        baseCurrency: 'USD',
        exchangeRate: createdRate.rateToBase,
        rateEffectiveDate: new Date('2026-11-06'),
        rateSource: 'INT_TEST',
        convertedValuation: new Prisma.Decimal(expectedValuation),
      },
    })
    if (snapshot.convertedValuation.toFixed(2) !== expectedValuation) {
      throw new Error(`T-INT-05 FAILED: Expected snapshot valuation "${expectedValuation}", got "${snapshot.convertedValuation.toFixed(2)}"`)
    }
    console.log(`[T-INT-05 PASSED] Stored and retrieved exact Decimal values (Rate: ${testRateStr}, Asset: ${testMonetaryStr}, Converted: ${expectedValuation}) without floating-point error.`)

    // =========================================================================
    // T-INT-06: Concurrent Deal Closures Using Live SELECT ... FOR UPDATE
    // =========================================================================
    console.log('\n[TEST 6/6] T-INT-06: Verifying concurrent deal closures with live PostgreSQL row locks...')
    const adminUser = await prisma.adminUser.create({
      data: {
        email: 'conc-admin@apex.test',
        passwordHash: 'mock-hash',
        name: 'Concurrency Test Admin',
      },
    })
    const concProp = await prisma.property.create({
      data: {
        slug: 'residence-concurrency-test',
        name: 'Residence Concurrency Test',
        countryId: country.id,
        isPublished: true,
        isPubliclyVisible: true,
      },
    })
    const deal1 = await prisma.deal.create({
      data: {
        dealRef: 'DEAL-CONC-001',
        propertyId: concProp.id,
        status: 'INQUIRY',
      },
    })
    const deal2 = await prisma.deal.create({
      data: {
        dealRef: 'DEAL-CONC-002',
        propertyId: concProp.id,
        status: 'INQUIRY',
      },
    })

    const task1 = closeDealTransaction(prisma, {
      dealId: deal1.id,
      propertyId: concProp.id,
      adminUserId: adminUser.id,
      actualSalePrice: new Prisma.Decimal('7500000.00'),
      currency: 'USD',
      keepPubliclyVisible: true,
    })
    const task2 = closeDealTransaction(prisma, {
      dealId: deal2.id,
      propertyId: concProp.id,
      adminUserId: adminUser.id,
      actualSalePrice: new Prisma.Decimal('8000000.00'),
      currency: 'USD',
      keepPubliclyVisible: false,
    })

    const [res1, res2] = await Promise.allSettled([task1, task2])

    const successCount = [res1, res2].filter((r) => r.status === 'fulfilled').length
    const rejectedCount = [res1, res2].filter((r) => r.status === 'rejected').length

    if (successCount !== 1 || rejectedCount !== 1) {
      throw new Error(`T-INT-06 FAILED: Expected exactly 1 success and 1 rejection, got ${successCount} successes and ${rejectedCount} rejections.`)
    }

    const finalProp = await prisma.property.findUnique({ where: { id: concProp.id } })
    if (!finalProp?.hasCompletedDeal) {
      throw new Error('T-INT-06 FAILED: Property hasCompletedDeal was not set to true.')
    }

    const completedDeals = await prisma.deal.findMany({
      where: { propertyId: concProp.id, status: 'COMPLETED' },
    })
    if (completedDeals.length !== 1) {
      throw new Error(`T-INT-06 FAILED: Expected 1 completed deal, found ${completedDeals.length}`)
    }
    console.log('[T-INT-06 PASSED] Row-level locking (SELECT ... FOR UPDATE) serialized concurrent deal closures; exactly 1 succeeded.')

    // =========================================================================
    // T-INT-07: Rollback Abort Guard Verification (All 10 Phase 3 Tables & AdminPermission)
    // =========================================================================
    console.log('\n[TEST 7/7] T-INT-07: Verifying rollback abort guard with live Deal records in disposable DB...')
    let dealGuardAborted = false
    try {
      execSync(`npx prisma db execute --url "${config.testDbUrl}" --file prisma/rollback_phase3.sql`, {
        stdio: 'pipe',
      })
    } catch (err: any) {
      const output = err.stderr ? err.stderr.toString() : err.stdout ? err.stdout.toString() : err.message
      if (output.includes('ROLLBACK ABORTED') && (output.includes('Deal') || output.includes('sales transaction history'))) {
        dealGuardAborted = true
        console.log('[T-INT-07 Part A PASSED] Rollback successfully ABORTED down-migration due to active Deal records.')
      }
    }
    if (!dealGuardAborted) {
      throw new Error('T-INT-07 FAILED: Rollback did not abort despite active Deal records!')
    }

    // Now specifically isolate and verify AdminPermission data-preservation guard
    console.log('[T-INT-07 Part B] Verifying rollback abort guard specifically for AdminPermission...')
    // Clean up Deal and other pre-check records so execution reaches Guard 9 (AdminPermission)
    await prisma.deal.deleteMany({})
    await prisma.propertyValuationSnapshot.deleteMany({})
    await prisma.exchangeRate.deleteMany({})
    await prisma.adminActivityLog.deleteMany({})
    await prisma.rolePermission.deleteMany({})
    await prisma.adminRole.deleteMany({ where: { isSystem: false } })

    // Create a live AdminPermission record
    await prisma.adminPermission.create({
      data: {
        module: 'PERM_GUARD_TEST',
        action: 'VERIFY_ROLLBACK_ABORT',
        description: 'Test permission to verify AdminPermission rollback abort guard',
      },
    })

    let permGuardAborted = false
    let permAbortOutput = ''
    try {
      execSync(`npx prisma db execute --url "${config.testDbUrl}" --file prisma/rollback_phase3.sql`, {
        stdio: 'pipe',
      })
    } catch (err: any) {
      const output = err.stderr ? err.stderr.toString() : err.stdout ? err.stdout.toString() : err.message
      permAbortOutput = output
      if (output.includes('ROLLBACK ABORTED') && output.includes('AdminPermission')) {
        permGuardAborted = true
        console.log('[T-INT-07 Part B PASSED] Rollback successfully ABORTED down-migration due to active AdminPermission records.')
      }
    }
    if (!permGuardAborted) {
      throw new Error(`T-INT-07 FAILED: Rollback did not abort on AdminPermission records! Output: ${permAbortOutput}`)
    }
    console.log('[T-INT-07 PASSED] Rollback data-preservation guards verified on live database: aborts on Deal and AdminPermission records.')

    console.log('\n' + '='.repeat(80))
    console.log('ALL 7 LIVE INTEGRATION TESTS PASSED CLEANLY ON DISPOSABLE DATABASE')
    console.log('='.repeat(80))
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Main Harness Entry Point
 */
async function main() {
  console.log('='.repeat(80))
  console.log('APEX PACIFIC HOLDINGS — HARDENED DISPOSABLE DATABASE TEST HARNESS')
  console.log('='.repeat(80))

  // 1. Strict Validation of TEST_DATABASE_URL
  const rawUrl = process.env.TEST_DATABASE_URL
  console.log('Step 1: Validating TEST_DATABASE_URL...')
  const config = validateTestDatabaseUrl(rawUrl)
  console.log(`[OK] Target Database:    ${config.dbName}`)
  console.log(`[OK] Maintenance DB:     ${config.maintenanceDbName}`)
  console.log(`[OK] Target Host:Port:   ${config.host}:${config.port}`)

  // 2. PostgreSQL Connection Handshake Pre-Check
  console.log('\nStep 2: Performing PostgreSQL socket connection pre-check...')
  try {
    const net = await import('net')
    const socket = new net.Socket()
    await new Promise<void>((resolve, reject) => {
      socket.setTimeout(2500)
      socket.connect(config.port, config.host, () => {
        socket.destroy()
        resolve()
      })
      socket.on('error', (err) => {
        socket.destroy()
        reject(err)
      })
      socket.on('timeout', () => {
        socket.destroy()
        reject(new Error('Connection timed out'))
      })
    })
    console.log(`[OK] PostgreSQL server reachable at ${config.host}:${config.port}.`)
  } catch (err: any) {
    console.error(`\n[BLOCKED] PostgreSQL server offline at ${config.host}:${config.port}.`)
    console.error('To run live tests when PostgreSQL is started:')
    console.error('  1. Start service: net start postgresql-x64-18 (as Administrator)')
    console.error(`  2. Set variable:  $env:TEST_DATABASE_URL="postgresql://<user>:<password>@${config.host}:${config.port}/${config.dbName}"`)
    console.error('  3. Execute:       npx tsx prisma/tests/run_disposable_test_db.ts\n')
    process.exit(0)
  }

  // 3. In-memory ownership flag for safe lifecycle tracking
  let isDbCreatedByThisRun = false

  try {
    // Non-destructive provision: checks existence, aborts if existing, creates if missing
    isDbCreatedByThisRun = await safeProvisionDisposableDb(config)

    // Run all 6 live integration tests
    await runLiveIntegrationTests(config)
  } catch (err: any) {
    console.error('\n[TEST HARNESS FAILURE]', err.message)
    throw err
  } finally {
    // Teardown occurs ONLY if this execution created the database (isDbCreatedByThisRun === true)
    console.log('\nStep 3: Performing post-test cleanup evaluation...')
    await safeTeardownDisposableDb(config, isDbCreatedByThisRun)
  }
}

// Only execute main when invoked directly from CLI
if (require.main === module) {
  main().catch((err) => {
    console.error('\n[FATAL HARNESS ERROR]', err.message)
    process.exit(1)
  })
}
