import { PrismaClient } from '@prisma/client'

const p = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test' } }
})

async function run() {
  // Check which properties have isSpaceInRound: true
  const spaces = await p.property.findMany({
    where: { isSpaceInRound: true },
    select: {
      id: true,
      name: true,
      isArchived: true,
      isPublished: true,
      spaceOrder: true,
      country: { select: { name: true } }
    },
    orderBy: { spaceOrder: 'asc' }
  })

  console.log('Current Space In Round records in DB:')
  for (const s of spaces) {
    console.log(`- Slot ${s.spaceOrder}: ${s.name} (${s.country?.name}) [isArchived: ${s.isArchived}, isPublished: ${s.isPublished}]`)
  }

  // Clear isSpaceInRound on archived properties
  const cleared = await p.property.updateMany({
    where: {
      isSpaceInRound: true,
      isArchived: true,
    },
    data: {
      isSpaceInRound: false,
      spaceOrder: null,
    }
  })
  console.log(`\nCleared isSpaceInRound on ${cleared.count} archived properties.`)

  // Re-sequence remaining active space-in-round properties
  const activeSpaces = await p.property.findMany({
    where: {
      isSpaceInRound: true,
      isArchived: false,
    },
    orderBy: { spaceOrder: 'asc' }
  })

  for (let i = 0; i < activeSpaces.length; i++) {
    await p.property.update({
      where: { id: activeSpaces[i].id },
      data: { spaceOrder: i + 1 }
    })
  }

  console.log(`Re-sequenced ${activeSpaces.length} remaining active carousel slots:`)
  const updatedSpaces = await p.property.findMany({
    where: { isSpaceInRound: true },
    select: { id: true, name: true, spaceOrder: true, country: { select: { name: true } } },
    orderBy: { spaceOrder: 'asc' }
  })
  for (const s of updatedSpaces) {
    console.log(`- Slot ${s.spaceOrder}: ${s.name} (${s.country?.name})`)
  }

  await p.$disconnect()
}

run().catch(console.error)
