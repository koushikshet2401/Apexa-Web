import React from 'react'
import { db } from '@/lib/db'
import PropertiesListClient from '@/components/admin/PropertiesListClient'

export const dynamic = 'force-dynamic'

export default async function AdminPropertiesPage() {
  const [propertiesRaw, countries] = await Promise.all([
    db.property.findMany({
      include: {
        country: {
          select: { id: true, name: true, displayName: true, slug: true },
        },
        deals: {
          where: { status: 'COMPLETED' },
          include: {
            closedBy: { select: { id: true, name: true, email: true } },
            adjustments: { orderBy: { adjustmentSequence: 'desc' }, take: 1 },
          },
        },
        archivedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.country.findMany({
      select: { id: true, name: true, displayName: true, slug: true },
      orderBy: { displayOrder: 'asc' },
    }),
  ])

  // Convert Decimal fields to strings for safe JSON serialization across server/client boundary
  const properties = propertiesRaw.map((p) => ({
    ...p,
    askingPriceNumeric: p.askingPriceNumeric ? p.askingPriceNumeric.toString() : null,
    deals: p.deals.map((d) => ({
      ...d,
      actualSalePrice: d.actualSalePrice ? d.actualSalePrice.toString() : null,
      adjustments: d.adjustments.map((adj) => ({
        ...adj,
        previousSalePrice: adj.previousSalePrice.toString(),
        adjustedSalePrice: adj.adjustedSalePrice.toString(),
      })),
    })),
  }))

  return (
    <PropertiesListClient
      initialProperties={properties as any}
      countries={countries}
    />
  )
}
