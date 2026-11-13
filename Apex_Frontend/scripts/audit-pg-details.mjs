import { PrismaClient } from '@prisma/client';

async function checkPostgres() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:ehasan2026@localhost:5432/apex?schema=public'
      }
    }
  });

  try {
    const versionRes = await prisma.$queryRawUnsafe('SELECT version();');
    console.log('PostgreSQL Version:', versionRes[0].version);

    const settingsRes = await prisma.$queryRawUnsafe(`
      SELECT name, setting, unit, short_desc 
      FROM pg_settings 
      WHERE name IN (
        'max_connections', 
        'shared_buffers', 
        'work_mem', 
        'statement_timeout', 
        'lock_timeout', 
        'idle_in_transaction_session_timeout',
        'wal_level',
        'archive_mode'
      );
    `);
    console.log('\nDatabase Settings:');
    settingsRes.forEach(r => {
      console.log(`- ${r.name}: ${r.setting}${r.unit ? ' ' + r.unit : ''} (${r.short_desc})`);
    });

    const connRes = await prisma.$queryRawUnsafe("SELECT count(*) as active_connections FROM pg_stat_activity WHERE datname = 'apex';");
    console.log('\nCurrent Active Connections to apex:', connRes[0].active_connections);

  } catch (err) {
    console.error('Error checking PostgreSQL:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPostgres();
