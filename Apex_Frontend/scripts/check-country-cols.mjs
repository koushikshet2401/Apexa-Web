import { PrismaClient } from '@prisma/client';

async function checkCountryCols() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex?schema=public' } }
  });
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Country'
    ORDER BY ordinal_position;
  `);
  console.log('Columns in Country:');
  cols.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
  await prisma.$disconnect();
}
checkCountryCols();
