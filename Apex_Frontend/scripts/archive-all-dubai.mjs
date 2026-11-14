import { PrismaClient } from '@prisma/client'

const p = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test' } }
})

async function run() {
  const dubai = await p.country.findFirst({ where: { slug: 'dubai' } })
  if (!dubai) return

  const updated = await p.property.updateMany({
    where: {
      countryId: dubai.id,
      isArchived: false,
    },
    data: {
      isArchived: true,
      isPublished: false,
      isPubliclyVisible: false,
      isFeaturedLaunch: false,
      launchOrder: null,
      isSpaceInRound: false,
      spaceOrder: null,
      archivedAt: new Date(),
      archivedReason: 'User requested clearing all Dubai properties to add fresh data',
    }
  })

  console.log(`Archived ${updated.count} remaining Dubai properties.`)

  const activeDubaiCount = await p.property.count({
    where: { countryId: dubai.id, isArchived: false }
  })
  console.log(`Active Dubai properties in DB now: ${activeDubaiCount}`)

  await p.$disconnect()
}

run().catch(console.error)
