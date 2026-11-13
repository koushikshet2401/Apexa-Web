import { PrismaClient } from '@prisma/client'

const p = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test' },
  },
})

async function chk() {
  const props = await p.property.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      isPublished: true,
      country: { select: { slug: true, name: true } },
    },
  })
  console.log(JSON.stringify(props, null, 2))
}

chk().finally(() => p.$disconnect())
