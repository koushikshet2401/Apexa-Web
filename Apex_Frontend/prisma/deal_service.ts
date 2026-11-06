import { PrismaClient, Prisma, DealStatus } from '@prisma/client'
import {
  SUPPORTED_CURRENCY_CODES,
  SUPPORTED_CURRENCY_REGISTRY,
  SupportedCurrencyCode,
  validateCurrencyMinorUnits,
} from '@/config/currencies'

/**
 * Eligible deal statuses that can transition to COMPLETED.
 * COMPLETED (already closed) and LOST (abandoned) are strictly ineligible.
 */
export const ELIGIBLE_DEAL_STATUSES: DealStatus[] = [
  'INQUIRY',
  'CONTACTED',
  'OFFER_MADE',
  'UNDER_CONTRACT',
]

export interface CloseDealInput {
  dealId: string
  propertyId: string
  adminUserId: string
  adminUserEmail?: string
  actualSalePrice: number | string | Prisma.Decimal
  currency: string
  keepPubliclyVisible: boolean // Option A: true (keep visible on site with Acquired badge); Option B: false (unpublish & move to Sold archive)
  notes?: string
}

export interface CloseDealResult {
  deal: {
    id: string
    dealRef: string
    propertyId: string
    status: DealStatus
    actualSalePrice: Prisma.Decimal | null
    saleCurrency: string | null
    keepPubliclyVisible: boolean
    closedAt: Date | null
    closedById: string | null
    notes: string | null
  }
  property: {
    id: string
    hasCompletedDeal: boolean
    isPublished: boolean
    isPubliclyVisible: boolean
  }
}

export interface CreateDealAdjustmentInput {
  dealId: string
  adjustedSalePrice: number | string | Prisma.Decimal
  adjustedCurrency: string
  adjustmentReason: string
  legalContractRef: string
  authorizedById: string
  authorizedByEmail?: string
}

export interface DealAdjustmentResult {
  id: string
  dealId: string
  adjustmentSequence: number
  previousSalePrice: Prisma.Decimal
  previousCurrency: string
  adjustedSalePrice: Prisma.Decimal
  adjustedCurrency: string
  adjustmentReason: string
  legalContractRef: string
  authorizedById: string
  createdAt: Date
}

/**
 * Transactional Deal Closure Service (Specification 009)
 * 
 * Guarantees:
 * 1. Pessimistic row locking on Property via SELECT ... FOR UPDATE prevents race conditions.
 * 2. Deal-Property integrity: Verifies Deal.propertyId matches locked propertyId.
 * 3. Status transition integrity: Only eligible statuses can transition to COMPLETED.
 * 4. Business rule enforcement: Rejects closure if Property already has a completed sale.
 * 5. Currency precision: Rejects invalid currencies and fractional amounts violating minorUnits.
 * 6. Dual visibility workflow:
 *    - Option A (keepPubliclyVisible = true): isPublished = true, isPubliclyVisible = true
 *    - Option B (keepPubliclyVisible = false): isPublished = false, isPubliclyVisible = false
 * 7. Transactional atomicity: Complete atomic state mutation.
 */
