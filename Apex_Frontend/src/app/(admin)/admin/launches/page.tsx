import React from 'react'
import { db } from '@/lib/db'
import LaunchesManagementClient from '@/components/admin/LaunchesManagementClient'

export const dynamic = 'force-dynamic'

export default async function AdminLaunchesPage() {
  const [launches, candidates] = await Promise.all([
    db.property.findMany({
      where: { isFeaturedLaunch: true },
      include: {
        country: {
          select: { name: true, displayName: true, slug: true },
        },
      },
      orderBy: [{ launchOrder: 'asc' }, { launchDate: 'desc' }],
    }),
    db.property.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        name: true,
        slug: true,
        isFeaturedLaunch: true,
        country: {
          select: { displayName: true, slug: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  // Map launchDate to string for serializable client props
  const serializedLaunches = launches.map((l) => ({
    ...l,
    launchDate: l.launchDate ? l.launchDate.toISOString() : null,
  }))

  return (
    <LaunchesManagementClient
      initialLaunches={serializedLaunches}
      availableCandidates={candidates}
    />
  )
}
