import React from 'react'
import { db } from '@/lib/db'
import EnquiriesManagementClient from '@/components/admin/EnquiriesManagementClient'

export const dynamic = 'force-dynamic'

export default async function AdminEnquiriesPage() {
  const enquiries = await db.enquiry.findMany({
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
          locationLine: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  const serialized = enquiries.map((e) => ({
    ...e,
    submittedAt: e.submittedAt.toISOString(),
  }))

  return <EnquiriesManagementClient initialEnquiries={serialized} />
}
