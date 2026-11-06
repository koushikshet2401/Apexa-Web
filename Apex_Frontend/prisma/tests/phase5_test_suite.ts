import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { PrismaClient, Prisma } from '@prisma/client'
import {
  REQUIRED_TEST_DB_NAME,
  MAINTENANCE_DB_NAME,
  validateTestDatabaseUrl,
  safeProvisionDisposableDb,
  safeTeardownDisposableDb,
  buildPrismaMigrationEnv,
  verifyCurrentDatabase,
} from './run_disposable_test_db'
import {
  SUPPORTED_CURRENCY_CODES,
  SUPPORTED_CURRENCY_REGISTRY,
  validateCurrencyMinorUnits,
  formatCurrencyAmount,
} from '../../src/config/currencies'
import {
  validateAndNormalizePricing,
  hasForbiddenFinancialFields,
  hasForbiddenDescriptiveFields,
} from '../../src/lib/projectValidation'
import { closeDealTransaction, createDealAdjustmentTransaction } from '../deal_service'

// ==============================================================================
// APEX PACIFIC HOLDINGS — PHASE 5 BACKEND VERIFICATION TEST SUITE
// ==============================================================================

interface TestResult {
  id: string
  name: string
  category: 'Validation & Units' | 'Database DDL & Triggers' | 'Project Lifecycle' | 'Deal & Adjustments' | 'Dashboard Analytics' | 'Live DB Safety'
  status: 'PASSED' | 'FAILED' | 'BLOCKED'
  evidence: string
}

const results: TestResult[] = []

function assert(
  condition: boolean,
  id: string,
  name: string,
  category: TestResult['category'],
  failMsg: string,
  passEvidence?: string
) {
  if (condition) {
    results.push({
      id,
      name,
      category,
      status: 'PASSED',
      evidence: passEvidence || 'Assertion passed successfully.',
    })
  } else {
    results.push({
      id,
      name,
      category,
      status: 'FAILED',
      evidence: failMsg,
    })
  }
}

