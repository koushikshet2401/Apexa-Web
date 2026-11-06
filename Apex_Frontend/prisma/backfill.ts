import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Deterministic Price Parsing Function
 * Parses formatted luxury real estate marketing strings into numeric Decimal and ISO currency codes.
 * Returns null for numeric if price is ambiguous, unpriced, or Price on Application (P.O.A.).
 */
export function parsePriceString(priceStr: string | null | undefined): {
  numeric: number | null
  currency: string | null
  isPOA: boolean
  isAmbiguous: boolean
} {
  if (!priceStr || typeof priceStr !== 'string') {
    return { numeric: null, currency: null, isPOA: false, isAmbiguous: false }
  }

  const cleaned = priceStr.trim()
  const upper = cleaned.toUpperCase()
  const lower = cleaned.toLowerCase()

  // 1. Explicit Price on Application / On Request check
  if (
    upper.includes('P.O.A') ||
    upper.includes('POA') ||
    lower.includes('price on application') ||
    lower.includes('upon request') ||
    lower.includes('on request') ||
    lower.includes('contact for price')
  ) {
    return { numeric: null, currency: null, isPOA: true, isAmbiguous: false }
  }

  // 2. UAE Dirham: e.g. "AED 8,200,000" or "AED 8.2M"
  if (upper.startsWith('AED')) {
    const valuePart = cleaned.replace(/^AED\s*/i, '').replace(/,/g, '').trim()
    if (valuePart.toUpperCase().endsWith('M')) {
      const num = parseFloat(valuePart.slice(0, -1).trim()) * 1_000_000
      return { numeric: isNaN(num) ? null : num, currency: 'AED', isPOA: false, isAmbiguous: isNaN(num) }
    }
    const num = parseFloat(valuePart)
    return { numeric: isNaN(num) ? null : num, currency: 'AED', isPOA: false, isAmbiguous: isNaN(num) }
  }

  // 3. Indian Rupee: e.g. "₹ 12.5 Cr" or "₹ 28.0 Cr" or "INR 125,000,000"
  if (cleaned.includes('₹') || upper.startsWith('INR')) {
    const valuePart = cleaned.replace(/[₹\s]|INR/gi, '').trim()
    if (valuePart.toLowerCase().includes('cr')) {
      const num = parseFloat(valuePart.toLowerCase().replace('cr', '').trim()) * 10_000_000
      return { numeric: isNaN(num) ? null : num, currency: 'INR', isPOA: false, isAmbiguous: isNaN(num) }
    }
    const num = parseFloat(valuePart.replace(/,/g, ''))
    return { numeric: isNaN(num) ? null : num, currency: 'INR', isPOA: false, isAmbiguous: isNaN(num) }
  }

  // 4. Euro: e.g. "€ 4.2M" or "EUR 4,200,000"
  if (cleaned.includes('€') || upper.startsWith('EUR')) {
    const valuePart = cleaned.replace(/[€\s]|EUR/gi, '').trim()
    if (valuePart.toUpperCase().endsWith('M')) {
      const num = parseFloat(valuePart.slice(0, -1).trim()) * 1_000_000
      return { numeric: isNaN(num) ? null : num, currency: 'EUR', isPOA: false, isAmbiguous: isNaN(num) }
    }
    const num = parseFloat(valuePart.replace(/,/g, ''))
    return { numeric: isNaN(num) ? null : num, currency: 'EUR', isPOA: false, isAmbiguous: isNaN(num) }
  }

  // 5. US Dollar: e.g. "$ 5,500,000" or "$ 5.5M"
  if (cleaned.startsWith('$') || upper.startsWith('USD')) {
    const valuePart = cleaned.replace(/[\$\s]|USD/gi, '').trim()
    if (valuePart.toUpperCase().endsWith('M')) {
      const num = parseFloat(valuePart.slice(0, -1).trim()) * 1_000_000
      return { numeric: isNaN(num) ? null : num, currency: 'USD', isPOA: false, isAmbiguous: isNaN(num) }
    }
    const num = parseFloat(valuePart.replace(/,/g, ''))
    return { numeric: isNaN(num) ? null : num, currency: 'USD', isPOA: false, isAmbiguous: isNaN(num) }
  }

  // 6. Ambiguous string fallback - do NOT guess currency
  const rawNum = parseFloat(cleaned.replace(/[^0-9.]/g, ''))
  return { numeric: isNaN(rawNum) ? null : rawNum, currency: null, isPOA: false, isAmbiguous: true }
}

