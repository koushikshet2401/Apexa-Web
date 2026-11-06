import React from 'react'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import PropertyForm from '@/components/admin/PropertyForm'

export const dynamic = 'force-dynamic'

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [property, countries, services] = await Promise.all([
    db.property.findUnique({
      where: { id },
      include: {
        country: true,
        images: { orderBy: { order: 'asc' } },
        services: { include: { service: true } },
      },
    }),
    db.country.findMany({
      select: { id: true, name: true, displayName: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    db.serviceCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { displayOrder: 'asc' },
    }),
  ])

  if (!property) {
    notFound()
  }

  const serializedProperty = {
    ...property,
    askingPriceNumeric: property.askingPriceNumeric ? property.askingPriceNumeric.toString() : null,
    bathroomsCount: property.bathroomsCount ? property.bathroomsCount.toString() : null,
    areaNumeric: property.areaNumeric ? property.areaNumeric.toString() : null,
    launchDate: property.launchDate ? property.launchDate.toISOString() : null,
    createdAt: property.createdAt ? property.createdAt.toISOString() : null,
    updatedAt: property.updatedAt ? property.updatedAt.toISOString() : null,
    archivedAt: property.archivedAt ? property.archivedAt.toISOString() : null,
  }

  return (
    <PropertyForm
      initialProperty={serializedProperty}
      countries={countries}
      services={services}
    />
  )
}
