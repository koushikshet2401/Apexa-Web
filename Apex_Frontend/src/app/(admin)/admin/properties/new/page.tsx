import React from 'react'
import { db } from '@/lib/db'
import PropertyForm from '@/components/admin/PropertyForm'

export const dynamic = 'force-dynamic'

export default async function NewPropertyPage() {
  const [countries, services] = await Promise.all([
    db.country.findMany({
      select: { id: true, name: true, displayName: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    db.serviceCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { displayOrder: 'asc' },
    }),
  ])

  return <PropertyForm countries={countries} services={services} />
}
