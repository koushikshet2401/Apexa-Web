import { PrismaClient } from '../node_modules/@prisma/client/default.js'
const p = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test' } }
})

async function run() {
  const res = await p.property.updateMany({
    where: {
      OR: [
        { cityName: { contains: 'Dubai', mode: 'insensitive' } },
        { locationLine: { contains: 'Dubai', mode: 'insensitive' } }
      ],
      isArchived: false,
    },
    data: {
      isArchived: true,
      isPublished: false,
      isPubliclyVisible: false,
      archivedAt: new Date(),
      archivedReason: 'User cleared Dubai portfolio',
    }
  })
  console.log('Archived stray Dubai properties:', res.count)
  await p.$disconnect()
}

run().catch(console.error)
