import React from 'react'
import { db } from '@/lib/db'
import ServicesListClient from '@/components/admin/ServicesListClient'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const services = await db.serviceCategory.findMany({
    include: {
      _count: { select: { properties: true } },
    },
    orderBy: { displayOrder: 'asc' },
  })

  return <ServicesListClient initialServices={services} />
}
