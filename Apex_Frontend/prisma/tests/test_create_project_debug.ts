import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test' } }
})

async function testCreateProject() {
  const uae = await prisma.country.findFirst({ where: { slug: 'dubai' } })
  console.log('Using country ID:', uae?.id)

  const loginRes = await fetch('http://localhost:3001/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@apexpacificholdings.com', password: 'TestPassword123!' }),
  })

  const cookie = loginRes.headers.get('set-cookie')

  const newSlug = `debug-sky-villa-${Date.now().toString(36)}`
  const res = await fetch('http://localhost:3001/api/admin/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookie || '',
    },
    body: JSON.stringify({
      name: 'The Royal Azure Sky Villa',
      slug: newSlug,
      countryId: uae?.id,
      cityName: 'Dubai Marina',
      locationLine: 'Dubai Marina Penthouse Level',
      type: 'penthouse',
      beds: '5 Bedrooms',
      baths: '6 Baths',
      area: '11,200 sq ft',
      pricingState: 'PRICED',
      priceAmount: '12500000',
      priceCurrency: 'USD',
      shortDescription: 'Spectacular full-floor sky residence overlooking the Arabian Gulf.',
      description: 'An architectural masterpiece featuring bespoke Italian marble, private infinity lap pool, and panoramic marina views.',
      isFeaturedLaunch: false,
      isSpaceInRound: false,
    }),
  })

  console.log('Create Project status:', res.status)
  const data = await res.json()
  console.log('Create Project ID:', data.id)
  console.log('Created project:', data.name, 'Price:', data.price, 'isDraft:', data.isDraft)
}

testCreateProject().finally(() => prisma.$disconnect())
