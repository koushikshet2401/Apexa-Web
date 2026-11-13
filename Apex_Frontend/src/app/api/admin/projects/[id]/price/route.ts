import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import {
  hasForbiddenDescriptiveFields,
  validateAndNormalizePricing,
} from '@/lib/projectValidation'
import { revalidatePropertyCms } from '@/lib/revalidate'
import { Prisma } from '@prisma/client'

/**
 * PATCH /api/admin/projects/[id]/price
 * Updates asking price and currency. Rejects descriptive fields.
 * Logs immutable differential audit entry in AdminActivityLog.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_PRICE_UPDATE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const body = await request.json()

    // 1. Rejects forbidden descriptive fields
    const forbidden = hasForbiddenDescriptiveFields(body)
    if (forbidden.length > 0) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_DESCRIPTIVE_FIELDS',
          message: `Descriptive fields (${forbidden.join(', ')}) cannot be updated via the price route. Use PATCH /api/admin/projects/[id] instead.`,
        },
        { status: 400 }
      )
    }

    // 2. Validate mandatory reason
    const { reason, isPOA, askingPriceNumeric, askingCurrency } = body
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'A valid reason for the price update is required (minimum 5 characters).' },
        { status: 400 }
      )
    }

    // 3. Validate pricing state (Priced, POA, or Unpriced)
    const pricingResult = validateAndNormalizePricing({
      isPOA,
      askingPriceNumeric,
      askingCurrency,
    })

    if (!pricingResult.valid) {
      return NextResponse.json({ error: pricingResult.error }, { status: 400 })
    }

    const newPricing = pricingResult.data

    // 4. Transactional update with row locking
    const result = await db.$transaction(async (tx) => {
      // Row lock to prevent concurrent price modifications
      const locked = await tx.$queryRaw<
        Array<{
          id: string
          name: string
          isArchived: boolean
          askingPriceNumeric: Prisma.Decimal | null
          askingCurrency: string | null
          isPOA: boolean
        }>
      >`
        SELECT id, name, "isArchived", "askingPriceNumeric", "askingCurrency", "isPOA"
        FROM "Property"
        WHERE id = ${id}
        FOR UPDATE
      `

      if (!locked || locked.length === 0) {
        throw new Error('NOT_FOUND')
      }

      const current = locked[0]

      if (current.isArchived) {
        throw new Error('ARCHIVED')
      }

      const oldAmount = current.askingPriceNumeric ? current.askingPriceNumeric.toString() : null
      const oldCurrency = current.askingCurrency
      const wasPOA = current.isPOA

      const newAmountDecimal = newPricing.askingPriceNumeric !== null ? new Prisma.Decimal(newPricing.askingPriceNumeric) : null
      const newAmountStr = newPricing.askingPriceNumeric !== null ? newPricing.askingPriceNumeric.toString() : null

      // Apply update
      const updated = await tx.property.update({
        where: { id },
        data: {
          askingPriceNumeric: newAmountDecimal,
          askingCurrency: newPricing.askingCurrency,
          isPOA: newPricing.isPOA,
          price: newPricing.formattedPrice,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          country: { select: { slug: true } },
          askingPriceNumeric: true,
          askingCurrency: true,
          isPOA: true,
          price: true,
          updatedAt: true,
        },
      })

      // Log differential entry in AdminActivityLog
      await tx.adminActivityLog.create({
        data: {
          adminId: auth.id,
          adminEmail: auth.email,
          action: 'PROJECT_PRICE_CHANGED',
          entityType: 'Property',
          entityId: id,
          summary: `Asking price for "${current.name}" changed from ${oldCurrency || (wasPOA ? 'POA' : 'Unpriced')} ${oldAmount || ''} to ${newPricing.askingCurrency || (newPricing.isPOA ? 'POA' : 'Unpriced')} ${newAmountStr || ''}`,
          metadata: {
            projectId: id,
            oldAmount,
            oldCurrency,
            wasPOA,
            newAmount: newAmountStr,
            newCurrency: newPricing.askingCurrency,
            isPOA: newPricing.isPOA,
            pricingState: newPricing.pricingState,
            reason: reason.trim(),
            adminId: auth.id,
            adminEmail: auth.email,
            timestamp: new Date().toISOString(),
          },
        },
      })

      return updated
    })

    revalidatePropertyCms({
      slug: result.slug,
      countrySlug: result.country?.slug,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error?.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (error?.message === 'ARCHIVED') {
      return NextResponse.json({ error: 'Cannot update price of an archived project. Restore it first.' }, { status: 400 })
    }
    console.error('Error updating project price:', error)
    return NextResponse.json({ error: 'Failed to update project price' }, { status: 500 })
  }
}
