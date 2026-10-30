import React from 'react'
import { db } from '@/lib/db'
import PropertiesListClient from '@/components/admin/PropertiesListClient'

export const dynamic = 'force-dynamic'

export default async function AdminPropertiesPage() {
  const properties = await db.property.findMany({
    include: {
      country: {
        select: { id: true, name: true, displayName: true, slug: true },
      },
      _count: {
        select: { images: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <PropertiesListClient initialProperties={properties} />
}
