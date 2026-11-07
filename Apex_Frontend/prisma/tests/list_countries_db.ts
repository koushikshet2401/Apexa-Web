import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test' } }
})

async function listCountries() {
  const countries = await prisma.country.findMany()
  console.log('Countries in apex_disposable_test:', countries.map(c => ({ id: c.id, name: c.name, slug: c.slug })))
}

listCountries().finally(() => prisma.$disconnect())
