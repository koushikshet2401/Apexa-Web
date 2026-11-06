# APEX PACIFIC HOLDINGS — PHASE 3 DISPOSABLE HARNESS CORRECTION
## Hardened Test Database Harness Implementation & Safety Verification Report

**Project Root:** `E:\ApexaHoldings\Apex_Frontend`  
**Report File:** `PHASE3_DISPOSABLE_HARNESS_CORRECTION.md`  
**Timestamp:** 2026-11-06T10:22:00+05:30  
**Status:** Code Corrections Complete | Zero Database Mutations Executed | Live Tests Ready

---

## 1. Executive Summary & Strict Restriction Compliance

In response to the `PHASE3_FINAL_SAFETY_AUDIT.md` findings and user requirements, connection status logging has been added to the application database client, and the disposable PostgreSQL test harness has been completely restructured and hardened against accidental execution against production or non-test databases.

### Compliance With Strict Restrictions
- **Zero Real Database Interaction:** The real `apex` database was never connected to, targeted, or modified.
- **Zero Database Operations:** No migrations, backfills, seeds, rollbacks, resets, or drops were executed.
- **Code Freeze Respected:** `schema.prisma`, Phase 3 `migration.sql`, `backfill.ts`, and `deal_service.ts` remain 100% untouched.
- **Phase 4 Guarded:** Phase 4 has **not** been started.
- **Frontend Preserved:** All Next.js routes, Framer Motion animations, layouts, and dual Light/Dark themes remain 100% intact.
- **No Unexecuted Claims:** Static/unit tests are clearly distinguished from live PostgreSQL integration tests.

---

## 2. Complete Inventory of Files Changed

| File Path | Action | Description of Modifications |
| :--- | :---: | :--- |
| [`Apex_Frontend/src/lib/db.ts`](file:///e:/ApexaHoldings/Apex_Frontend/src/lib/db.ts) | **Updated** | Added immediate connection status logging (`[DATABASE] PostgreSQL connected successfully` / `[DATABASE] PostgreSQL connection offline or unreachable: ...`) and exported `testDatabaseConnection()` helper. Safe for Next.js builds. |
| [`Apex_Frontend/prisma/tests/run_disposable_test_db.ts`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/tests/run_disposable_test_db.ts) | **Rewritten** | • Mandatory `TEST_DATABASE_URL` validation using `new URL()`.<br>• Explicit rejection of `apex` and any database name other than `apex_disposable_test`.<br>• Maintenance connection routing via `postgres` database for safe `CREATE`/`DROP`.<br>• Prevents dropping a database while connected to it.<br>• Automated `try/finally` teardown targeting only `apex_disposable_test`.<br>• Implementation of all 6 live integration tests (concurrency, decimal precision, foreign keys, partial unique index). |
| [`Apex_Frontend/prisma/tests/test_harness_safety.ts`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/tests/test_harness_safety.ts) | **Created** | Dedicated static/unit test suite verifying all 10 security invariants of the harness without database or network access. All 10 passed. |

---

## 3. Database Connection Logging Implementation ([`src/lib/db.ts`](file:///e:/ApexaHoldings/Apex_Frontend/src/lib/db.ts))

The primary database connection entry point has been equipped with active connection feedback:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Checks and logs whether the PostgreSQL database is connected or offline.
 * Non-blocking and safe for Next.js builds.
 */
export async function testDatabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    await db.$queryRaw`SELECT 1`
    const msg = '[DATABASE] PostgreSQL connected successfully.'
    console.log(msg)
    return { connected: true, message: msg }
  } catch (err: any) {
    const msg = `[DATABASE] PostgreSQL connection failed: ${err.message}`
    console.warn(msg)
    return { connected: false, message: msg }
  }
}

