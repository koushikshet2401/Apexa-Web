# APEX PACIFIC HOLDINGS — PHASE 3 FINAL SAFETY AUDIT
## Code-Level Pre-Execution Safety Audit & Verification Report

**Project Root:** `E:\ApexaHoldings\Apex_Frontend`  
**Audit Timestamp:** 2026-11-06T10:15:00+05:30  
**Audit Mode:** Code Inspection, Static Verification & Invariant Analysis (Zero Database Execution)

---

## 1. Executive Summary & Verification Classification

This audit performs an exhaustive, code-level safety verification of all Phase 3 deliverables prior to executing any PostgreSQL tests.

In strict compliance with instructions:
- **No connection or modification to the real `apex` database was made.**
- **No migrations, backfills, seed scripts, or rollbacks were executed.**
- **Zero records were deleted, modified, or reset.**
- **Phase 4 has NOT been initiated.**
- **All frontend pages, routes, luxury Framer Motion animations, layouts, and dual Light/Dark themes remain 100% intact.**

### Summary of Audit Classifications

| Audit Area | Scope Inspected | Classification | Summary Assessment |
| :--- | :--- | :---: | :--- |
| **1. Disposable Harness Isolation** | `prisma/tests/run_disposable_test_db.ts` | **FAIL** | Harness lacks explicit database name validation, lacks refusal if pointing to `apex`, attempts to drop the database while connected to it, and lacks cleanup teardown. **Unsafe to run in current state.** |
| **2. Backup & Restore Specifications** | `prisma/rollback_phase3.sql` & Backup SOP | **PASS** | Complete coverage of all 10 tables and extended columns; collision guard verified; guards precede drops; distinction between table copy and `pg_dump` documented; comprehensive restore drill specified. |
| **3. Migration & Schema Consistency** | `schema.prisma`, `migration.sql`, `backfill.ts` | **PASS** | 100% alignment across models, columns, defaults, nullability, foreign keys, and indexes. `isPubliclyVisible` safe initialization verified. Idempotent backfill verified. |
| **4. Deal Concurrency & Integrity** | `prisma/deal_service.ts`, `migration.sql` | **PASS (Code)**<br>**NOT VERIFIED (Live)** | Code logic correctly uses `SELECT ... FOR UPDATE`, checks ownership, rejects invalid status transitions, and applies partial unique index. Live concurrency unverified due to PostgreSQL offline. |

---

## 2. Section 1: Disposable Database Isolation Audit

### Files Inspected
- [`Apex_Frontend/prisma/tests/run_disposable_test_db.ts`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/tests/run_disposable_test_db.ts)

### Detailed Verification Findings

| Verification Criterion | Expected Behavior | Actual Implementation | Status |
| :--- | :--- | :--- | :---: |
| **Explicit `TEST_DATABASE_URL` Read & Validation** | Script must read `process.env.TEST_DATABASE_URL` and parse URL using `new URL()`. | Line 14: `const TEST_DB_URL = process.env.TEST_DATABASE_URL \|\| ...` reads string but does not parse URL components. | **FAIL** |
| **Database Name Matching** | Resolved database name must exactly equal `apex_disposable_test`. | No URL pathname extraction or equality check against `'apex_disposable_test'`. | **FAIL** |
| **Refusal if Target is `apex`** | Harness must abort immediately if target database resolves to `apex`. | No check exists to reject `apex`. If a developer passes `TEST_DATABASE_URL=".../apex"`, it would target the real database. | **FAIL** |
| **No Fallback to Production Connection** | Must not fall back to `process.env.DATABASE_URL`. | Script falls back to a localhost template with `TEST_DB_NAME`, not `DATABASE_URL`. | **PASS** |
| **Connection on Database Creation/Drop** | Must connect to maintenance DB (`postgres`) to drop/create target DB. | Line 56 connects to `TEST_DB_URL` (`apex_disposable_test`) to execute `DROP DATABASE apex_disposable_test`, which causes PostgreSQL error `cannot drop the currently open database`. | **FAIL** |
| **Automated Cleanup** | Must drop `apex_disposable_test` upon test completion in `finally` block. | Lines 157-159: Disconnects Prisma client but performs **no cleanup drop** of `apex_disposable_test`. | **FAIL** |
| **Safe Stop on Connection Failure** | Connection socket pre-check must halt execution without throwing. | Lines 25-51: Socket check cleanly catches offline server and exits with status 0. | **PASS** |

