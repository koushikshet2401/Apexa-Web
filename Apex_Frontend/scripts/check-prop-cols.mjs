import { PrismaClient } from '@prisma/client';

async function checkColumns() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:ehasan2026@localhost:5432/apex?schema=public'
      }
    }
  });

  try {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Property'
      ORDER BY ordinal_position;
    `);
    console.log('Columns in Property table:');
    cols.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
