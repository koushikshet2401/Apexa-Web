import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'

/**
 * GET /api/admin/deals/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.DEALS_READ)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            country: true,
          },
        },
        closedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Fetch authorized financial adjustments if table exists
    let adjustments: any[] = []
    try {
      adjustments = await (db as any).dealFinancialAdjustment.findMany({
        where: { dealId: id },
        orderBy: { adjustmentSequence: 'asc' },
        include: {
          authorizedBy: { select: { id: true, name: true, email: true } },
        },
      })
    } catch {
      // Table may be empty or pending in unmigrated environment
    }

    return NextResponse.json({
      ...deal,
      adjustments,
    })
  } catch (error) {
    console.error('Error fetching deal:', error)
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 })
  }
}