### Safety Verdict on Harness
> [!CAUTION]
> **HARNESS IS CURRENTLY UNSAFE TO RUN.**  
> It must NOT be executed until the required isolation validation, maintenance DB routing, and cleanup procedures are applied.

### Required Corrections for `run_disposable_test_db.ts`
1. **Explicit URL Parsing & Strict Database Name Enforcement:**
   ```typescript
   if (!process.env.TEST_DATABASE_URL) {
     throw new Error("SAFETY ABORT: TEST_DATABASE_URL environment variable must be explicitly defined.");
   }
   const parsedUrl = new URL(process.env.TEST_DATABASE_URL);
   const targetDbName = parsedUrl.pathname.replace(/^\//, '');
   if (targetDbName !== 'apex_disposable_test') {
     throw new Error(`SAFETY ABORT: Target database must be exactly "apex_disposable_test", got "${targetDbName}".`);
   }
   if (targetDbName.toLowerCase() === 'apex') {
     throw new Error("CRITICAL SAFETY VIOLATION: Execution against production database 'apex' is strictly forbidden.");
   }
   ```
2. **Maintenance Database Routing for Provisioning:**
   Construct a maintenance URL pointing to database `postgres` (e.g. `parsedUrl.pathname = '/postgres'`) to execute `DROP DATABASE IF EXISTS apex_disposable_test; CREATE DATABASE apex_disposable_test;`.
3. **Automated Teardown:**
   In the `finally` block, reconnect to maintenance DB and drop `apex_disposable_test`.

---

## 3. Section 2: Backup & Restore Verification

### Files Inspected
- [`Apex_Frontend/prisma/rollback_phase3.sql`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/rollback_phase3.sql)

### Detailed Verification Findings

| Verification Criterion | Verification Evidence | Status |
| :--- | :--- | :---: |
| **Preservation of All Dropped Tables** | Pre-rollback export copies all 10 Phase 3 tables: `Deal`, `EnquiryNote`, `EnquiryReply`, `AdminActivityLog`, `PropertyValuationSnapshot`, `ExchangeRate`, `DailyAnalytics`, `AdminRole`, `AdminPermission`, `RolePermission`. | **PASS** |
| **Preservation of All Extended Columns** | Copies all 17 extended columns on `Property`, 3 on `Enquiry`, 3 on `AdminUser`, and 2 on `PropertyImage`. | **PASS** |
| **Backup Collision Protection** | Lines 30-34: Checks `information_schema.schemata WHERE schema_name = 'apex_rollback_backup'` and raises exception if it exists. | **PASS** |
| **Guard Execution Precedes Drops** | Lines 79-201: All 12 PL/pgSQL guards execute in a `DO $$` block before any `DROP TABLE` or `DROP COLUMN` statement. | **PASS** |
| **No Silent Data Destruction** | Guards abort if $>0$ rows exist in any new table, or if any extended column contains non-default data (`askingPriceNumeric IS NOT NULL`, `isClosed = true`, custom roles). | **PASS** |
| **No False Blocking from Defaults** | Columns populated with defaults (`isPubliclyVisible = true/false`, `areaUnit = 'sqft'`, `isActive = true`) are not checked for equality to default, ensuring fresh migration deployments can roll back cleanly. | **PASS** |

### Table-Copy Exports vs. Full PostgreSQL Backup
- **`CREATE TABLE AS SELECT` (Table Copy):**
  - **Preserves:** Raw cell values only.
  - **Does NOT Preserve:** Primary keys, foreign keys, unique constraints, check constraints, sequence positions, indexes, triggers, or comments.
  - **Classification:** Staging / emergency inspection copy only. Cannot be used for clean relational restore.
