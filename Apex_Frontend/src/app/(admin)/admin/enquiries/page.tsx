import React from 'react'
import { db } from '@/lib/db'
import EnquiriesManagementClient from '@/components/admin/EnquiriesManagementClient'

export const dynamic = 'force-dynamic'

export default async function AdminEnquiriesPage() {
  const [enquiries, admins] = await Promise.all([
    db.enquiry.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            locationLine: true,
          },
        },
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
        notes: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        replies: {
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
          orderBy: { sentAt: 'desc' },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    db.adminUser.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const serialized = enquiries.map((e: any) => ({
    ...e,
    submittedAt: e.submittedAt.toISOString(),
    readAt: e.readAt ? e.readAt.toISOString() : null,
    closedAt: e.closedAt ? e.closedAt.toISOString() : null,
    notes: (e.notes || []).map((n: any) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    replies: (e.replies || []).map((r: any) => ({
      ...r,
      sentAt: r.sentAt.toISOString(),
    })),
  }))

  return <EnquiriesManagementClient initialEnquiries={serialized} admins={admins} />
}
