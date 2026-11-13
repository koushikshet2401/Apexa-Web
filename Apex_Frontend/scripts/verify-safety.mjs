import { PrismaClient } from '@prisma/client'

const pDisp = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public',
    },
  },
})
const pProd = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:ehasan2026@localhost:5432/apex',
    },
  },
})

async function run() {
  const dRes = await pDisp.$queryRawUnsafe('SELECT current_database() AS db')
  const pRes = await pProd.$queryRawUnsafe('SELECT current_database() AS db')
  const pTables = await pProd.$queryRawUnsafe(
    "SELECT count(*)::int AS cnt FROM information_schema.tables WHERE table_schema='public'"
  )
  const pMig = await pProd.$queryRawUnsafe(
    'SELECT count(*)::int AS cnt FROM "_prisma_migrations" WHERE rolled_back_at IS NULL'
  )
  console.log('Disposable DB:', dRes[0].db)
  console.log(
    'Production DB:',
    pRes[0].db,
    'Tables:',
    pTables[0].cnt,
    'Migrations:',
    pMig[0].cnt
  )
  if (dRes[0].db !== 'apex_disposable_test') throw new Error('WRONG TARGET DB')
  if (pRes[0].db !== 'apex' || pTables[0].cnt !== 25 || pMig[0].cnt !== 8) {
    throw new Error('PROD DB TAMPERED')
  }
  console.log('SAFETY CHECK: 100% PASSED')
  await pDisp.$disconnect()
  await pProd.$disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
