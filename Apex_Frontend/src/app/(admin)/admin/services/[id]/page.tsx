import React from 'react'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import ServiceForm from '@/components/admin/ServiceForm'

export const dynamic = 'force-dynamic'

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const service = await db.serviceCategory.findUnique({
    where: { id },
  })

  if (!service) {
    notFound()
  }

  return <ServiceForm initialService={service} />
}