- **Full Custom-Archive Backup (`pg_dump -Fc`):**
  - **Preserves:** Complete relational schema, custom types/enums (`DealStatus`), primary/foreign keys, sequence states, check constraints, partial indexes, and table data.
  - **Classification:** Authoritative production backup.

### Enhanced Restore Drill Specification
To prove recoverability, a restore drill must NOT rely solely on `pg_restore --list` (which only reads the archive header). The complete verification SOP requires:
1. `pg_restore -h localhost -p 5432 -U postgres -d apex_restore_drill -v --clean --if-exists "apex_backup.dump"`
2. **Object Inventory Check:** Query `information_schema.tables` to verify all 14 base and Phase 3 tables exist.
3. **Row Count Verification:** Query `COUNT(*)` across all tables to confirm parity with source database.
4. **Constraint Verification:** Query `information_schema.table_constraints` to verify all 12 foreign keys and primary keys are active.
5. **Index Verification:** Query `pg_indexes` to verify all 24 indexes exist, including `unique_completed_deal_per_property`.
6. **Sequence Continuity:** Verify sequence values (`SELECT last_value FROM pg_sequences`) match or exceed max table IDs.

---

## 4. Section 3: Migration & Schema Consistency

### Files Inspected
- [`Apex_Frontend/prisma/schema.prisma`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/schema.prisma)
- [`Apex_Frontend/prisma/migrations/20261105170000_phase3_approved_architecture/migration.sql`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/migrations/20261105170000_phase3_approved_architecture/migration.sql)
- [`Apex_Frontend/prisma/backfill.ts`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/backfill.ts)

### Detailed Verification Findings

| Feature / Artifact | `schema.prisma` | `migration.sql` | `backfill.ts` | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Enum `DealStatus`** | 6 values (`INQUIRY`..`LOST`) | `CREATE TYPE "DealStatus" AS ENUM (...)` | Imported from `@prisma/client` | **PASS** |
| **`isPubliclyVisible` Default** | `Boolean @default(false)` | `ALTER TABLE "Property" ALTER COLUMN "isPubliclyVisible" SET DEFAULT false;` | Initializes only unconfigured rows (`WHERE "isPubliclyVisible" IS NULL`) | **PASS** |
| **One-Time Safe Initialization** | N/A (Declarative) | Lines 180-197: Adds column as nullable, executes `CASE` update, sets `NOT NULL DEFAULT false`. | Queries `WHERE "isPubliclyVisible" IS NULL` (matches 0 rows post-migration). | **PASS** |
| **Preservation of Admin Visibility Choices** | Enforces decoupled flags. | One-time `UPDATE` runs during DDL; never runs again. | Matches 0 rows on repeated executions; never overwrites Option NO deals, private listings, or restored properties. | **PASS** |
| **Exchange Rate Scale** | `rateToBase Decimal @db.Decimal(18, 8)` | `"rateToBase" DECIMAL(18, 8) NOT NULL` | N/A (Exchange rates seeded separately) | **PASS** |
| **Completed-Deal Uniqueness** | N/A (Prisma DSL lacks partial index syntax) | `CREATE UNIQUE INDEX "unique_completed_deal_per_property" ON "Deal"("propertyId") WHERE "status" = 'COMPLETED';` | Enforced at database engine level | **PASS** |
| **All 13 Performance Indexes** | Defined on `Country`, `Property`, `PropertyImage`, `Enquiry`, `AdminUser`. | Exact matching `CREATE INDEX` statements in Section 12. | N/A | **PASS** |
| **DDL Migration Ordering** | N/A | Enum $\rightarrow$ Roles $\rightarrow$ Deals $\rightarrow$ Rates $\rightarrow$ Analytics $\rightarrow$ Enquiries $\rightarrow$ Columns $\rightarrow$ Constraints $\rightarrow$ Indexes. | Strictly non-destructive | **PASS** |

