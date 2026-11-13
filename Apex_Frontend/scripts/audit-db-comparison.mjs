import { PrismaClient } from '@prisma/client'

const pProd = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex?schema=public' } },
})
const pDisp = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public' } },
})

async function getDbDetails(client, dbName) {
  const currentDb = await client.$queryRawUnsafe('SELECT current_database() AS db')
  if (currentDb[0].db !== dbName) {
    throw new Error(`Connected to ${currentDb[0].db} instead of expected ${dbName}`)
  }

  // 1. Tables
  const tables = await client.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `)
  const tableNames = tables.map((t) => t.table_name)

  // 2. Columns
  const columns = await client.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `)

  // 3. Migrations
  const migrations = await client.$queryRawUnsafe(`
    SELECT id, migration_name, finished_at, rolled_back_at, applied_steps_count
    FROM "_prisma_migrations"
    ORDER BY finished_at ASC;
  `)

  // 4. Row counts per table
  const rowCounts = {}
  for (const t of tableNames) {
    try {
      const cnt = await client.$queryRawUnsafe(`SELECT count(*)::int AS cnt FROM "${t}"`)
      rowCounts[t] = cnt[0].cnt
    } catch (e) {
      rowCounts[t] = `ERROR: ${e.message}`
    }
  }

  // 5. Indexes
  const indexes = await client.$queryRawUnsafe(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `)

  // 6. Foreign key constraints
  const foreignKeys = await client.$queryRawUnsafe(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
    ORDER BY tc.table_name, kcu.column_name;
  `)

  return {
    dbName,
    tableNames,
    columns,
    migrations,
    rowCounts,
    indexes,
    foreignKeys,
  }
}

async function main() {
  console.log('=== PHASE 10: DATABASE COMPARISON AUDIT (READ-ONLY) ===\n')

  const prod = await getDbDetails(pProd, 'apex')
  const disp = await getDbDetails(pDisp, 'apex_disposable_test')

  console.log(`[TABLES COMPARISON]`)
  console.log(`Production 'apex' tables (${prod.tableNames.length}):`, prod.tableNames.join(', '))
  console.log(`Disposable 'apex_disposable_test' tables (${disp.tableNames.length}):`, disp.tableNames.join(', '))

  const missingInProdTables = disp.tableNames.filter((t) => !prod.tableNames.includes(t))
  const missingInDispTables = prod.tableNames.filter((t) => !disp.tableNames.includes(t))
  console.log(`Tables in Disposable but NOT in Production:`, missingInProdTables.length ? missingInProdTables : 'None (Tables match)')
  console.log(`Tables in Production but NOT in Disposable:`, missingInDispTables.length ? missingInDispTables : 'None (Tables match)')

  console.log(`\n[MIGRATIONS COMPARISON]`)
  console.log(`Production 'apex' migrations (${prod.migrations.length}):`)
  prod.migrations.forEach((m) => console.log(`  - ${m.migration_name} (Applied: ${m.finished_at})`))
  console.log(`\nDisposable 'apex_disposable_test' migrations (${disp.migrations.length}):`)
  disp.migrations.forEach((m) => console.log(`  - ${m.migration_name} (Applied: ${m.finished_at})`))

  const prodMigNames = prod.migrations.map((m) => m.migration_name)
  const dispMigNames = disp.migrations.map((m) => m.migration_name)
  const unappliedMigrations = dispMigNames.filter((m) => !prodMigNames.includes(m))
  console.log(`\nUnapplied Migrations in Production:`, unappliedMigrations)

  console.log(`\n[ROW COUNTS COMPARISON]`)
  console.log(`Table Name`.padEnd(30), `Production 'apex'`.padEnd(20), `Disposable 'test'`)
  console.log('-'.repeat(70))
  for (const t of disp.tableNames) {
    const pCnt = prod.rowCounts[t] ?? 'MISSING'
    const dCnt = disp.rowCounts[t] ?? 'MISSING'
    console.log(t.padEnd(30), String(pCnt).padEnd(20), String(dCnt))
  }

  console.log(`\n[COLUMN DIFFERENCES BY TABLE]`)
  const colMap = (cols) => {
    const map = new Map()
    for (const c of cols) {
      map.set(`${c.table_name}.${c.column_name}`, c)
    }
    return map
  }
  const prodCols = colMap(prod.columns)
  const dispCols = colMap(disp.columns)

  const missingColsInProd = []
  for (const [key, c] of dispCols.entries()) {
    if (!prodCols.has(key)) {
      missingColsInProd.push({ table: c.table_name, column: c.column_name, type: c.data_type, nullable: c.is_nullable })
    }
  }

  const missingColsInDisp = []
  for (const [key, c] of prodCols.entries()) {
    if (!dispCols.has(key)) {
      missingColsInDisp.push({ table: c.table_name, column: c.column_name, type: c.data_type, nullable: c.is_nullable })
    }
  }

  console.log(`Columns present in Disposable but MISSING in Production (${missingColsInProd.length}):`)
  for (const c of missingColsInProd) {
    console.log(`  + ${c.table}.${c.column} (${c.type}, nullable: ${c.nullable})`)
  }

  console.log(`\nColumns present in Production but MISSING in Disposable (${missingColsInDisp.length}):`)
  for (const c of missingColsInDisp) {
    console.log(`  - ${c.table}.${c.column} (${c.type}, nullable: ${c.nullable})`)
  }

  // Type or Nullability discrepancies
  console.log(`\n[COLUMN DEFINITION MISMATCHES]`)
  let mismatches = 0
  for (const [key, dCol] of dispCols.entries()) {
    if (prodCols.has(key)) {
      const pCol = prodCols.get(key)
      if (dCol.data_type !== pCol.data_type || dCol.is_nullable !== pCol.is_nullable) {
        console.log(`  ! Mismatch in ${key}: Prod(${pCol.data_type}, null:${pCol.is_nullable}) vs Disp(${dCol.data_type}, null:${dCol.is_nullable})`)
        mismatches++
      }
    }
  }
  if (mismatches === 0) console.log('  None. All shared columns have identical types and nullability.')

  console.log(`\n[INDEXES & CONSTRAINTS]`)
  console.log(`Production indexes: ${prod.indexes.length}, Disposable indexes: ${disp.indexes.length}`)
  console.log(`Production foreign keys: ${prod.foreignKeys.length}, Disposable foreign keys: ${disp.foreignKeys.length}`)
}

main()
  .catch((e) => {
    console.error('AUDIT ERROR:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pProd.$disconnect()
    await pDisp.$disconnect()
  })
