import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, requireRole, PERMISSIONS } from '@/lib/rbac'
import { createDealAdjustmentTransaction } from '@/../prisma/deal_service'

/**
 * GET /api/admin/deals/[id]/adjustments
 * Lists all authorized financial adjustments for a completed deal in chronological sequence.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.DEALS_READ)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const adjustments = await db.$queryRaw<
      Array<{
        id: string
        dealId: string
        adjustmentSequence: number
        previousSalePrice: any
        previousCurrency: string
        adjustedSalePrice: any
        adjustedCurrency: string
        adjustmentReason: string
        legalContractRef: string
        authorizedById: string
        createdAt: Date
      }>
    >`
      SELECT *
      FROM "DealFinancialAdjustment"
      WHERE "dealId" = ${id}
      ORDER BY "adjustmentSequence" ASC
    `

    return NextResponse.json(adjustments)
  } catch (error) {
    console.error('Error fetching deal adjustments:', error)
    return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
  }
}

/**
 * POST /api/admin/deals/[id]/adjustments
 * Creates an authorized financial adjustment. Strictly restricted to SUPER_ADMIN role.
 * Preserves the original completed Deal record 100% untouched.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Enforce Super Admin authorization
  const auth = await requireRole(request, 'SUPER_ADMIN')
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const body = await request.json()
    const { adjustedSalePrice, adjustedCurrency, adjustmentReason, legalContractRef } = body

    if (adjustedSalePrice === undefined || adjustedSalePrice === null) {
      return NextResponse.json({ error: 'Adjusted sale price is required.' }, { status: 400 })
    }

    if (!adjustedCurrency || typeof adjustedCurrency !== 'string') {
      return NextResponse.json({ error: 'Adjusted currency is required.' }, { status: 400 })
    }

    if (!adjustmentReason || typeof adjustmentReason !== 'string' || adjustmentReason.trim().length < 10) {
      return NextResponse.json(
        { error: 'A mandatory adjustment reason is required (minimum 10 characters).' },
        { status: 400 }
      )
    }

    if (!legalContractRef || typeof legalContractRef !== 'string' || legalContractRef.trim().length < 3) {
      return NextResponse.json(
        { error: 'A valid legal contract reference (e.g. addendum document reference) is required.' },
        { status: 400 }
      )
    }

    const adjustment = await createDealAdjustmentTransaction(db, {
      dealId: id,
      adjustedSalePrice,
      adjustedCurrency,
      adjustmentReason,
      legalContractRef,
      authorizedById: auth.id,
      authorizedByEmail: auth.email,
    })

    return NextResponse.json(
      {
        ok: true,
        message: `Financial adjustment #${adjustment.adjustmentSequence} successfully recorded.`,
        adjustment,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (
      error?.message?.includes('Cannot adjust Deal') ||
      error?.message?.includes('greater than zero') ||
      error?.message?.includes('currency code') ||
      error?.message?.includes('fractional amounts') ||
      error?.message?.includes('mandatory')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Error creating deal adjustment:', error)
    return NextResponse.json({ error: error?.message || 'Failed to record adjustment' }, { status: 500 })
  }
}
