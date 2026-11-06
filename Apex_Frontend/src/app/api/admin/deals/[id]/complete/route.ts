import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { closeDealTransaction } from '@/../prisma/deal_service'

/**
 * POST /api/admin/deals/[id]/complete
 * Completes a transaction with mandatory Option A vs Option B public-visibility selection.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.DEALS_CLOSE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const body = await request.json()
    const { actualSalePrice, currency, keepPubliclyVisible, notes } = body

    if (actualSalePrice === undefined || actualSalePrice === null) {
      return NextResponse.json({ error: 'Actual sale price is required.' }, { status: 400 })
    }

    if (!currency || typeof currency !== 'string') {
      return NextResponse.json({ error: 'Sale currency is required.' }, { status: 400 })
    }

    if (keepPubliclyVisible === undefined || typeof keepPubliclyVisible !== 'boolean') {
      return NextResponse.json(
        { error: 'Mandatory choice required: keepPubliclyVisible must be a boolean (true for Option A, false for Option B).' },
        { status: 400 }
      )
    }

    // Fetch deal to get propertyId
    const deal = await db.deal.findUnique({
      where: { id },
      select: { id: true, propertyId: true, status: true },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 })
    }

    const result = await closeDealTransaction(db, {
      dealId: id,
      propertyId: deal.propertyId,
      adminUserId: auth.id,
      adminUserEmail: auth.email,
      actualSalePrice,
      currency,
      keepPubliclyVisible,
      notes,
    })

    return NextResponse.json({
      ok: true,
      message: `Deal marked as COMPLETED (${keepPubliclyVisible ? 'Option A: Public Acquired' : 'Option B: Unlisted Sold'}).`,
      deal: result.deal,
      property: result.property,
    })
  } catch (error: any) {
    if (error?.message?.startsWith('Conflict')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error?.message?.startsWith('Invalid Transition') || error?.message?.startsWith('Integrity Violation')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error?.message?.includes('minorUnits') || error?.message?.includes('currency code') || error?.message?.includes('greater than zero')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Error completing deal:', error)
    return NextResponse.json({ error: error?.message || 'Failed to complete deal' }, { status: 500 })
  }
}