export async function closeDealTransaction(
  prisma: PrismaClient,
  input: CloseDealInput
): Promise<CloseDealResult> {
  const currencyCode = input.currency.toUpperCase() as SupportedCurrencyCode
  if (!SUPPORTED_CURRENCY_CODES.includes(currencyCode)) {
    throw new Error(`Invalid or unsupported currency code "${input.currency}".`)
  }

  // Validate positive amount and minorUnits
  const salePriceDecimal =
    input.actualSalePrice instanceof Prisma.Decimal
      ? input.actualSalePrice
      : new Prisma.Decimal(input.actualSalePrice.toString())

  if (salePriceDecimal.lte(0)) {
    throw new Error('Actual sale price must be strictly greater than zero.')
  }

  if (!validateCurrencyMinorUnits(salePriceDecimal, currencyCode)) {
    const allowed = SUPPORTED_CURRENCY_REGISTRY[currencyCode]?.minorUnits ?? 2
    throw new Error(
      `${currencyCode} does not permit fractional amounts greater than ${allowed} decimal place${allowed === 1 ? '' : 's'}.`
    )
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Lock Property row to serialize concurrent closure attempts
    const lockedProperty = await tx.$queryRaw<
      Array<{ id: string; hasCompletedDeal: boolean; isPublished: boolean; isPubliclyVisible: boolean }>
    >`
      SELECT id, "hasCompletedDeal", "isPublished", "isPubliclyVisible"
      FROM "Property"
      WHERE id = ${input.propertyId}
      FOR UPDATE
    `
    if (!lockedProperty || lockedProperty.length === 0) {
      throw new Error(`Property "${input.propertyId}" not found`)
    }

    const prop = lockedProperty[0]

    // 2. Fetch Deal and verify it belongs to the locked property
    const deal = await tx.deal.findUnique({
      where: { id: input.dealId },
    })
    if (!deal) {
      throw new Error(`Deal "${input.dealId}" not found`)
    }

    if (deal.propertyId !== input.propertyId) {
      throw new Error(
        `Integrity Violation: Deal "${input.dealId}" belongs to Property "${deal.propertyId}", not "${input.propertyId}"`
      )
    }

    // 3. Status transition eligibility check
    if (deal.status === 'COMPLETED') {
      throw new Error(`Invalid Transition: Deal "${input.dealId}" is already COMPLETED`)
    }
    if (deal.status === 'LOST') {
      throw new Error(`Invalid Transition: Deal "${input.dealId}" is marked as LOST and cannot be completed`)
    }
    if (!ELIGIBLE_DEAL_STATUSES.includes(deal.status)) {
      throw new Error(`Invalid Transition: Deal status "${deal.status}" is not eligible for completion`)
    }

    // 4. One-completed-sale-per-property business rule enforcement
    if (prop.hasCompletedDeal) {
      throw new Error(
        `Conflict: Property "${input.propertyId}" already has a completed sale. Cannot close another deal.`
      )
    }

    const existingCompleted = await tx.deal.findFirst({
      where: {
        propertyId: input.propertyId,
        status: 'COMPLETED',
      },
    })
    if (existingCompleted) {
      throw new Error(
        `Conflict: Property "${input.propertyId}" already has an active COMPLETED deal ("${existingCompleted.id}").`
      )
    }

    // 5. Update Deal to COMPLETED (terminal state)
    const updatedDeal = await tx.deal.update({
      where: { id: input.dealId },
      data: {
        status: 'COMPLETED',
        actualSalePrice: salePriceDecimal,
        saleCurrency: currencyCode,
        keepPubliclyVisible: input.keepPubliclyVisible,
        closedAt: new Date(),
        closedById: input.adminUserId,
        notes: input.notes !== undefined ? input.notes : deal.notes,
      },
      select: {
        id: true,
        dealRef: true,
        propertyId: true,
        status: true,
        actualSalePrice: true,
        saleCurrency: true,
        keepPubliclyVisible: true,
        closedAt: true,
        closedById: true,
        notes: true,
      },
    })

    // 6. Synchronize Property cached state and public visibility
    // Option A (keepPubliclyVisible: true): remains published and publicly visible with Acquired badge
    // Option B (keepPubliclyVisible: false): unpublished and removed from public site; moved to Sold Projects archive
    const updatedProperty = await tx.property.update({
      where: { id: input.propertyId },
      data: {
        hasCompletedDeal: true,
        isPublished: input.keepPubliclyVisible,
        isPubliclyVisible: input.keepPubliclyVisible,
      },
      select: {
        id: true,
        hasCompletedDeal: true,
        isPublished: true,
        isPubliclyVisible: true,
      },
    })

    // 7. Immutable audit trail entry
    await tx.adminActivityLog.create({
      data: {
        adminId: input.adminUserId,
        adminEmail: input.adminUserEmail || 'admin@apexpacificholdings.com',
        action: 'DEAL_COMPLETED',
        entityType: 'Deal',
        entityId: input.dealId,
        summary: `Deal ${updatedDeal.dealRef} completed for property ${input.propertyId} at ${currencyCode} ${salePriceDecimal.toString()} (${input.keepPubliclyVisible ? 'Option A: Public Acquired' : 'Option B: Unlisted Sold'})`,
        metadata: {
          dealId: input.dealId,
          dealRef: updatedDeal.dealRef,
          propertyId: input.propertyId,
          actualSalePrice: salePriceDecimal.toString(),
          saleCurrency: currencyCode,
          keepPubliclyVisible: input.keepPubliclyVisible,
          visibilityOutcome: input.keepPubliclyVisible ? 'PUBLIC_ACQUIRED' : 'HIDDEN_SOLD',
          closedAt: updatedDeal.closedAt?.toISOString(),
          closedById: input.adminUserId,
        },
      },
    })

    return { deal: updatedDeal, property: updatedProperty }
  })
}

/**
 * Transactional Financial Adjustment Service (Specification 009)
 * 
 * Guarantees:
 * 1. Only executed against COMPLETED deals.
 * 2. Original completed Deal record is NEVER modified.
 * 3. Row lock on Deal serializes concurrent adjustment submissions.
 * 4. Transaction-safe monotonic adjustmentSequence calculation.
 * 5. Appends immutable entry to DealFinancialAdjustment table.
 * 6. Logs high-severity DEAL_FINANCIAL_CORRECTION in AdminActivityLog.
 */
