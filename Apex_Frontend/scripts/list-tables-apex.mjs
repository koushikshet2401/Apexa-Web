import { PrismaClient } from '@prisma/client';

async function listTables() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex?schema=public' } }
  });
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('Tables in apex:');
  tables.forEach(t => console.log(`- ${t.table_name}`));
  await prisma.$disconnect();
}
listTables();