/**
 * Execute Backfill Transactionally and Idempotently
 */
export async function executeBackfill(tx: any) {
  // 1. Safe one-time initialization of isPubliclyVisible:
  // Initializes unconfigured rows (WHERE "isPubliclyVisible" IS NULL).
  // Published, unarchived, non-dealt properties become true (publicly visible).
  // Drafts, archived, or dealt properties become false (private).
  // Once initialized, rows have isPubliclyVisible IS NOT NULL, guaranteeing that
  // repeated executions will NEVER overwrite intentional admin visibility choices.
  const visibilityUpdate = await tx.$executeRaw`
    UPDATE "Property"
    SET "isPubliclyVisible" = (
      CASE 
        WHEN "isPublished" = true AND ("isArchived" IS NULL OR "isArchived" = false) AND ("hasCompletedDeal" IS NULL OR "hasCompletedDeal" = false) THEN true
        ELSE false
      END
    )
    WHERE "isPubliclyVisible" IS NULL;
  `

  // 2. Fetch properties needing pricing backfill (askingPriceNumeric is null AND isPOA is false)
  const properties = await tx.property.findMany({
    where: {
      askingPriceNumeric: null,
      isPOA: false,
    },
    select: {
      id: true,
      name: true,
      price: true,
      isPublished: true,
      isArchived: true,
      hasCompletedDeal: true,
    },
  })

  let updatedCount = 0
  let poaCount = 0
  let ambiguousCount = 0

  for (const prop of properties) {
    if (prop.price) {
      const { numeric, currency, isPOA, isAmbiguous } = parsePriceString(prop.price)

      if (isPOA) {
        await tx.property.update({
          where: { id: prop.id },
          data: { isPOA: true, askingPriceNumeric: null, askingCurrency: null },
        })
        poaCount++
      } else if (isAmbiguous) {
        console.warn(`[MANUAL REVIEW REQUIRED] Property "${prop.name}" (ID: ${prop.id}) has ambiguous price string: "${prop.price}". Left as unassigned.`)
        ambiguousCount++
      } else if (numeric !== null) {
        await tx.property.update({
          where: { id: prop.id },
          data: {
            askingPriceNumeric: numeric,
            askingCurrency: currency,
            isPOA: false,
          },
        })
        updatedCount++
      }
    }
  }

  // 3. Ensure default system role exists
  const superAdminRole = await tx.adminRole.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Unrestricted enterprise administrative access across all modules',
      isSystem: true,
    },
  })

  return {
    visibilityUpdated: visibilityUpdate,
    priceBackfilled: updatedCount,
    poaFlagged: poaCount,
    ambiguousSkipped: ambiguousCount,
    superAdminRoleId: superAdminRole.id,
  }
}

async function main() {
  console.log('--- APEX PACIFIC HOLDINGS: PHASE 3 TRANSACTIONAL BACKFILL SCRIPT ---')

  try {
    // Check database connection before executing
    await prisma.$queryRaw`SELECT 1`
  } catch (err: any) {
    console.error('DATABASE UNAVAILABLE: PostgreSQL at localhost:5432 is unreachable.')
    console.error('Backfill script cannot run while database is offline.')
    process.exit(0)
  }

  const result = await prisma.$transaction(async (tx) => {
    return await executeBackfill(tx)
  })

  console.log('Backfill execution summary:')
  console.log(`  - Visibility synchronized: ${result.visibilityUpdated}`)
  console.log(`  - Numeric prices populated: ${result.priceBackfilled}`)
  console.log(`  - P.O.A. records flagged: ${result.poaFlagged}`)
  console.log(`  - Ambiguous records skipped for manual review: ${result.ambiguousSkipped}`)
  console.log(`  - System role verified: ${result.superAdminRoleId}`)
  console.log('--- PHASE 3 BACKFILL COMPLETED SUCCESSFULLY ---')
}

// Only execute directly when run from CLI
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Backfill failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