// Background non-blocking connection probe for immediate log feedback
if (typeof window === 'undefined') {
  db.$queryRaw`SELECT 1`
    .then(() => {
      console.log('[DATABASE] PostgreSQL connected successfully.')
    })
    .catch((err: any) => {
      console.warn('[DATABASE] PostgreSQL connection offline or unreachable:', err.message)
    })
}
```

---

## 4. Safety Checks Implemented in the Harness

### 1. Mandatory `TEST_DATABASE_URL` with No Fallback
The harness explicitly inspects `process.env.TEST_DATABASE_URL`. If the variable is missing, empty, or whitespace, it immediately throws:
`SAFETY ABORT: TEST_DATABASE_URL environment variable must be explicitly defined. No fallback permitted.`  
It never falls back to `DATABASE_URL` or default connection strings.

### 2. URL Parsing & Protocol Validation
Uses Node.js `new URL()`. Ensures protocol is strictly `postgresql:` or `postgres:`. Rejects invalid or malformed strings.

### 3. Strict Database Name Matching & Production Rejection
Extracts `parsedUrl.pathname.replace(/^\//, '')`:
- **Production Guard:** If target resolves to `apex` (case-insensitive, e.g. `apex`, `APEX`), throws:  
  `CRITICAL SAFETY VIOLATION: Execution against the production database 'apex' is strictly prohibited.`
- **Exact Name Enforcement:** If target is anything other than `apex_disposable_test`, throws:  
  `SAFETY ABORT: Target database must be exactly "apex_disposable_test", got "<name>".`

### 4. Separate Maintenance Connection (`postgres`)
- Database provisioning and teardown are **never** executed while connected to `apex_disposable_test`.
- The harness dynamically constructs `maintenanceDbUrl` strictly pointing to `/postgres`.
- SQL commands terminate active connections and execute `DROP DATABASE IF EXISTS "apex_disposable_test"; CREATE DATABASE "apex_disposable_test";` via the maintenance connection only.

### 5. Automated `try/finally` Teardown
Prisma client connects to `apex_disposable_test` **only after** safe creation. Teardown runs in `finally`:
1. Disconnects Prisma client (`await prisma.$disconnect()`).
2. Validates that the target database name is `apex_disposable_test`.
3. Issues `DROP DATABASE IF EXISTS "apex_disposable_test"` via `maintenanceDbUrl`.
4. If cleanup fails, reports the error explicitly without throwing an uncaught exception.

---

## 5. Implementation Status of All Six Live Integration Tests

All 6 live integration tests specified in Phase 3 are **100% implemented** in [`run_disposable_test_db.ts`](file:///e:/ApexaHoldings/Apex_Frontend/prisma/tests/run_disposable_test_db.ts).

| Test ID | Test Category | Implementation Details | Implementation Status | Live DB Execution Status |
| :--- | :--- | :--- | :---: | :---: |
| **T-INT-01** | Connection Handshake | Queries `SELECT current_database()` and asserts target is `apex_disposable_test`. | **100% Implemented** | **Awaiting PostgreSQL Start** |
| **T-INT-02** | Migration Deployment | Executes `npx prisma migrate deploy` and verifies migration in `_prisma_migrations`. | **100% Implemented** | **Awaiting PostgreSQL Start** |
| **T-INT-03** | Partial Unique Index | Asserts that inserting two `COMPLETED` deals on the same property throws unique constraint violation (`23505`/`P2002`), while non-completed deals (`INQUIRY`) succeed. | **100% Implemented** | **Awaiting PostgreSQL Start** |
| **T-INT-04** | FK Restrict Enforcement | Asserts that deleting a `Property` with attached deals throws foreign-key violation (`23503`/`P2003`) and rejects deletion. | **100% Implemented** | **Awaiting PostgreSQL Start** |
| **T-INT-05** | Actual Decimal Precision | Inserts and retrieves `rateToBase` (`0.27229448`), asking price (`500000000.00`), and converted valuation (`136147240.00`). Asserts exact string equality with zero floating-point drift. | **100% Implemented** | **Awaiting PostgreSQL Start** |
| **T-INT-06** | Live Concurrency Locking | Launches competing asynchronous `closeDealTransaction` calls via `Promise.allSettled`. Verifies `SELECT ... FOR UPDATE` row locks allow exactly 1 success, 1 failure, and syncs property cache. | **100% Implemented** | **Awaiting PostgreSQL Start** |
| **Bonus** | Rollback Abort Guard | With live synthetic deals present, attempts to run `rollback_phase3.sql` and asserts that PL/pgSQL abort guard raises exception. | **100% Implemented** | **Awaiting PostgreSQL Start** |

---

## 6. Harness Safety Unit Test Results (Executed & Verified)

The security checks were verified by executing `powershell -Command "cd Apex_Frontend; npx tsx prisma/tests/test_harness_safety.ts"`:

```
================================================================================
RUNNING TEST HARNESS ISOLATION & SAFETY VERIFICATION (STATIC / UNIT)
================================================================================
[SAFETY ERROR] Refusing to teardown unvalidated database "apex"

================================================================================
HARNESS SAFETY VERIFICATION RESULTS SUMMARY
================================================================================
[PASSED] H-SEC-01: Missing TEST_DATABASE_URL environment variable is rejected without silent fallback — Rejected with explicit safety error.
[PASSED] H-SEC-02: Empty or whitespace TEST_DATABASE_URL is rejected — Rejected with explicit safety error.
[PASSED] H-SEC-03: Malformed URL string is rejected by new URL() parser — Rejected with malformed URL error.
[PASSED] H-SEC-04: Non-PostgreSQL protocols (e.g. http://) are rejected — Rejected protocol with explicit error.
[PASSED] H-SEC-05: Targeting the production database name "apex" (or "APEX") is strictly rejected — Both lowercase and uppercase "apex" targets rejected with critical safety violation error.
[PASSED] H-SEC-06: Any database name other than "apex_disposable_test" is rejected — Rejected non-disposable database with exact-name requirement error.
[PASSED] H-SEC-07: Valid URL successfully generates maintenance connection URL pointing to "postgres" — Config validated: DB="apex_disposable_test", MaintDB="postgres", Host="db.internal:5433".
[PASSED] H-SEC-08: Database creation guard aborts if target name is tampered or not "apex_disposable_test" — Creation aborted with explicit security error.
[PASSED] H-SEC-09: Database teardown guard strictly refuses to drop any database other than "apex_disposable_test" — Teardown rejected non-disposable database safely.
[PASSED] H-SEC-10: DROP DATABASE commands execute via "postgres" maintenance connection, never while connected to target DB — Active connection is "postgres", target is "apex_disposable_test". Drop isolation verified.
--------------------------------------------------------------------------------
Total Harness Safety Tests: 10 | Passed: 10 | Failed: 0
================================================================================
```

---

## 7. Remaining Limitations & Operating Prerequisites

1. **PostgreSQL Service Offline:** The PostgreSQL service (`postgresql-x64-18`) on `localhost:5432` is currently stopped. Live integration tests cannot execute until the Windows service is started.
2. **Maintenance Database Existence:** The harness assumes the standard PostgreSQL maintenance database `postgres` exists on the server (the default for all standard PostgreSQL installations).
3. **Privileges:** The user credentials supplied in `TEST_DATABASE_URL` must have PostgreSQL `CREATEDB` permissions to create and drop `apex_disposable_test`.

---

## 8. Exact Commands for Future Disposable Test Run

When authorized to start PostgreSQL and execute the tests:

```powershell
# Step 1: Start PostgreSQL Service (Administrator PowerShell)
net start postgresql-x64-18

# Step 2: Set Explicit TEST_DATABASE_URL in Session
cd E:\ApexaHoldings\Apex_Frontend
$env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/apex_disposable_test"

# Step 3: Run the Hardened Disposable Database Harness
npx tsx prisma/tests/run_disposable_test_db.ts
```
*(This command will provision `apex_disposable_test`, run all 6 integration tests, and cleanly teardown the database without ever touching `apex`).*
