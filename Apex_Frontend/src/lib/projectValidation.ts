import { z } from 'zod'
import { Prisma } from '@prisma/client'
import {
  SUPPORTED_CURRENCY_CODES,
  SUPPORTED_CURRENCY_REGISTRY,
  SupportedCurrencySchema,
  SupportedCurrencyCode,
  validateCurrencyMinorUnits,
  formatCurrencyAmount,
} from '@/config/currencies'

export const MAX_MONETARY_CAPACITY = '999999999999999.99' // DECIMAL(18,2) max positive capacity

export interface ValidatedPricing {
  pricingState: 'PRICED' | 'POA' | 'UNPRICED'
  isPOA: boolean
  askingPriceNumeric: string | null
  askingCurrency: SupportedCurrencyCode | null
  formattedPrice: string | null
}

/**
 * Validates and normalizes pricing input into one of the three approved states:
 * State A (Priced): isPOA=false, amount > 0, valid currency, minorUnits respected.
 * State B (POA): isPOA=true, amount=null, currency=null.
 * State C (Unpriced): isPOA=false, amount=null, currency=null.
 * 
 * Precision Guarantee:
 * Money amounts are handled as exact decimal strings and validated via Prisma.Decimal
 * without converting through JavaScript IEEE-754 floating-point numbers.
 */
export function validateAndNormalizePricing(input: {
  isPOA?: boolean | null
  askingPriceNumeric?: number | string | Prisma.Decimal | null
  askingCurrency?: string | null
}): { valid: true; data: ValidatedPricing } | { valid: false; error: string } {
  const isPOA = Boolean(input.isPOA)
  const rawAmount = input.askingPriceNumeric
  const rawCurrency = input.askingCurrency ? input.askingCurrency.trim().toUpperCase() : null

  let decAmount: Prisma.Decimal | null = null

  // Check for amount validity without floating-point conversion
  if (rawAmount !== null && rawAmount !== undefined && rawAmount !== '') {
    try {
      const str =
        rawAmount instanceof Prisma.Decimal
          ? rawAmount.toString()
          : typeof rawAmount === 'number'
          ? rawAmount.toString()
          : String(rawAmount).trim()

      decAmount = new Prisma.Decimal(str)
    } catch {
      return { valid: false, error: 'Asking price must be a valid numeric amount.' }
    }

    if (decAmount.isZero()) {
      return { valid: false, error: 'Zero asking price is strictly prohibited. Use POA or leave unpriced.' }
    }
    if (decAmount.isNegative()) {
      return { valid: false, error: 'Asking price cannot be negative.' }
    }
    if (decAmount.gt(MAX_MONETARY_CAPACITY)) {
      return { valid: false, error: `Asking price exceeds maximum capacity (${MAX_MONETARY_CAPACITY}).` }
    }
  }

  // State B: POA
  if (isPOA) {
    if (decAmount !== null) {
      return { valid: false, error: 'POA properties cannot have a numeric asking price.' }
    }
    if (rawCurrency !== null && rawCurrency !== undefined && rawCurrency !== '') {
      return { valid: false, error: 'POA properties cannot specify an asking currency.' }
    }
    return {
      valid: true,
      data: {
        pricingState: 'POA',
        isPOA: true,
        askingPriceNumeric: null,
        askingCurrency: null,
        formattedPrice: 'Price on Application',
      },
    }
  }

  // Check if amount is supplied
  const hasAmount = decAmount !== null
  const hasCurrency = rawCurrency !== null && rawCurrency !== undefined && rawCurrency !== ''

  // Partial combinations rejection
  if (hasAmount && !hasCurrency) {
    return { valid: false, error: 'An asking currency is required whenever an asking price is provided.' }
  }
  if (!hasAmount && hasCurrency) {
    return { valid: false, error: 'An asking price is required whenever an asking currency is provided.' }
  }

  // State C: Unpriced
  if (!hasAmount && !hasCurrency) {
    return {
      valid: true,
      data: {
        pricingState: 'UNPRICED',
        isPOA: false,
        askingPriceNumeric: null,
        askingCurrency: null,
        formattedPrice: null,
      },
    }
  }

  // State A: Priced
  if (!SUPPORTED_CURRENCY_CODES.includes(rawCurrency as any)) {
    return { valid: false, error: `Invalid or unsupported currency code "${rawCurrency}".` }
  }

  const currencyCode = rawCurrency as SupportedCurrencyCode

  // Enforce minorUnits on the exact decimal
  if (!validateCurrencyMinorUnits(decAmount, currencyCode)) {
    const allowed = SUPPORTED_CURRENCY_REGISTRY[currencyCode].minorUnits
    return {
      valid: false,
      error: `${currencyCode} does not permit fractional amounts greater than ${allowed} decimal place${allowed === 1 ? '' : 's'}.`,
    }
  }

  const exactDecimalString =
    SUPPORTED_CURRENCY_REGISTRY[currencyCode].minorUnits === 0
      ? decAmount!.toFixed(0)
      : decAmount!.toFixed(2)

  return {
    valid: true,
    data: {
      pricingState: 'PRICED',
      isPOA: false,
      askingPriceNumeric: exactDecimalString,
      askingCurrency: currencyCode,
      formattedPrice: formatCurrencyAmount(exactDecimalString, currencyCode),
    },
  }
}

/**
 * Forbidden financial fields in descriptive update requests.
 */
export const FORBIDDEN_FINANCIAL_FIELDS = [
  'askingPriceNumeric',
  'askingCurrency',
  'isPOA',
  'price',
] as const

export function hasForbiddenFinancialFields(body: Record<string, any>): string[] {
  const found: string[] = []
  for (const field of FORBIDDEN_FINANCIAL_FIELDS) {
    if (field in body && body[field] !== undefined) {
      found.push(field)
    }
  }
  return found
}

/**
 * Forbidden descriptive fields in financial price update requests.
 */
export const FORBIDDEN_DESCRIPTIVE_FIELDS = [
  'name',
  'slug',
  'tagline',
  'shortDescription',
  'description',
  'type',
  'beds',
  'baths',
  'area',
  'cityName',
  'locationLine',
  'mapUrl',
  'mainVideoUrl',
  'mainVideoThumb',
  'mainImage',
  'spaceRoundImage',
  'highlights',
  'layoutVariant',
  'isPublished',
  'isDraft',
  'isFeaturedLaunch',
  'launchOrder',
  'launchDate',
  'isSpaceInRound',
  'spaceOrder',
  'isArchived',
  'countryId',
  'serviceIds',
] as const

export function hasForbiddenDescriptiveFields(body: Record<string, any>): string[] {
  const found: string[] = []
  for (const field of FORBIDDEN_DESCRIPTIVE_FIELDS) {
    if (field in body && body[field] !== undefined) {
      found.push(field)
    }
  }
  return found
}
