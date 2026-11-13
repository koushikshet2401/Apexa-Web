import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { closeDealTransaction } from '@/../prisma/deal_service'
import { revalidatePropertyCms } from '@/lib/revalidate'
import { customAlphabet } from 'nanoid'

const generateDealRef = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.DEALS_CLOSE)
  if (auth instanceof Response) return auth

  try {
    const { id: propertyId } = await params
    const body = await request.json()
    const {
      actualSalePrice,
      currency,
      keepPubliclyVisible,
      buyerName,
      buyerContact,
      notes,
    } = body

    if (actualSalePrice === undefined || actualSalePrice === null) {
      return NextResponse.json({ error: 'Actual sale price is required.' }, { status: 400 })
    }

    if (!currency || typeof currency !== 'string') {
      return NextResponse.json({ error: 'Sale currency is required.' }, { status: 400 })
    }

    if (keepPubliclyVisible === undefined || typeof keepPubliclyVisible !== 'boolean') {
      return NextResponse.json(
        { error: 'Selection required: keepPubliclyVisible must be boolean (Option A vs Option B).' },
        { status: 400 }
      )
    }

    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        country: { select: { slug: true } },
        deals: {
          where: { status: { not: 'LOST' } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 })
    }

    if (property.hasCompletedDeal) {
      return NextResponse.json(
        { error: 'This property already has a completed deal. A property cannot have more than one completed sale.' },
        { status: 409 }
      )
    }

    // Find eligible open deal or create one
    let targetDeal = property.deals.find((d) => d.status !== 'COMPLETED' && d.status !== 'LOST')

    if (!targetDeal) {
      targetDeal = await db.deal.create({
        data: {
          dealRef: `DEAL-${generateDealRef()}`,
          propertyId,
          buyerName: buyerName?.trim() || null,
          buyerContact: buyerContact?.trim() || null,
          status: 'UNDER_CONTRACT',
          notes: notes?.trim() || 'Direct closure via Current Projects',
        },
      })
    } else if (buyerName || buyerContact) {
      targetDeal = await db.deal.update({
        where: { id: targetDeal.id },
        data: {
          buyerName: buyerName?.trim() || targetDeal.buyerName,
          buyerContact: buyerContact?.trim() || targetDeal.buyerContact,
        },
      })
    }

    const result = await closeDealTransaction(db as any, {
      dealId: targetDeal.id,
      propertyId,
      adminUserId: auth.id,
      adminUserEmail: auth.email,
      actualSalePrice,
      currency,
      keepPubliclyVisible,
      notes: notes?.trim(),
    })

    revalidatePropertyCms({
      slug: property.slug,
      countrySlug: property.country?.slug,
    })

    return NextResponse.json({
      ok: true,
      message: `Deal closed successfully (${keepPubliclyVisible ? 'Option A: Public Acquired' : 'Option B: Unlisted Sold'}).`,
      deal: result.deal,
      property: result.property,
    })
  } catch (error: any) {
    console.error('Error closing deal on property:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to close deal.' },
      { status: 400 }
    )
  }
}
