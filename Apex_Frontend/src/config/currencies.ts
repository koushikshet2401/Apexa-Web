import { z } from 'zod'
import { Prisma } from '@prisma/client'

/**
 * APEX PACIFIC HOLDINGS — AUTHORITATIVE CURRENCY REGISTRY (SSOT)
 * Single source of truth for supported currencies, symbols, and minorUnits precision.
 */

export interface CurrencyDefinition {
  readonly code: string
  readonly name: string
  readonly symbol: string
  readonly minorUnits: number // 0 for JPY; 2 for AED, USD, EUR, etc.
  readonly isOperational: boolean
  readonly jurisdiction: string
}

export const SUPPORTED_CURRENCY_REGISTRY: Record<string, CurrencyDefinition> = {
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', minorUnits: 2, isOperational: true, jurisdiction: 'UAE' },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', minorUnits: 2, isOperational: true, jurisdiction: 'International' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnits: 2, isOperational: true, jurisdiction: 'India' },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', minorUnits: 2, isOperational: true, jurisdiction: 'Thailand' },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', minorUnits: 2, isOperational: true, jurisdiction: 'Malaysia' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', minorUnits: 2, isOperational: true, jurisdiction: 'Australia' },
  GEL: { code: 'GEL', name: 'Georgian Lari', symbol: '₾', minorUnits: 2, isOperational: true, jurisdiction: 'Georgia' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', minorUnits: 2, isOperational: true, jurisdiction: 'Europe' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', minorUnits: 2, isOperational: true, jurisdiction: 'UK' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', minorUnits: 2, isOperational: true, jurisdiction: 'Singapore' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', minorUnits: 2, isOperational: true, jurisdiction: 'Switzerland' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', minorUnits: 2, isOperational: true, jurisdiction: 'Canada' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', minorUnits: 0, isOperational: true, jurisdiction: 'Japan' },
} as const

export const SUPPORTED_CURRENCY_CODES = Object.keys(SUPPORTED_CURRENCY_REGISTRY) as [string, ...string[]]
export type SupportedCurrencyCode = keyof typeof SUPPORTED_CURRENCY_REGISTRY

/**
 * Validates whether an amount respects the permitted decimal precision of the given currency.
 * - JPY (minorUnits = 0): Must not have any decimal places (e.g. 15000 is valid, 15000.50 is invalid).
 * - Standard (minorUnits = 2): At most 2 decimal places.
 */
export function validateCurrencyMinorUnits(
  amount: number | string | Prisma.Decimal | null | undefined,
  currency: string | null | undefined
): boolean {
  if (amount === null || amount === undefined || !currency) {
    return true
  }

  const def = SUPPORTED_CURRENCY_REGISTRY[currency.toUpperCase()]
  if (!def) return false

  const str = amount instanceof Prisma.Decimal ? amount.toString() : amount.toString().trim()
  const dotIndex = str.indexOf('.')
  const decimalPlaces = dotIndex === -1 ? 0 : str.length - dotIndex - 1

  return decimalPlaces <= def.minorUnits
}

/**
 * Formats a numeric monetary amount with its currency symbol/code according to its minorUnits.
 */
export function formatCurrencyAmount(
  amount: number | string | Prisma.Decimal | null | undefined,
  currency: string | null | undefined
): string {
  if (amount === null || amount === undefined || !currency) {
    return ''
  }

  const code = currency.toUpperCase()
  const def = SUPPORTED_CURRENCY_REGISTRY[code]
  const str =
    amount instanceof Prisma.Decimal
      ? amount.toString()
      : typeof amount === 'number'
      ? amount.toString()
      : amount.toString().trim()

  const [rawInt, rawDec] = str.split('.')
  const formattedInt = (rawInt || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  if (def && def.minorUnits === 0) {
    return `${code} ${formattedInt}`
  }

  const decPart = (rawDec || '').padEnd(2, '0').slice(0, 2)
  return `${code} ${formattedInt}.${decPart}`
}

/**
 * Zod validation schema for supported currency codes.
 */
export const SupportedCurrencySchema = z.enum(SUPPORTED_CURRENCY_CODES, {
  message: 'Invalid or unsupported ISO 4217 currency code',
})
