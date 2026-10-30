import React from 'react'
import { db } from '@/lib/db'
import SpaceInRoundClient from '@/components/admin/SpaceInRoundClient'

export const dynamic = 'force-dynamic'

export default async function AdminSpaceInRoundPage() {
  const [spaceProperties, candidates] = await Promise.all([
    db.property.findMany({
      where: { isSpaceInRound: true },
      include: {
        country: {
          select: { displayName: true, slug: true },
        },
      },
      orderBy: { spaceOrder: 'asc' },
    }),
    db.property.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        name: true,
        slug: true,
        isSpaceInRound: true,
        country: {
          select: { displayName: true, slug: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <SpaceInRoundClient
      initialItems={spaceProperties}
      availableCandidates={candidates}
    />
  )
}
