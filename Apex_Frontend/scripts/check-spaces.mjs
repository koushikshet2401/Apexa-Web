import { PrismaClient } from '@prisma/client'

const p = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public' } }
})

async function check() {
  const spaces = await p.property.findMany({
    where: { isSpaceInRound: true },
    select: {
      id: true,
      name: true,
      slug: true,
      spaceOrder: true,
      isPublished: true,
      isPubliclyVisible: true,
      isArchived: true,
      spaceRoundImage: true,
      mainImage: true,
    },
    orderBy: { spaceOrder: 'asc' },
  })
  console.log(`Found ${spaces.length} spaces in round:`)
  for (const s of spaces) {
    console.log(`- [Slot ${s.spaceOrder}] ${s.name} (${s.slug}) | pub: ${s.isPublished} | img: ${(s.spaceRoundImage || s.mainImage)?.slice(0, 60)}`)
  }
  await p.$disconnect()
}

check()
