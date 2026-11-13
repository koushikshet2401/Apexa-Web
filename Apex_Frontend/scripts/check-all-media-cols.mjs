import { PrismaClient } from '@prisma/client';

async function checkRemainingCols() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex?schema=public' } }
  });
  for (const table of ['Launch', 'SpaceInRound', 'ServiceCategory', 'HomepageContent', 'OneTeamContent']) {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = '${table}'
      ORDER BY ordinal_position;
    `);
    console.log(`\nColumns in ${table}:`);
    cols.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
  }
  await prisma.$disconnect();
}
checkRemainingCols();
