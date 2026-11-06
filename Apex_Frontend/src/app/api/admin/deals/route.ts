import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import {
  SUPPORTED_CURRENCY_CODES,
  validateCurrencyMinorUnits,
} from '@/config/currencies'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/deals
 * Lists deals with filtering for status and property.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.DEALS_READ)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const propertyId = searchParams.get('propertyId')

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (propertyId) {
      where.propertyId = propertyId
    }

    const deals = await db.deal.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            askingPriceNumeric: true,
            askingCurrency: true,
            isPublished: true,
            isPubliclyVisible: true,
            hasCompletedDeal: true,
          },
        },
        closedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    return NextResponse.json(deals)
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}

/**
 * POST /api/admin/deals
 * Creates a new deal in one of the open pipeline stages (INQUIRY, CONTACTED, OFFER_MADE, UNDER_CONTRACT).
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.DEALS_CREATE)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const {
      propertyId,
      buyerName,
      buyerContact,
      status = 'INQUIRY',
      notes,
      provisionalPrice,
      currency,
    } = body

    if (!propertyId || typeof propertyId !== 'string') {
      return NextResponse.json({ error: 'Property ID is required.' }, { status: 400 })
    }

    // Verify property exists and is not archived
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true, isArchived: true, hasCompletedDeal: true },
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 })
    }

    if (property.isArchived) {
      return NextResponse.json({ error: 'Cannot create a deal on an archived project.' }, { status: 400 })
    }

    // Rejects creating directly as COMPLETED
    if (status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Deals cannot be initialized as COMPLETED. Use POST /api/admin/deals/[id]/complete.' },
        { status: 400 }
      )
    }

    const validStatuses = ['INQUIRY', 'CONTACTED', 'OFFER_MADE', 'UNDER_CONTRACT', 'LOST']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid deal status "${status}".` }, { status: 400 })
    }

    // Provisional pricing validation
    let priceDecimal: Prisma.Decimal | null = null
    let validCurrency: string | null = null

    if (provisionalPrice !== undefined && provisionalPrice !== null && provisionalPrice !== '') {
      try {
        const str =
          provisionalPrice instanceof Prisma.Decimal
            ? provisionalPrice.toString()
            : typeof provisionalPrice === 'number'
            ? provisionalPrice.toString()
            : String(provisionalPrice).trim()
        priceDecimal = new Prisma.Decimal(str)
      } catch {
        return NextResponse.json({ error: 'Provisional price must be a valid numeric amount.' }, { status: 400 })
      }

      if (priceDecimal.lte(0)) {
        return NextResponse.json({ error: 'Provisional price must be strictly greater than zero.' }, { status: 400 })
      }
      if (!currency || !SUPPORTED_CURRENCY_CODES.includes(currency.toUpperCase() as any)) {
        return NextResponse.json({ error: 'A valid supported currency is required with provisional price.' }, { status: 400 })
      }
      validCurrency = currency.toUpperCase()
      if (!validateCurrencyMinorUnits(priceDecimal, validCurrency)) {
        return NextResponse.json({ error: 'Amount violates currency decimal precision.' }, { status: 400 })
      }
    }

    // Generate unique dealRef
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
    const dealRef = `DEAL-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`

    const deal = await db.deal.create({
      data: {
        dealRef,
        propertyId,
        buyerName: buyerName?.trim() || null,
        buyerContact: buyerContact?.trim() || null,
        status: status as any,
        actualSalePrice: priceDecimal,
        saleCurrency: validCurrency,
        notes: notes?.trim() || null,
      },
      include: {
        property: { select: { id: true, name: true, slug: true } },
      },
    })

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'DEAL_CREATED',
      entityType: 'Deal',
      entityId: deal.id,
      summary: `Deal ${deal.dealRef} created for property "${property.name}" (Status: ${status})`,
      metadata: {
        dealId: deal.id,
        dealRef: deal.dealRef,
        propertyId,
        status,
        buyerName: deal.buyerName,
      },
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error('Error creating deal:', error)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }
}
