import React from 'react'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import CountryForm from '@/components/admin/CountryForm'

export const dynamic = 'force-dynamic'

export default async function EditCountryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const country = await db.country.findUnique({
    where: { id },
  })

  if (!country) {
    notFound()
  }

  return <CountryForm initialCountry={country} />
}
