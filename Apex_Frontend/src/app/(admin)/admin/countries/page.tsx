import React from 'react'
import { db } from '@/lib/db'
import CountriesListClient from '@/components/admin/CountriesListClient'

export const dynamic = 'force-dynamic'

export default async function AdminCountriesPage() {
  const countries = await db.country.findMany({
    include: {
      _count: { select: { properties: true } },
    },
    orderBy: { displayOrder: 'asc' },
  })

  return <CountriesListClient initialCountries={countries} />
}