export async function createDealAdjustmentTransaction(
  prisma: PrismaClient,
  input: CreateDealAdjustmentInput
): Promise<DealAdjustmentResult> {
  const currencyCode = input.adjustedCurrency.toUpperCase() as SupportedCurrencyCode
  if (!SUPPORTED_CURRENCY_CODES.includes(currencyCode)) {
    throw new Error(`Invalid or unsupported currency code "${input.adjustedCurrency}".`)
  }

  const adjustedPriceDecimal =
    input.adjustedSalePrice instanceof Prisma.Decimal
      ? input.adjustedSalePrice
      : new Prisma.Decimal(input.adjustedSalePrice.toString())

  if (adjustedPriceDecimal.lte(0)) {
    throw new Error('Adjusted sale price must be strictly greater than zero.')
  }

  if (!validateCurrencyMinorUnits(adjustedPriceDecimal, currencyCode)) {
    const allowed = SUPPORTED_CURRENCY_REGISTRY[currencyCode]?.minorUnits ?? 2
    throw new Error(
      `${currencyCode} does not permit fractional amounts greater than ${allowed} decimal place${allowed === 1 ? '' : 's'}.`
    )
  }

  if (!input.adjustmentReason || input.adjustmentReason.trim().length < 10) {
    throw new Error('Adjustment reason is mandatory and must be at least 10 characters.')
  }

  if (!input.legalContractRef || input.legalContractRef.trim().length < 3) {
    throw new Error('Legal contract reference is mandatory.')
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Lock the Deal row to serialize concurrent adjustments
    const lockedDeals = await tx.$queryRaw<
      Array<{
        id: string
        dealRef: string
        status: string
        actualSalePrice: Prisma.Decimal | null
        saleCurrency: string | null
      }>
    >`
      SELECT id, "dealRef", status, "actualSalePrice", "saleCurrency"
      FROM "Deal"
      WHERE id = ${input.dealId}
      FOR UPDATE
    `

    if (!lockedDeals || lockedDeals.length === 0) {
      throw new Error(`Deal "${input.dealId}" not found`)
    }

    const deal = lockedDeals[0]

    if (deal.status !== 'COMPLETED') {
      throw new Error(`Cannot adjust Deal "${input.dealId}" because its status is "${deal.status}", not "COMPLETED".`)
    }

    // 2. Fetch latest adjustment to determine previous terms and sequence safely
    const previousAdjustments = await tx.$queryRaw<
      Array<{
        adjustmentSequence: number
        adjustedSalePrice: Prisma.Decimal
        adjustedCurrency: string
      }>
    >`
      SELECT "adjustmentSequence", "adjustedSalePrice", "adjustedCurrency"
      FROM "DealFinancialAdjustment"
      WHERE "dealId" = ${input.dealId}
      ORDER BY "adjustmentSequence" DESC
      LIMIT 1
    `

    let nextSequence = 1
    let previousPrice = deal.actualSalePrice!
    let previousCurrency = deal.saleCurrency!

    if (previousAdjustments && previousAdjustments.length > 0) {
      nextSequence = previousAdjustments[0].adjustmentSequence + 1
      previousPrice = previousAdjustments[0].adjustedSalePrice
      previousCurrency = previousAdjustments[0].adjustedCurrency
    }

    // 3. Insert immutable adjustment row
    const id = `adj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const now = new Date()

    await tx.$executeRaw`
      INSERT INTO "DealFinancialAdjustment" (
        id, "dealId", "adjustmentSequence", "previousSalePrice", "previousCurrency",
        "adjustedSalePrice", "adjustedCurrency", "adjustmentReason", "legalContractRef",
        "authorizedById", "createdAt"
      ) VALUES (
        ${id}, ${input.dealId}, ${nextSequence}, ${previousPrice}, ${previousCurrency},
        ${adjustedPriceDecimal}, ${currencyCode}, ${input.adjustmentReason.trim()}, ${input.legalContractRef.trim()},
        ${input.authorizedById}, ${now}
      )
    `

    // 4. Log high-severity audit entry
    await tx.adminActivityLog.create({
      data: {
        adminId: input.authorizedById,
        adminEmail: input.authorizedByEmail || 'admin@apexpacificholdings.com',
        action: 'DEAL_FINANCIAL_CORRECTION',
        entityType: 'Deal',
        entityId: input.dealId,
        summary: `Authorized financial adjustment #${nextSequence} on Deal ${deal.dealRef}: changed from ${previousCurrency} ${previousPrice.toString()} to ${currencyCode} ${adjustedPriceDecimal.toString()} (Ref: ${input.legalContractRef})`,
        metadata: {
          adjustmentId: id,
          dealId: input.dealId,
          dealRef: deal.dealRef,
          adjustmentSequence: nextSequence,
          previousSalePrice: previousPrice.toString(),
          previousCurrency,
          adjustedSalePrice: adjustedPriceDecimal.toString(),
          adjustedCurrency: currencyCode,
          adjustmentReason: input.adjustmentReason.trim(),
          legalContractRef: input.legalContractRef.trim(),
          authorizedById: input.authorizedById,
          timestamp: now.toISOString(),
        },
      },
    })

    return {
      id,
      dealId: input.dealId,
      adjustmentSequence: nextSequence,
      previousSalePrice: previousPrice,
      previousCurrency,
      adjustedSalePrice: adjustedPriceDecimal,
      adjustedCurrency: currencyCode,
      adjustmentReason: input.adjustmentReason.trim(),
      legalContractRef: input.legalContractRef.trim(),
      authorizedById: input.authorizedById,
      createdAt: now,
    }
  })
}