---

## 5. Section 4: Deal Consistency & Concurrency

### Files Inspected
- [`Apex_Frontend/prisma/deal_service.ts`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/deal_service.ts)
- [`Apex_Frontend/prisma/migrations/20261105170000_phase3_approved_architecture/migration.sql`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/migrations/20261105170000_phase3_approved_architecture/migration.sql)

### Detailed Verification Findings

| Concurrency / Integrity Rule | Implementation Mechanism | Code Status | Live DB Status |
| :--- | :--- | :---: | :---: |
| **Pessimistic Row Locking** | Lines 61-68: `SELECT id, "hasCompletedDeal" FROM "Property" WHERE id = $1 FOR UPDATE` executes inside `prisma.$transaction`. | **PASS** | **NOT VERIFIED** (PostgreSQL offline) |
| **Deal-to-Property Ownership** | Lines 83-87: `if (deal.propertyId !== input.propertyId)` throws integrity error. | **PASS** | **NOT VERIFIED** |
| **Invalid Transition Rejection** | Lines 90-98: Explicitly rejects `COMPLETED` and `LOST`. Only allows `INQUIRY`, `CONTACTED`, `OFFER_MADE`, `UNDER_CONTRACT`. | **PASS** | **NOT VERIFIED** |
| **Database-Level One-Sale Rule** | `migration.sql` line 90: Partial unique index `unique_completed_deal_per_property` rejects duplicate completed deals. | **PASS** | **NOT VERIFIED** |
| **Option YES / NO Branching** | Lines 153-158: Option YES sets `isPubliclyVisible = true`; Option NO sets `isPubliclyVisible = false`. | **PASS** | **NOT VERIFIED** |
| **Cache & Authoritative Parity** | `Deal` update and `Property.hasCompletedDeal` update execute in single ACID transaction. | **PASS** | **NOT VERIFIED** |

---

## 6. Execution Capability of Previously Blocked Tests

The 6 tests previously reported as `[BLOCKED]` in `prisma/tests/db_test_suite.ts`:
1. `T-INT-01`: PostgreSQL connection handshake on port 5432.
2. `T-INT-02`: Migration deployment (`npx prisma migrate deploy`).
3. `T-INT-03`: Verification of `unique_completed_deal_per_property` in `pg_indexes`.
4. `T-INT-04`: Foreign key restrict enforcement on `Deal.propertyId` (error `23503`).
5. `T-INT-05`: `Decimal(18, 8)` and `Decimal(18, 2)` arithmetic precision on server.
6. `T-INT-06`: Concurrent `SELECT ... FOR UPDATE` row locks.

**Can the disposable harness execute all six tests?**  
**YES.** Once the isolation corrections identified in Section 1 are implemented, all 6 integration tests can be executed against `apex_disposable_test` without any risk to the real `apex` database.

---

## 7. Next Safe Steps & Exact Commands (DO NOT EXECUTE YET)

Before running any test execution or migration:

### Step 1: Apply Required Isolation Fixes to `run_disposable_test_db.ts`
Implement strict `TEST_DATABASE_URL` parsing, `apex` rejection guard, maintenance database routing for creation/drop, and automated teardown.

### Step 2: Start PostgreSQL Service (Administrator Console)
```powershell
net start postgresql-x64-18
```

### Step 3: Run the Hardened Disposable Database Harness
```powershell
cd E:\ApexaHoldings\Apex_Frontend
$env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/apex_disposable_test"
npx tsx prisma/tests/run_disposable_test_db.ts
```

### Step 4: Take Full Verified Production Backup
```powershell
pg_dump -h localhost -p 5432 -U postgres -d apex -Fc -b -v -f "apex_prod_backup.dump"
```

### Step 5: Await Explicit User Approval Before Real Database Migration
Do not execute `npx prisma migrate deploy` on the `apex` database until Steps 1-4 are completed and reviewed.