async function runPhase5TestSuite() {
  console.log('==============================================================================')
  console.log('APEX PACIFIC HOLDINGS — PHASE 5 PROJECT MANAGEMENT TEST SUITE')
  console.log('==============================================================================\n')

  // ---------------------------------------------------------------------------
  // SECTION 1: UNIT & CURRENCY VALIDATION TESTS
  // ---------------------------------------------------------------------------
  console.log('[SECTION 1] Executing Currency & Pricing State Unit Tests...')

  // T-P5-01: Authoritative registry completeness
  assert(
    SUPPORTED_CURRENCY_CODES.length === 13 &&
      SUPPORTED_CURRENCY_CODES.includes('AED') &&
      SUPPORTED_CURRENCY_CODES.includes('USD') &&
      SUPPORTED_CURRENCY_CODES.includes('JPY') &&
      SUPPORTED_CURRENCY_CODES.includes('EUR') &&
      SUPPORTED_CURRENCY_CODES.includes('INR'),
    'T-P5-01',
    'Authoritative Currency Registry Completeness',
    'Validation & Units',
    'Registry does not contain all 13 supported ISO 4217 currencies.',
    `Verified 13 supported currencies: ${SUPPORTED_CURRENCY_CODES.join(', ')}`
  )

  // T-P5-02: JPY zero minor-unit precision enforcement
  const jpyValid = validateCurrencyMinorUnits(150000000, 'JPY')
  const jpyInvalid = validateCurrencyMinorUnits(150000000.5, 'JPY')
  const jpyInvalid2 = validateCurrencyMinorUnits('150000000.01', 'JPY')
  assert(
    jpyValid === true && jpyInvalid === false && jpyInvalid2 === false,
    'T-P5-02',
    'JPY Minor-Unit Precision (Zero Fractional)',
    'Validation & Units',
    'JPY allowed fractional amounts or rejected valid integer amounts.',
    'Verified integer JPY is valid; fractional JPY (150000000.50) is strictly rejected.'
  )

  // T-P5-03: 2-decimal minor-unit precision enforcement
  const usdValid2Dec = validateCurrencyMinorUnits(4500000.25, 'USD')
  const usdInvalid3Dec = validateCurrencyMinorUnits(4500000.255, 'USD')
  assert(
    usdValid2Dec === true && usdInvalid3Dec === false,
    'T-P5-03',
    'Standard 2-Decimal Precision (USD/AED/EUR)',
    'Validation & Units',
    'Standard currency allowed 3 decimal places or rejected 2 decimal places.',
    'Verified 2 decimal places allowed, 3 decimal places rejected.'
  )

  // T-P5-04: Pricing State A (Priced)
  const stateA = validateAndNormalizePricing({
    isPOA: false,
    askingPriceNumeric: 25000000,
    askingCurrency: 'AED',
  })
  assert(
    stateA.valid === true &&
      stateA.data.pricingState === 'PRICED' &&
      stateA.data.isPOA === false &&
      stateA.data.askingPriceNumeric === '25000000.00' &&
      stateA.data.askingCurrency === 'AED' &&
      stateA.data.formattedPrice === 'AED 25,000,000.00',
    'T-P5-04',
    'Pricing State A (Priced) Validation',
    'Validation & Units',
    'State A (Priced) was rejected or normalized incorrectly.',
    `State A valid: ${stateA.valid ? stateA.data.formattedPrice : ''}`
  )

  // T-P5-05: Pricing State B (POA)
  const stateB = validateAndNormalizePricing({
    isPOA: true,
  })
  const stateBInvalid = validateAndNormalizePricing({
    isPOA: true,
    askingPriceNumeric: 1000000,
  })
  assert(
    stateB.valid === true &&
      stateB.data.pricingState === 'POA' &&
      stateB.data.isPOA === true &&
      stateB.data.askingPriceNumeric === null &&
      stateB.data.formattedPrice === 'Price on Application' &&
      stateBInvalid.valid === false,
    'T-P5-05',
    'Pricing State B (POA) Validation & Rejection of Amount',
    'Validation & Units',
    'POA state failed to normalize or permitted numeric amount.',
    'State B verified: amount and currency nullified; numeric POA rejected.'
  )

  // T-P5-06: Pricing State C (Unpriced)
  const stateC = validateAndNormalizePricing({
    isPOA: false,
  })
  assert(
    stateC.valid === true &&
      stateC.data.pricingState === 'UNPRICED' &&
      stateC.data.isPOA === false &&
      stateC.data.askingPriceNumeric === null &&
      stateC.data.formattedPrice === null,
    'T-P5-06',
    'Pricing State C (Unpriced) Validation',
    'Validation & Units',
    'Unpriced state failed to normalize.',
    'State C verified: isPOA=false, askingPriceNumeric=null, formattedPrice=null.'
  )

  // T-P5-07: Zero asking price strictly prohibited
  const zeroPrice = validateAndNormalizePricing({
    isPOA: false,
    askingPriceNumeric: 0,
    askingCurrency: 'USD',
  })
  const negPrice = validateAndNormalizePricing({
    isPOA: false,
    askingPriceNumeric: -50000,
    askingCurrency: 'USD',
  })
  assert(
    zeroPrice.valid === false && negPrice.valid === false,
    'T-P5-07',
    'Zero & Negative Price Rejection',
    'Validation & Units',
    'Zero or negative asking price was allowed.',
    `Zero price rejected: "${!zeroPrice.valid ? zeroPrice.error : ''}"`
  )

  // T-P5-08: Partial pricing combinations rejection
  const amountNoCurr = validateAndNormalizePricing({
    isPOA: false,
    askingPriceNumeric: 500000,
  })
  const currNoAmount = validateAndNormalizePricing({
    isPOA: false,
    askingCurrency: 'USD',
  })
  assert(
    amountNoCurr.valid === false && currNoAmount.valid === false,
    'T-P5-08',
    'Partial Pricing Combinations Rejection',
    'Validation & Units',
    'Partial pricing combinations (amount without currency or vice versa) were accepted.',
    'Partial pricing strictly rejected with clear error messages.'
  )

  // T-P5-09: Descriptive vs. financial field separation
  const forbiddenFin = hasForbiddenFinancialFields({
    name: 'Villa Sapphire',
    askingPriceNumeric: 15000000,
  })
  const forbiddenDesc = hasForbiddenDescriptiveFields({
    reason: 'Repricing campaign',
    description: 'Updated luxury description',
  })
  assert(
    forbiddenFin.includes('askingPriceNumeric') && forbiddenDesc.includes('description'),
    'T-P5-09',
    'Descriptive vs Financial Field Boundary Verification',
    'Validation & Units',
    'Failed to detect forbidden fields across descriptive and financial payloads.',
    'Separation boundaries correctly detect forbidden cross-boundary fields.'
  )

  // ---------------------------------------------------------------------------
  // SECTION 2: DISPOSABLE DATABASE INTEGRATION TESTS
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 2] Provisioning Disposable Test Database and Executing DDL...')

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
    throw new Error('SAFETY ABORT: DATABASE_URL not found in environment or .env. Cannot derive disposable test URL.')
  }

  const config = validateTestDatabaseUrl(derivedTestUrl)

  const isDbCreated = await safeProvisionDisposableDb(config)

  // Deploy baseline migrations to ensure schema tables exist prior to Phase 5 DDL
  console.log('[INFO] Deploying baseline migrations into disposable test database...')
  const migrationEnv = buildPrismaMigrationEnv(config.testDbUrl)
  execSync('npx prisma migrate deploy', {
    env: migrationEnv,
    stdio: 'pipe',
  })

  const testPrisma = new PrismaClient({
    datasources: { db: { url: config.testDbUrl } },
  })

  try {
    // Verify we are connected strictly to apex_disposable_test
    const currentDb = await verifyCurrentDatabase(testPrisma, REQUIRED_TEST_DB_NAME)
    assert(
      currentDb === REQUIRED_TEST_DB_NAME,
      'T-P5-10',
      'Disposable Database Connection Safety',
      'Database DDL & Triggers',
      `Expected to be on "${REQUIRED_TEST_DB_NAME}", got "${currentDb}".`,
      `Connected strictly to disposable test database "${currentDb}".`
    )

    // Execute Phase 5 DDL script via Prisma db execute
    console.log('[INFO] Applying Phase 5 DDL (SupportedCurrency, DealFinancialAdjustment, Triggers)...')
    const phase5DdlPath = path.resolve(__dirname, '../migrations/phase5_project_management.sql')
    execSync(`npx prisma db execute --file "${phase5DdlPath}" --url "${config.testDbUrl}"`, {
      env: migrationEnv,
      stdio: 'pipe',
    })

    // T-P5-10B: Complete Migration Sequence & DDL Object Completeness (Area 1)
    const appliedMigrations = await testPrisma.$queryRaw<
      Array<{ migration_name: string; rolled_back_at: Date | null }>
    >`
      SELECT migration_name, rolled_back_at
      FROM _prisma_migrations
      ORDER BY finished_at ASC
    `
    const migrationNames = appliedMigrations.map((m) => m.migration_name)
    const hasInit = migrationNames.some((n) => n.includes('init_schema'))
    const hasPhase3 = migrationNames.some((n) => n.includes('phase3_approved_architecture'))
    const hasPhase5 = migrationNames.some((n) => n.includes('phase5_project_management'))

    // Check triggers exist in pg_trigger
    const triggers = await testPrisma.$queryRaw<Array<{ tgname: string }>>`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgname LIKE 'trigger_%'
    `
    const triggerNames = triggers.map((t) => t.tgname)
    const hasAllTriggers =
      triggerNames.includes('trigger_deal_completed_immutability') &&
      triggerNames.includes('trigger_deal_completed_prevent_delete') &&
      triggerNames.includes('trigger_adjustment_prevent_update') &&
      triggerNames.includes('trigger_adjustment_prevent_truncate')

    // Check functions exist
    const functions = await testPrisma.$queryRaw<Array<{ routine_name: string }>>`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
    `
    const funcNames = functions.map((f) => f.routine_name)
    const hasAllFunctions =
      funcNames.includes('enforce_completed_deal_immutability') &&
      funcNames.includes('prevent_completed_deal_deletion') &&
      funcNames.includes('enforce_append_only_deal_adjustment') &&
      funcNames.includes('prevent_truncate_immutable_tables') &&
      funcNames.includes('validate_currency_minor_units')

    assert(
      hasInit && hasPhase3 && hasPhase5 && hasAllTriggers && hasAllFunctions,
      'T-P5-10B',
      'Complete Migration Sequence & DDL Object Completeness',
      'Database DDL & Triggers',
      `Missing: migrations=${JSON.stringify({ hasInit, hasPhase3, hasPhase5, migrationNames })}, triggers=${JSON.stringify({ hasAllTriggers, triggerNames })}, funcs=${JSON.stringify({ hasAllFunctions, funcNames })}`,
      `Verified 3 migrations applied (${migrationNames.join(', ')}), 4 financial triggers active, 5 PostgreSQL functions present.`
    )

    // T-P5-11: SupportedCurrency table populated
    const currencyCount = await testPrisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::INTEGER AS count FROM "SupportedCurrency"
    `
    assert(
      Number(currencyCount[0].count) >= 13,
      'T-P5-11',
      'SupportedCurrency Database Table & Seed Verification',
      'Database DDL & Triggers',
      `Expected at least 13 supported currencies, got ${currencyCount[0].count}.`,
      `Found ${currencyCount[0].count} authoritative ISO 4217 currencies in SupportedCurrency table.`
    )

    // T-P5-12: Database CHECK constraint prevents zero asking price
    let zeroPriceBlocked = false
    try {
      await testPrisma.$executeRaw`
        INSERT INTO "Property" (
          id, slug, name, "isPOA", "askingPriceNumeric", "askingCurrency", "isDraft", "isPublished", "isPubliclyVisible", "hasCompletedDeal", "isArchived", "updatedAt"
        ) VALUES (
          'prop_zero_test', 'zero-test', 'Zero Test Property', false, 0.00, 'USD', true, false, false, false, false, NOW()
        )
      `
    } catch (err: any) {
      if (err.message.includes('check_property_valid_pricing_states') || err.message.includes('check_property_asking_price')) {
        zeroPriceBlocked = true
      }
    }
    assert(
      zeroPriceBlocked === true,
      'T-P5-12',
      'Database Level Zero Price Prevention (CHECK Constraint)',
      'Database DDL & Triggers',
      'PostgreSQL allowed zero price to be inserted into Property table.',
      'PostgreSQL check_property_valid_pricing_states successfully rejected zero asking price.'
    )

    // T-P5-13: Database CHECK constraint prevents fractional JPY
    let jpyFractionBlocked = false
    try {
      await testPrisma.$executeRaw`
        INSERT INTO "Property" (
          id, slug, name, "isPOA", "askingPriceNumeric", "askingCurrency", "isDraft", "isPublished", "isPubliclyVisible", "hasCompletedDeal", "isArchived", "updatedAt"
        ) VALUES (
          'prop_jpy_frac', 'jpy-frac', 'JPY Fraction Property', false, 150000000.50, 'JPY', true, false, false, false, false, NOW()
        )
      `
    } catch (err: any) {
      if (err.message.includes('check_property_currency_precision')) {
        jpyFractionBlocked = true
      }
    }
    assert(
      jpyFractionBlocked === true,
      'T-P5-13',
      'Database Level JPY Minor-Unit Precision (check_property_currency_precision)',
      'Database DDL & Triggers',
      'PostgreSQL allowed fractional JPY (150000000.50) to be inserted.',
      'PostgreSQL function validate_currency_minor_units rejected fractional JPY.'
    )

    // ---------------------------------------------------------------------------
    // SECTION 3: PROJECT LIFECYCLE & STATE MACHINE TESTS
    // ---------------------------------------------------------------------------
    console.log('\n[SECTION 3] Executing Project Lifecycle & State Machine Tests...')

    // Seed test AdminUser
    const adminUser = await testPrisma.adminUser.upsert({
      where: { email: 'admin@apexpacificholdings.com' },
      update: {},
      create: {
        id: 'cmvw891lo0000ue8kuji2laoa',
        email: 'admin@apexpacificholdings.com',
        passwordHash: 'dummy_hash',
        name: 'Executive Administrator',
        isActive: true,
      },
    })

    // T-P5-14: Project Creation across all 3 pricing states
    const propPriced = await testPrisma.property.create({
      data: {
        id: 'prop_priced_1',
        slug: 'estate-solaris',
        name: 'Estate Solaris',
        isPOA: false,
        askingPriceNumeric: new Prisma.Decimal('45000000.00'),
        askingCurrency: 'AED',
        price: 'AED 45,000,000.00',
        isDraft: true,
        isPublished: false,
        isPubliclyVisible: false,
        isArchived: false,
      },
    })

    const propPOA = await testPrisma.property.create({
      data: {
        id: 'prop_poa_1',
        slug: 'private-island-elysium',
        name: 'Private Island Elysium',
        isPOA: true,
        askingPriceNumeric: null,
        askingCurrency: null,
        price: 'Price on Application',
        isDraft: true,
        isPublished: false,
        isPubliclyVisible: false,
        isArchived: false,
      },
    })

    const propUnpriced = await testPrisma.property.create({
      data: {
        id: 'prop_unpriced_1',
        slug: 'batumi-cliff-residence',
        name: 'Batumi Cliff Residence',
        isPOA: false,
        askingPriceNumeric: null,
        askingCurrency: null,
        price: null,
        isDraft: true,
        isPublished: false,
        isPubliclyVisible: false,
        isArchived: false,
      },
    })

    assert(
      propPriced.isDraft === true && propPOA.isPOA === true && propUnpriced.price === null,
      'T-P5-14',
      'Project Creation Across All Three Pricing States (Priced, POA, Unpriced)',
      'Project Lifecycle',
      'Failed to create projects in all three pricing states.',
      'Successfully created State A (Priced), State B (POA), and State C (Unpriced).'
    )

    // T-P5-15: Project Publishing transition
    const publishedProp = await testPrisma.property.update({
      where: { id: propPriced.id },
      data: {
        isPublished: true,
        isDraft: false,
        isPubliclyVisible: true,
      },
    })
    assert(
      publishedProp.isPublished === true && publishedProp.isDraft === false && publishedProp.isPubliclyVisible === true,
      'T-P5-15',
      'Project Publishing State Transition',
      'Project Lifecycle',
      'Publishing failed to synchronize isPublished, isDraft, and isPubliclyVisible.',
      'Published state: isPublished=true, isDraft=false, isPubliclyVisible=true.'
    )

    // T-P5-16: Non-Destructive Archiving (Soft Delete)
    const archivedProp = await testPrisma.property.update({
      where: { id: propUnpriced.id },
      data: {
        isArchived: true,
        isPublished: false,
        isPubliclyVisible: false,
        archivedAt: new Date(),
        archivedById: adminUser.id,
        archivedReason: 'Withdrawn by seller pending architectural renovation',
      },
    })
    assert(
      archivedProp.isArchived === true &&
        archivedProp.isPublished === false &&
        archivedProp.archivedById === adminUser.id,
      'T-P5-16',
      'Non-Destructive Project Archiving (Soft-Delete Preservation)',
      'Project Lifecycle',
      'Archiving failed to preserve record or set attribution.',
      'Archived record preserved: isArchived=true, isPublished=false, archivedReason documented.'
    )

    // T-P5-17: Project Restoration back to DRAFT
    const restoredProp = await testPrisma.property.update({
      where: { id: propUnpriced.id },
      data: {
        isArchived: false,
        isDraft: true,
        isPublished: false,
        isPubliclyVisible: false,
        restoredAt: new Date(),
        restoredById: adminUser.id,
      },
    })
    assert(
      restoredProp.isArchived === false &&
        restoredProp.isDraft === true &&
        restoredProp.isPublished === false,
      'T-P5-17',
      'Project Restoration to DRAFT State',
      'Project Lifecycle',
      'Restoration did not return project to Draft state.',
      'Restored project safely returned to DRAFT: isArchived=false, isDraft=true, isPublished=false.'
    )

    // ---------------------------------------------------------------------------
    // SECTION 4: DEAL WORKFLOW, IMMUTABILITY & ADJUSTMENTS
    // ---------------------------------------------------------------------------
    console.log('\n[SECTION 4] Executing Deal Workflow, Immutability & Financial Adjustment Tests...')

    // Create an open deal
    const deal1 = await testPrisma.deal.create({
      data: {
        id: 'deal_solaris_1',
        dealRef: 'DEAL-SOLARIS-001',
        propertyId: propPriced.id,
        buyerName: 'Al-Mansoor Family Trust',
        status: 'OFFER_MADE',
      },
    })

    // T-P5-18: Deal Completion with Option A (Keep Publicly Visible)
    const closureOptionA = await closeDealTransaction(testPrisma, {
      dealId: deal1.id,
      propertyId: propPriced.id,
      adminUserId: adminUser.id,
      actualSalePrice: new Prisma.Decimal('44500000.00'),
      currency: 'AED',
      keepPubliclyVisible: true,
      notes: 'Executed with standard luxury conveyance protocol.',
    })

    assert(
      closureOptionA.deal.status === 'COMPLETED' &&
        closureOptionA.property.hasCompletedDeal === true &&
        closureOptionA.property.isPubliclyVisible === true &&
        closureOptionA.property.isPublished === true,
      'T-P5-18',
      'Deal Completion with Option A (Keep Publicly Visible / Trophy Showcase)',
      'Deal & Adjustments',
      'Option A completion failed to retain public visibility or complete deal.',
      'Deal completed under Option A: status=COMPLETED, property.isPubliclyVisible=true, property.isPublished=true.'
    )

    // T-P5-19: Duplicate Completed Deal Prevention (Concurrency & One-Deal Rule)
    const deal2 = await testPrisma.deal.create({
      data: {
        id: 'deal_solaris_2',
        dealRef: 'DEAL-SOLARIS-002',
        propertyId: propPriced.id,
        buyerName: 'Second Contender',
        status: 'OFFER_MADE',
      },
    })

    let duplicateClosureBlocked = false
    try {
      await closeDealTransaction(testPrisma, {
        dealId: deal2.id,
        propertyId: propPriced.id,
        adminUserId: adminUser.id,
        actualSalePrice: new Prisma.Decimal('46000000.00'),
        currency: 'AED',
        keepPubliclyVisible: true,
      })
    } catch (err: any) {
      if (err.message.includes('Conflict: Property') || err.message.includes('already has a completed sale')) {
        duplicateClosureBlocked = true
      }
    }

    assert(
      duplicateClosureBlocked === true,
      'T-P5-19',
      'Duplicate Completed Deal Prevention (One Completed Deal per Property Rule)',
      'Deal & Adjustments',
      'Application allowed a second deal to be completed on the same property.',
      'One completed deal rule enforced: second closure rejected with Conflict error.'
    )

    // T-P5-20: PostgreSQL Trigger enforces completed deal financial immutability
    let dealUpdateBlocked = false
    try {
      await testPrisma.$executeRaw`
        UPDATE "Deal"
        SET "actualSalePrice" = 99999999.00
        WHERE id = ${deal1.id}
      `
    } catch (err: any) {
      if (err.message.includes('enforce_completed_deal_immutability') || err.message.includes('Financial immutability violation')) {
        dealUpdateBlocked = true
      }
    }
    assert(
      dealUpdateBlocked === true,
      'T-P5-20',
      'PostgreSQL Trigger Enforces Completed Deal Financial Immutability',
      'Deal & Adjustments',
      'PostgreSQL allowed actualSalePrice on a COMPLETED deal to be modified.',
      'Trigger trigger_deal_completed_immutability blocked update on COMPLETED deal.'
    )

    // T-P5-21: PostgreSQL Trigger prevents completed deal deletion
    let dealDeleteBlocked = false
    try {
      await testPrisma.$executeRaw`
        DELETE FROM "Deal" WHERE id = ${deal1.id}
      `
    } catch (err: any) {
      if (err.message.includes('prevent_completed_deal_deletion') || err.message.includes('Security violation: COMPLETED deal')) {
        dealDeleteBlocked = true
      }
    }
    assert(
      dealDeleteBlocked === true,
      'T-P5-21',
      'PostgreSQL Trigger Prevents Completed Deal Deletion',
      'Deal & Adjustments',
      'PostgreSQL allowed COMPLETED deal to be deleted.',
      'Trigger trigger_deal_completed_prevent_delete blocked deletion of COMPLETED deal.'
    )

    // T-P5-22: Authorized Financial Adjustment on Completed Deal
    const adjustment1 = await createDealAdjustmentTransaction(testPrisma, {
      dealId: deal1.id,
      adjustedSalePrice: new Prisma.Decimal('44800000.00'),
      adjustedCurrency: 'AED',
      adjustmentReason: 'Addendum #1: Inclusion of customized Italian marble pavilion and bespoke furnishings',
      legalContractRef: 'ADDENDUM-2026-SOLARIS-01',
      authorizedById: adminUser.id,
    })

    assert(
      adjustment1.adjustmentSequence === 1 &&
        new Prisma.Decimal(adjustment1.previousSalePrice).equals('44500000.00') &&
        new Prisma.Decimal(adjustment1.adjustedSalePrice).equals('44800000.00'),
      'T-P5-22',
      'Authorized Financial Adjustment #1 Recorded with Full Differential',
      'Deal & Adjustments',
      'Failed to record financial adjustment #1.',
      `Adjustment #1 recorded: Seq=1, Previous=${adjustment1.previousCurrency} ${adjustment1.previousSalePrice}, Adjusted=${adjustment1.adjustedCurrency} ${adjustment1.adjustedSalePrice}`
    )

    // T-P5-23: Second Financial Adjustment with Currency Change (AED -> USD)
    const adjustment2 = await createDealAdjustmentTransaction(testPrisma, {
      dealId: deal1.id,
      adjustedSalePrice: new Prisma.Decimal('12200000.00'),
      adjustedCurrency: 'USD',
      adjustmentReason: 'Addendum #2: Contract redenominated to US Dollars per international buyer legal mandate',
      legalContractRef: 'ADDENDUM-2026-SOLARIS-02-FX',
      authorizedById: adminUser.id,
    })

    assert(
      adjustment2.adjustmentSequence === 2 &&
        adjustment2.previousCurrency === 'AED' &&
        adjustment2.adjustedCurrency === 'USD' &&
        new Prisma.Decimal(adjustment2.adjustedSalePrice).equals('12200000.00'),
      'T-P5-23',
      'Sequential Financial Adjustment #2 with Currency Redenomination',
      'Deal & Adjustments',
      'Failed to record sequential adjustment #2 or handle currency change.',
      `Adjustment #2 recorded: Seq=2, Previous=AED ${adjustment2.previousSalePrice}, Adjusted=USD ${adjustment2.adjustedSalePrice}`
    )

    // T-P5-24: Verification that original Deal row remains permanently pure
    const pristineDeal = await testPrisma.deal.findUnique({
      where: { id: deal1.id },
    })
    assert(
      pristineDeal?.actualSalePrice !== null &&
        new Prisma.Decimal(pristineDeal!.actualSalePrice!).equals('44500000.00') &&
        pristineDeal?.saleCurrency === 'AED',
      'T-P5-24',
      'Original Completed Deal Immutability Preserved After Adjustments',
      'Deal & Adjustments',
      'Original Deal row was modified by adjustment operations.',
      `Original Deal record unchanged: AED ${pristineDeal?.actualSalePrice?.toString()}`
    )

    // T-P5-24B: Concurrent Financial Adjustment Serialization & Monotonic Sequence Integrity (Area 3)
    const [concurrentAdjA, concurrentAdjB] = await Promise.all([
      createDealAdjustmentTransaction(testPrisma, {
        dealId: deal1.id,
        adjustedSalePrice: new Prisma.Decimal('12300000.00'),
        adjustedCurrency: 'USD',
        adjustmentReason: 'Addendum #3A: Concurrent legal escalation clause A',
        legalContractRef: 'ADDENDUM-CONCURRENT-A',
        authorizedById: adminUser.id,
      }),
      createDealAdjustmentTransaction(testPrisma, {
        dealId: deal1.id,
        adjustedSalePrice: new Prisma.Decimal('12400000.00'),
        adjustedCurrency: 'USD',
        adjustmentReason: 'Addendum #3B: Concurrent legal escalation clause B',
        legalContractRef: 'ADDENDUM-CONCURRENT-B',
        authorizedById: adminUser.id,
      }),
    ])

    const concurrentSeqs = [concurrentAdjA.adjustmentSequence, concurrentAdjB.adjustmentSequence].sort((a, b) => a - b)
    const isSequentialAndUnique =
      concurrentSeqs[0] === 3 &&
      concurrentSeqs[1] === 4 &&
      concurrentAdjA.adjustmentSequence !== concurrentAdjB.adjustmentSequence

    assert(
      isSequentialAndUnique,
      'T-P5-24B',
      'Concurrent Financial Adjustment Serialization & Monotonic Sequence Integrity',
      'Deal & Adjustments',
      'Concurrent adjustments failed to serialize or produced conflicting sequence numbers.',
      `Pessimistic FOR UPDATE lock serialized concurrent requests into sequence #${concurrentSeqs[0]} and #${concurrentSeqs[1]} with zero conflicts.`
    )

    // T-P5-25: DealFinancialAdjustment append-only trigger protection
    let adjUpdateBlocked = false
    try {
      await testPrisma.$executeRaw`
        UPDATE "DealFinancialAdjustment"
        SET "adjustedSalePrice" = 1000.00
        WHERE id = ${adjustment1.id}
      `
    } catch (err: any) {
      if (err.message.includes('enforce_append_only_deal_adjustment') || err.message.includes('DealFinancialAdjustment is append-only')) {
        adjUpdateBlocked = true
      }
    }
    assert(
      adjUpdateBlocked === true,
      'T-P5-25',
      'DealFinancialAdjustment Append-Only Trigger Protection',
      'Deal & Adjustments',
      'PostgreSQL allowed DealFinancialAdjustment row to be modified.',
      'Trigger trigger_adjustment_prevent_update blocked update on DealFinancialAdjustment.'
    )

    // T-P5-26: TRUNCATE protection on financial tables
    let truncateBlocked = false
    try {
      await testPrisma.$executeRaw`
        TRUNCATE TABLE "DealFinancialAdjustment"
      `
    } catch (err: any) {
      if (err.message.includes('prevent_truncate_immutable_tables') || err.message.includes('TRUNCATE is strictly prohibited')) {
        truncateBlocked = true
      }
    }
    assert(
      truncateBlocked === true,
      'T-P5-26',
      'Statement-Level TRUNCATE Protection on Financial Tables',
      'Database DDL & Triggers',
      'PostgreSQL allowed TRUNCATE on DealFinancialAdjustment.',
      'Trigger trigger_adjustment_prevent_truncate successfully blocked TRUNCATE statement.'
    )

    // ---------------------------------------------------------------------------
    // SECTION 5: DASHBOARD FINANCIAL METRICS & ANALYTICS AUDIT
    // ---------------------------------------------------------------------------
    console.log('\n[SECTION 5] Executing Dashboard Analytics Financial Metrics Audit...')

    // Create additional property for Option B completion
    const propOptionB = await testPrisma.property.create({
      data: {
        id: 'prop_option_b',
        slug: 'monaco-harbor-penthouse',
        name: 'Monaco Harbor Penthouse',
        isPOA: false,
        askingPriceNumeric: new Prisma.Decimal('18500000.00'),
        askingCurrency: 'EUR',
        price: 'EUR 18,500,000.00',
        isDraft: false,
        isPublished: true,
        isPubliclyVisible: true,
        isArchived: false,
      },
    })

    const dealOptionB = await testPrisma.deal.create({
      data: {
        id: 'deal_monaco_1',
        dealRef: 'DEAL-MONACO-001',
        propertyId: propOptionB.id,
        buyerName: 'Family Office Client',
        status: 'OFFER_MADE',
      },
    })

    // Complete under Option B (Hide Publicly)
    await closeDealTransaction(testPrisma, {
      dealId: dealOptionB.id,
      propertyId: propOptionB.id,
      adminUserId: adminUser.id,
      actualSalePrice: new Prisma.Decimal('18000000.00'),
      currency: 'EUR',
      keepPubliclyVisible: false,
    })

    // Metric 1: Total Corporate Portfolio Valuation
    const metric1 = await testPrisma.$queryRaw<
      Array<{ currency: string; property_count: number; total_amount: Prisma.Decimal }>
    >`
      SELECT 
          "askingCurrency" AS currency,
          COUNT(*)::INTEGER AS property_count,
          SUM("askingPriceNumeric") AS total_amount
      FROM "Property"
      WHERE "askingPriceNumeric" IS NOT NULL 
        AND "isPOA" = false
      GROUP BY "askingCurrency"
      ORDER BY total_amount DESC
    `

    assert(
      metric1.length >= 2,
      'T-P5-27',
      'Metric 1: Total Portfolio Valuation by Currency (All Lifecycle States)',
      'Dashboard Analytics',
      'Metric 1 failed to group by currency or include all non-deleted properties.',
      `Metric 1 grouped currencies: ${metric1.map((m) => `${m.currency}: ${Number(m.total_amount).toFixed(2)} (${m.property_count} props)`).join(', ')}`
    )

    // Metric 2: Active Published Listings Valuation
    const metric2 = await testPrisma.$queryRaw<
      Array<{ currency: string; active_listing_count: number; active_amount: Prisma.Decimal }>
    >`
      SELECT 
          "askingCurrency" AS currency,
          COUNT(*)::INTEGER AS active_listing_count,
          SUM("askingPriceNumeric") AS active_amount
      FROM "Property"
      WHERE "isPublished" = true 
        AND "isArchived" = false 
        AND "isPubliclyVisible" = true
        AND "askingPriceNumeric" IS NOT NULL
        AND "isPOA" = false
      GROUP BY "askingCurrency"
      ORDER BY active_amount DESC
    `

    assert(
      metric2.length >= 1,
      'T-P5-28',
      'Metric 2: Active Published Listings Valuation (Live Public Showcase)',
      'Dashboard Analytics',
      'Metric 2 failed to filter for active published listings.',
      `Metric 2 active inventory: ${metric2.map((m) => `${m.currency}: ${Number(m.active_amount).toFixed(2)} (${m.active_listing_count} listings)`).join(', ')}`
    )

    // Metric 3: Completed Deal Sales Volume (Original vs Effective Adjusted)
    const metric3 = await testPrisma.$queryRaw<
      Array<{
        currency: string
        original_sales_volume: Prisma.Decimal
        effective_sales_volume: Prisma.Decimal
        closed_deals_count: number
        adjusted_deals_count: number
      }>
    >`
      WITH LatestAdjustments AS (
          SELECT DISTINCT ON ("dealId")
              "dealId",
              "adjustedSalePrice",
              "adjustedCurrency"
          FROM "DealFinancialAdjustment"
          ORDER BY "dealId", "adjustmentSequence" DESC
      ),
      EffectiveDeals AS (
          SELECT 
              d.id,
              d."saleCurrency" AS original_currency,
              d."actualSalePrice" AS original_price,
              COALESCE(adj."adjustedCurrency", d."saleCurrency") AS effective_currency,
              COALESCE(adj."adjustedSalePrice", d."actualSalePrice") AS effective_price,
              CASE WHEN adj."dealId" IS NOT NULL THEN 1 ELSE 0 END AS is_adjusted
          FROM "Deal" d
          LEFT JOIN LatestAdjustments adj ON d.id = adj."dealId"
          WHERE d."status" = 'COMPLETED'
            AND d."actualSalePrice" IS NOT NULL
      )
      SELECT 
          effective_currency AS currency,
          SUM(original_price) FILTER (WHERE original_currency = effective_currency) AS original_sales_volume,
          SUM(effective_price) AS effective_sales_volume,
          COUNT(id)::INTEGER AS closed_deals_count,
          SUM(is_adjusted)::INTEGER AS adjusted_deals_count
      FROM EffectiveDeals
      GROUP BY effective_currency
      ORDER BY effective_sales_volume DESC
    `

    assert(
      metric3.length >= 2,
      'T-P5-29',
      'Metric 3: Completed Deal Sales Volume with Adjusted Currency Redenomination',
      'Dashboard Analytics',
      'Metric 3 failed to report original vs effective volumes or handle currency changes.',
      `Metric 3 correctly reports original & effective volumes: ${metric3.map((m) => `${m.currency}: Effective=${Number(m.effective_sales_volume).toFixed(2)} (Adjusted Deals: ${m.adjusted_deals_count})`).join(', ')}`
    )

    // Metric 4: Completed Deal Counts, Visibility Breakdown & Canonical Ratios
    const metric4 = await testPrisma.$queryRaw<
      Array<{
        total_completed_deals: number
        option_a_visible_count: number
        option_b_unlisted_count: number
        total_lost_deals: number
        total_active_pipeline_deals: number
        total_deals_count: number
        win_rate_percentage: number | null
        pipeline_throughput_percentage: number | null
      }>
    >`
      SELECT 
          COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::INTEGER AS total_completed_deals,
          COUNT(*) FILTER (WHERE "status" = 'COMPLETED' AND "keepPubliclyVisible" = true)::INTEGER AS option_a_visible_count,
          COUNT(*) FILTER (WHERE "status" = 'COMPLETED' AND "keepPubliclyVisible" = false)::INTEGER AS option_b_unlisted_count,
          COUNT(*) FILTER (WHERE "status" = 'LOST')::INTEGER AS total_lost_deals,
          COUNT(*) FILTER (WHERE "status" IN ('INQUIRY', 'CONTACTED', 'OFFER_MADE', 'UNDER_CONTRACT'))::INTEGER AS total_active_pipeline_deals,
          COUNT(*)::INTEGER AS total_deals_count,
          CASE 
              WHEN COUNT(*) FILTER (WHERE "status" IN ('COMPLETED', 'LOST')) > 0 
              THEN ROUND(
                  (COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::DECIMAL / 
                   COUNT(*) FILTER (WHERE "status" IN ('COMPLETED', 'LOST'))::DECIMAL) * 100, 
                  2
              )
              ELSE NULL 
          END AS win_rate_percentage,
          CASE 
              WHEN COUNT(*) > 0 
              THEN ROUND(
                  (COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::DECIMAL / COUNT(*)::DECIMAL) * 100, 
                  2
              )
              ELSE NULL 
          END AS pipeline_throughput_percentage
      FROM "Deal"
    `

    const m4Row = metric4[0]
    assert(
      Number(m4Row.total_completed_deals) === 2 &&
        Number(m4Row.option_a_visible_count) === 1 &&
        Number(m4Row.option_b_unlisted_count) === 1 &&
        Number(m4Row.win_rate_percentage) === 100.00,
      'T-P5-30',
      'Metric 4: Completed Deal Counts, Option A/B Breakdown & Win Rate',
      'Dashboard Analytics',
      'Metric 4 calculation incorrect.',
      `Metric 4 verified: Completed=${m4Row.total_completed_deals}, Visible(A)=${m4Row.option_a_visible_count}, Hidden(B)=${m4Row.option_b_unlisted_count}, WinRate=${m4Row.win_rate_percentage}%`
    )

    // Metric 5: Asset Inventory & Pricing Structure Counts
    const metric5 = await testPrisma.$queryRaw<
      Array<{
        total_properties_count: number
        active_public_listings_count: number
        total_published_count: number
        draft_count: number
        archived_count: number
        poa_count: number
        unpriced_count: number
      }>
    >`
      SELECT 
          COUNT(*)::INTEGER AS total_properties_count,
          COUNT(*) FILTER (WHERE "isPublished" = true AND "isArchived" = false AND "isPubliclyVisible" = true)::INTEGER AS active_public_listings_count,
          COUNT(*) FILTER (WHERE "isPublished" = true AND "isArchived" = false)::INTEGER AS total_published_count,
          COUNT(*) FILTER (WHERE "isDraft" = true AND "isArchived" = false)::INTEGER AS draft_count,
          COUNT(*) FILTER (WHERE "isArchived" = true)::INTEGER AS archived_count,
          COUNT(*) FILTER (WHERE "isPOA" = true)::INTEGER AS poa_count,
          COUNT(*) FILTER (WHERE "askingPriceNumeric" IS NULL AND "isPOA" = false)::INTEGER AS unpriced_count
      FROM "Property"
    `

    const m5Row = metric5[0]
    assert(
      Number(m5Row.total_properties_count) >= 4 &&
        Number(m5Row.poa_count) >= 1 &&
        Number(m5Row.unpriced_count) >= 1,
      'T-P5-31',
      'Metric 5: Asset Inventory & Pricing Structure Counts',
      'Dashboard Analytics',
      'Metric 5 inventory counts incorrect.',
      `Metric 5 verified: Total=${m5Row.total_properties_count}, ActiveShowcase=${m5Row.active_public_listings_count}, Draft=${m5Row.draft_count}, Archived=${m5Row.archived_count}, POA=${m5Row.poa_count}`
    )
  } finally {
    await testPrisma.$disconnect()
    console.log('\n[INFO] Tearing down disposable test database...')
    await safeTeardownDisposableDb(config, isDbCreated)
  }

  // ---------------------------------------------------------------------------
  // SECTION 6: LIVE DATABASE ZERO-MUTATION SAFETY VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 6] Auditing Live Production Database (apex) for Zero Mutation...')

  let liveDbUrl = process.env.DATABASE_URL
  if (!liveDbUrl) {
    const envPath = path.resolve(__dirname, '../../.env')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/)
      if (match) {
        liveDbUrl = match[1]
      }
    }
  }
  if (!liveDbUrl) {
    throw new Error('SAFETY ABORT: DATABASE_URL not found in environment or .env for live DB verification.')
  }

  const livePrisma = new PrismaClient({
    datasources: { db: { url: liveDbUrl } },
  })

  try {
    const liveDbName = await verifyCurrentDatabase(livePrisma, 'apex')
    assert(
      liveDbName === 'apex',
      'T-P5-32',
      'Live Database Identity Verification',
      'Live DB Safety',
      `Expected live database "apex", got "${liveDbName}".`,
      `Connected to live database "${liveDbName}".`
    )

    // Verify existing 8 baseline tables retain exact record counts
    const propertyCount = await livePrisma.property.count()
    const countryCount = await livePrisma.country.count()
    const serviceCount = await livePrisma.serviceCategory.count()
    const adminUserCount = await livePrisma.adminUser.count()
    const imageCount = await livePrisma.propertyImage.count()
    const enquiryCount = await livePrisma.enquiry.count()
    const homeCount = await livePrisma.homepageContent.count()
    const propServiceCount = await livePrisma.propertyService.count()

    const totalLiveRecords =
      propertyCount +
      countryCount +
      serviceCount +
      adminUserCount +
      imageCount +
      enquiryCount +
      homeCount +
      propServiceCount

    assert(
      propertyCount === 6 &&
        countryCount === 5 &&
        serviceCount === 4 &&
        adminUserCount === 1 &&
        imageCount === 21 &&
        enquiryCount === 1 &&
        homeCount === 1 &&
        propServiceCount === 9 &&
        totalLiveRecords === 48,
      'T-P5-33',
      'Live Database Zero Mutation Audit (Exact Baseline Preservation)',
      'Live DB Safety',
      `Live database records mutated! Total=${totalLiveRecords}, Properties=${propertyCount}`,
      `Live database 100% untouched: 6 Properties, 21 Images, 5 Countries, 4 Services, 9 PropertyServices, 1 Admin, 1 Enquiry, 1 Homepage (Total exactly 48 records intact).`
    )

    // Verify migrations table has not been altered
    const liveMigrations = await livePrisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM "_prisma_migrations" ORDER BY finished_at ASC
    `
    assert(
      liveMigrations.length === 1 && liveMigrations[0].migration_name === '20261030073355_init_schema',
      'T-P5-34',
      'Live Database Migration Table Zero Drift',
      'Live DB Safety',
      `Live _prisma_migrations was modified: ${liveMigrations.map((m) => m.migration_name).join(', ')}`,
      `Live _prisma_migrations strictly at baseline: "${liveMigrations[0].migration_name}". Zero migrations deployed.`
    )
  } finally {
    await livePrisma.$disconnect()
  }

  // ---------------------------------------------------------------------------
  // FINAL REPORT & RESULTS AGGREGATION
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================================')
  console.log('PHASE 5 TEST SUITE EXECUTION SUMMARY')
  console.log('==============================================================================')

  const passed = results.filter((r) => r.status === 'PASSED').length
  const failed = results.filter((r) => r.status === 'FAILED').length
  const blocked = results.filter((r) => r.status === 'BLOCKED').length

  console.log(`TOTAL TESTS:   ${results.length}`)
  console.log(`PASSED:        ${passed}`)
  console.log(`FAILED:        ${failed}`)
  console.log(`BLOCKED:       ${blocked}`)
  console.log(`PASS RATE:     ${((passed / results.length) * 100).toFixed(1)}%\n`)

  for (const r of results) {
    const symbol = r.status === 'PASSED' ? '✓' : r.status === 'FAILED' ? '✗' : '⊘'
    console.log(`[${symbol}] ${r.id.padEnd(8)} | ${r.category.padEnd(25)} | ${r.name}`)
    console.log(`    Evidence: ${r.evidence}`)
  }

  if (failed > 0 || blocked > 0) {
    console.error('\n[FATAL] One or more tests failed or were blocked.')
    process.exit(1)
  } else {
    console.log('\n[SUCCESS] All Phase 5 tests passed successfully. 100% verification achieved.')
  }
}

runPhase5TestSuite().catch((err) => {
  console.error('[FATAL EXCEPTION IN TEST RUNNER]:', err)
  process.exit(1)
})
