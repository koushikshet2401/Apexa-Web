import { PrismaClient } from '@prisma/client';

async function checkSpecificProperties() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex?schema=public' } }
  });

  const res = await prisma.$queryRawUnsafe(`
    SELECT p.name, p.slug, pi.id, pi.url, pi."order", pi.alt
    FROM "PropertyImage" pi
    JOIN "Property" p ON p.id = pi."propertyId"
    WHERE p.name ILIKE '%Aurelia%' OR p.name ILIKE '%Marble%' OR p.name ILIKE '%Verdant%'
    ORDER BY p.name, pi."order" ASC;
  `);

  console.log('Results:');
  res.forEach(r => {
    console.log(`${r.name} (#${r.order}, ID: ${r.id}): ${r.url}`);
  });

  await prisma.$disconnect();
}

checkSpecificProperties();
