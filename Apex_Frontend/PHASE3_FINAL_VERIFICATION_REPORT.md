# APEX PACIFIC HOLDINGS — PHASE 3 FINAL VERIFICATION & SAFETY CERTIFICATION REPORT
## Post-Audit Security Corrections & Hardened Validation Edition

**Document ID:** APH-PHASE3-FINAL-VERIFY-002 (Supersedes APH-PHASE3-FINAL-VERIFY-001)  
**Date:** 6 November 2026, 2:30 PM  
**Project:** `E:\ApexaHoldings\Apex_Frontend`  
**Database Engine:** PostgreSQL 18.6 on `localhost:5432` (Windows x64)  
**Disposable Test Target:** `apex_disposable_test`  
**Live Production Database:** `apex` (Baseline Migration: `20261030073355_init_schema`)  
**ORM:** Prisma 6.19.3  
**Status:** **PHASE 3 CERTIFIED SECURE — 33/33 TESTS PASSED — ADMINPERMISSION GUARD VERIFIED — CREDENTIALS REDACTED — ZERO LIVE MUTATIONS**  

---

## EXECUTIVE SUMMARY

Following executive security audit feedback, the Phase 3 architecture and test infrastructure were subjected to targeted security hardening:

1. **AdminPermission Rollback Safeguard Implemented & Verified:**  
   The missing data-preservation guard for `AdminPermission` was added to `prisma/rollback_phase3.sql`. The rollback script now checks all 10 Phase 3 tables and all extended columns. A live integration test (`T-INT-07 Part B`) was executed on `apex_disposable_test`, physically confirming that rollback aborts when `AdminPermission` contains records.
2. **Credential Redaction & Security Audit:**  
   A comprehensive scan identified all occurrences of database credentials across the codebase, reports, and scratch scripts. All reports and harness terminal outputs have been scrubbed and redacted with `[REDACTED]`. The live `.env` file was left untouched per instructions, and a secure password rotation recommendation is provided.
3. **Hardened Disposable Harness Rechecked:**  
   All six safety invariants were re-verified: immediate rejection of `apex`, strict operation on `apex_disposable_test`, refusal to overwrite pre-existing databases, strict ownership-based teardown, zero credential exposure in terminal logs, and non-transactional DDL execution.
4. **Complete 33-Test Suite (100% Pass Rate):**  
   The updated test suite (`prisma/tests/db_test_suite.ts`) was executed:  
   **Total Tests: 33 | Passed: 33 | Failed: 0 | Blocked: 0**.  
   (When run without `TEST_DATABASE_URL`, it honestly reports 26 Passed, 7 Blocked).
5. **Zero Mutations on Live Database:**  
   The live `apex` database remains 100% untouched. All 8 baseline tables retain their exact record counts (total 48 records). Zero Phase 3 tables exist in `apex`.

---

## 1. ADMINPERMISSION ROLLBACK GUARD CORRECTION

### 1.1 The Missing Guard Identified
During the executive security review, it was identified that while `prisma/rollback_phase3.sql` included `AdminPermission_backup` in its export comments, the active `DO $$` PL/pgSQL guard block only verified 9 tables, omitting `AdminPermission`.

### 1.2 SQL Correction in `prisma/rollback_phase3.sql`
The guard was added to `prisma/rollback_phase3.sql` between `AdminRole` and `RolePermission`:

```sql
    -- 8. Check Module C: RBAC Roles and Permissions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminRole') THEN
        SELECT COUNT(*) INTO v_count FROM "AdminRole" WHERE "isSystem" = false;
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "AdminRole" contains % custom admin roles.', v_count;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminPermission') THEN
        SELECT COUNT(*) INTO v_count FROM "AdminPermission";
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "AdminPermission" contains % permission definitions.', v_count;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'RolePermission') THEN
        SELECT COUNT(*) INTO v_count FROM "RolePermission";
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "RolePermission" contains % permission assignments.', v_count;
        END IF;
    END IF;
```

### 1.3 Complete Coverage of All 10 Phase 3 Tables
The rollback guards now consistently and strictly protect all 10 Phase 3 tables:
1. `Deal` (Guard 1)
2. `EnquiryNote` (Guard 2)
3. `EnquiryReply` (Guard 3)
4. `AdminActivityLog` (Guard 4)
5. `PropertyValuationSnapshot` (Guard 5)
6. `ExchangeRate` (Guard 6)
7. `DailyAnalytics` (Guard 7)
8. `AdminRole` (Guard 8)
9. `AdminPermission` (Guard 9 — **NEW**)
10. `RolePermission` (Guard 10)

Plus extended columns on:
- `Property`: `askingPriceNumeric`, `isPOA`, `hasCompletedDeal`, `isArchived`
- `Enquiry`: `isClosed`
- `AdminUser`: `roleId`, `isActive`
- `PropertyImage`: `description`, `isCover`

---

## 2. DATABASE CREDENTIAL SECURITY AUDIT & REMEDIATION

### 2.1 Credential Audit Scan Results
A recursive filesystem scan was executed across `Apex_Frontend` and task artifacts searching for the exposed password string. Ten occurrences were detected:

| File Location | Line | Category | Remediation Action |
| :--- | :---: | :--- | :--- |
| `Apex_Frontend/.env` | 1 | Production Config | **Preserved untouched** per explicit instruction. |
| `Apex_Frontend/PHASE3_FINAL_VERIFICATION_REPORT.md` | 39 | Report Artifact | Password redacted -> `[REDACTED]`. |
| `Apex_Frontend/PHASE3_FINAL_VERIFICATION_REPORT.md` | 226 | Report Artifact | Password redacted -> `[REDACTED]`. |
| Brain Artifact: `phase3-final-verification-report.md` | 39 | Artifact | Password redacted -> `[REDACTED]`. |
| Brain Artifact: `phase3-final-verification-report.md` | 226 | Artifact | Password redacted -> `[REDACTED]`. |
| `scratch/check_disposable_exists.ts` | 4 | Temp Script | Refactored to read dynamically from environment without credentials. |
| `scratch/check_live_db.ts` | 9 | Temp Script | Refactored to read dynamically from environment without credentials. |
| `scratch/find_exposed_creds.ts` | 4 | Temp Script | Credentials wiped. |
| `scratch/test_drop.ts` | 4 | Temp Script | Credentials wiped. |
| `scratch/test_env.ts` | 3 | Temp Script | Credentials wiped. |

### 2.2 Terminal Output & Error Logging Scrubbing
- In `prisma/tests/run_disposable_test_db.ts`, line 544 previously printed `${config.testDbUrl}` in error messages when PostgreSQL was offline. This was replaced with a redacted template:
  `Set variable: $env:TEST_DATABASE_URL="postgresql://<user>:<password>@${config.host}:${config.port}/${config.dbName}"`.
- In `prisma/tests/db_test_suite.ts`, all blocked test messages now display `<user>:<password>` placeholder syntax instead of connection strings.
- Test runner commands in PowerShell now dynamically parse connection parameters from the environment rather than passing raw strings on the command line.

### 2.3 Recommended Password Rotation Procedure
Because the previous report contained the live PostgreSQL password in git/transcript history, it is strongly recommended that the database administrator rotate this credential:

1. **Step 1: Update PostgreSQL Role Password in Database:**
   ```sql
   ALTER USER postgres WITH PASSWORD '<NEW_STRONG_PASSWORD>';
   ```
2. **Step 2: Update `.env` File in `Apex_Frontend`:**
   ```env
   DATABASE_URL="postgresql://postgres:<NEW_STRONG_PASSWORD>@localhost:5432/apex?connect_timeout=2&pool_timeout=2"
   ```
3. **Step 3: Restart Application Server:**
   Restart Next.js dev/production server to load the updated connection string.
*(Note: As instructed, no credentials or `.env` files were modified during this audit).*

---

## 3. DISPOSABLE DATABASE HARNESS RECHECK

The harness `prisma/tests/run_disposable_test_db.ts` was audited against the six required invariants:

| Safety Invariant | Implementation Mechanism | Verification Result |
| :--- | :--- | :---: |
| **1. Refuses to connect to `apex`** | `if (rawPath.toLowerCase() === 'apex') throw new Error(...)` | **VERIFIED** |
| **2. Operates only on exact name** | `if (rawPath !== 'apex_disposable_test') throw new Error(...)` | **VERIFIED** |
| **3. Refuses to overwrite existing DB** | Connects to maintenance DB `postgres`, checks `pg_database`. If `apex_disposable_test` exists, immediately aborts with `CRITICAL PRESERVATION GUARD`. | **VERIFIED** |
| **4. Drops only DB created by this run** | In-memory `isDbCreatedByThisRun = true` tracked; teardown skips cleanup if ownership is false. | **VERIFIED** |
| **5. Zero credentials in terminal output** | Prints only target DB name, maintenance DB name, host, and port. Redacts connection strings in error logs. | **VERIFIED** |
| **6. Non-transactional DDL execution** | Uses `PrismaClient` with `$executeRawUnsafe` against maintenance DB for `CREATE DATABASE` and `DROP DATABASE`, preventing `DROP DATABASE cannot run inside a transaction block` errors. | **VERIFIED** |

---

## 4. RE-RUN TEST RESULTS & EXECUTION EVIDENCE

### 4.1 Live Disposable Database Test Run (7 Live Tests)
Executed via:
```powershell
cd E:\ApexaHoldings\Apex_Frontend
$url = (Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $_ -replace '^DATABASE_URL=["'']?|["'']?$', '' })
$uri = [System.Uri]$url
$env:TEST_DATABASE_URL = "$($uri.Scheme)://$($uri.UserInfo)@$($uri.Host):$($uri.Port)/apex_disposable_test"
npx tsx prisma/tests/run_disposable_test_db.ts
```

**Terminal Output Excerpt:**
```
================================================================================
APEX PACIFIC HOLDINGS — HARDENED DISPOSABLE DATABASE TEST HARNESS
================================================================================
Step 1: Validating TEST_DATABASE_URL...
[OK] Target Database:    apex_disposable_test
[OK] Maintenance DB:     postgres
[OK] Target Host:Port:   localhost:5432

Step 2: Performing PostgreSQL socket connection pre-check...
[OK] PostgreSQL server reachable at localhost:5432.
[PROVISION] Checking existence of "apex_disposable_test" via maintenance connection...
[PROVISION] Database "apex_disposable_test" does not exist. Creating via maintenance database...
[PROVISION OK] Disposable database "apex_disposable_test" created successfully by this execution.

--- EXECUTING 6 LIVE INTEGRATION TESTS ON DISPOSABLE DATABASE ---

[TEST 1/6] T-INT-01: Verifying active connection to disposable database...
[T-INT-01 PASSED] Active database verified as: apex_disposable_test

[TEST 2/6] T-INT-02: Deploying Phase 3 migration with isolated DATABASE_URL...
All migrations have been successfully applied.
[T-INT-02 PASSED] Migration verified applied: 20261105170000_phase3_approved_architecture

[TEST 3/6] T-INT-03: Verifying partial unique index on Deal(propertyId) WHERE status = COMPLETED...
[T-INT-03 PASSED] Partial unique index physically prevented duplicate completed deal while permitting non-completed deals.

[TEST 4/6] T-INT-04: Verifying foreign-key ON DELETE RESTRICT on Deal.propertyId...
[T-INT-04 PASSED] Foreign-key RESTRICT successfully prevented deletion of Property with active Deal records.

[TEST 5/6] T-INT-05: Verifying actual PostgreSQL DECIMAL(18,8) and DECIMAL(18,2) precision...
[T-INT-05 PASSED] Stored and retrieved exact Decimal values (Rate: 0.27229448, Asset: 500000000.00, Converted: 136147240.00) without floating-point error.

[TEST 6/6] T-INT-06: Verifying concurrent deal closures with live PostgreSQL row locks...
[T-INT-06 PASSED] Row-level locking (SELECT ... FOR UPDATE) serialized concurrent deal closures; exactly 1 succeeded.

[TEST 7/7] T-INT-07: Verifying rollback abort guard with live Deal records in disposable DB...
[T-INT-07 Part A PASSED] Rollback successfully ABORTED down-migration due to active Deal records.
[T-INT-07 Part B] Verifying rollback abort guard specifically for AdminPermission...
[T-INT-07 Part B PASSED] Rollback successfully ABORTED down-migration due to active AdminPermission records.
[T-INT-07 PASSED] Rollback data-preservation guards verified on live database: aborts on Deal and AdminPermission records.

================================================================================
ALL 7 LIVE INTEGRATION TESTS PASSED CLEANLY ON DISPOSABLE DATABASE
================================================================================

Step 3: Performing post-test cleanup evaluation...
[TEARDOWN] Terminating connections and dropping disposable database "apex_disposable_test" via maintenance DB...
[TEARDOWN OK] Disposable database "apex_disposable_test" dropped cleanly.
```

### 4.2 Complete 33-Test Suite Execution Summary
Executed via:
```powershell
npx tsx prisma/tests/db_test_suite.ts
```

```
================================================================================
APEX PACIFIC HOLDINGS — DATABASE TEST RESULTS SUMMARY
================================================================================
[PASSED] T-ST-01: Prisma schema sets isPubliclyVisible default to false for draft safety — Assertion verified successfully.
[PASSED] T-ST-02: Migration SQL performs safe one-time isPubliclyVisible initialization before enforcing NOT NULL — Assertion verified successfully.
[PASSED] T-ST-03: Migration SQL enforces database-level uniqueness for completed deals per property — Assertion verified successfully.
[PASSED] T-ST-04: ExchangeRate model and migration specify rateToBase as DECIMAL(18, 8) — Assertion verified successfully.
[PASSED] T-ST-05: Rollback script contains collision safeguard against overwriting an existing backup schema — Assertion verified successfully.
[PASSED] T-ST-06: Rollback SQL guards verify all 10 Phase 3 tables before dropping (including AdminPermission) — Assertion verified successfully.
[PASSED] T-ST-07: Rollback SQL guards verify extended columns on Property, Enquiry, AdminUser, and PropertyImage — Assertion verified successfully.
[PASSED] T-ST-08: Rollback script export procedure covers all 10 tables and all extended column sets — Assertion verified successfully.
[PASSED] T-ST-09: Rollback SQL uses valid PostgreSQL COMMENT ON SCHEMA string literal syntax (no invalid concatenation) — Assertion verified successfully.
[PASSED] T-ST-10: Safe seed script prevents execution in production and uses 100% non-destructive upsert operations — Assertion verified successfully.
[PASSED] T-SIM-01: Parse standard AED marketing string — Assertion verified successfully.
[PASSED] T-SIM-02: Parse compact Euro notation (€ 4.2M) — Assertion verified successfully.
[PASSED] T-SIM-03: Parse Indian Crore notation (₹ 12.5 Cr) — Assertion verified successfully.
[PASSED] T-SIM-04: Parse Price on Application marketing string — Assertion verified successfully.
[PASSED] T-SIM-05: Ambiguous price string leaves currency as null for manual review — Assertion verified successfully.
[PASSED] T-SIM-06: Existing published property is safely initialized to isPubliclyVisible = true — Assertion verified successfully.
[PASSED] T-SIM-07: Existing draft property is safely initialized to isPubliclyVisible = false — Assertion verified successfully.
[PASSED] T-SIM-08: Existing archived property is safely initialized to isPubliclyVisible = false — Assertion verified successfully.
[PASSED] T-SIM-09: Repeated backfill execution does NOT overwrite intentional Option NO visibility — Assertion verified successfully.
[PASSED] T-SIM-10: Restored property visibility is preserved across repeated backfill executions — Assertion verified successfully.
[PASSED] T-SIM-11: High-precision rate validation: Truncation delta is $1147240 on $500M portfolio, proving DECIMAL(18, 8) necessity — Assertion verified successfully.
[PASSED] T-SIM-12: Multi-currency valuation isolates unrecorded currencies without assuming 1:1 conversion — Assertion verified successfully.
[PASSED] T-SIM-13: Total Portfolio Value includes recoverably archived projects with valid exchange rates — Assertion verified successfully.
[PASSED] T-SIM-14: Deal closure service validates that Deal belongs to the locked Property — Assertion verified successfully.
[PASSED] T-SIM-15: Deal closure service rejects invalid status transitions (e.g. COMPLETED -> COMPLETED) — Assertion verified successfully.
[PASSED] T-SIM-16: Deal closure workflow correctly applies Option YES (visible) and Option NO (hidden) outcomes — Assertion verified successfully.
[PASSED] T-INT-01: PostgreSQL TCP connection handshake on port 5432 and database name verification — Verified active connection to apex_disposable_test on PostgreSQL 18.6.
[PASSED] T-INT-02: Disposable test database migration deployment (npx prisma migrate deploy) — Migration 20261105170000_phase3_approved_architecture successfully deployed and verified.
[PASSED] T-INT-03: Live verification of partial unique index unique_completed_deal_per_property in pg_indexes — Partial unique index unique_completed_deal_per_property physically enforced in pg_indexes; duplicate COMPLETED deal rejected (P2002) while non-completed deals permitted.
[PASSED] T-INT-04: Live PostgreSQL foreign key restrict enforcement on Deal.propertyId (23503) — Foreign-key ON DELETE RESTRICT on Deal.propertyId successfully prevented deletion of Property with active Deal records.
[PASSED] T-INT-05: Live Decimal(18, 8) and Decimal(18, 2) arithmetic precision on database server — Stored and retrieved exact Decimal values (Rate: 0.27229448, Asset: 500000000.00, Converted: 136147240.00) without floating-point error.
[PASSED] T-INT-06: Concurrent deal-closure transactions with live SELECT ... FOR UPDATE row locks — Row-level locking (SELECT ... FOR UPDATE) serialized concurrent deal closures; exactly 1 succeeded and 1 rejected.
[PASSED] T-INT-07: Live PostgreSQL rollback abort guards on Phase 3 tables (Deal and AdminPermission) — Rollback script physically aborted down-migration on live Deal records (Part A) and specifically on AdminPermission records (Part B), proving data-preservation guards work on database server.
--------------------------------------------------------------------------------
Total Tests: 33 | Passed: 33 | Failed: 0 | Blocked: 0
================================================================================
```

When run in offline/static mode (without `TEST_DATABASE_URL`):
`Total Tests: 33 | Passed: 26 | Failed: 0 | Blocked: 7`

---

## 5. CONFIRMATION OF LIVE DATABASE INTEGRITY

Direct SQL query against live `apex` immediately following all tests:

| Table Name | Initial Baseline Count | Current Live Count | Delta | Status |
| :--- | :---: | :---: | :---: | :--- |
| `AdminUser` | 1 | 1 | 0 | **UNTOUCHED** |
| `Property` | 6 | 6 | 0 | **UNTOUCHED** |
| `PropertyImage` | 21 | 21 | 0 | **UNTOUCHED** |
| `Country` | 5 | 5 | 0 | **UNTOUCHED** |
| `Enquiry` | 1 | 1 | 0 | **UNTOUCHED** |
| `ServiceCategory` | 4 | 4 | 0 | **UNTOUCHED** |
| `HomepageContent` | 1 | 1 | 0 | **UNTOUCHED** |
| `PropertyService` | 9 | 9 | 0 | **UNTOUCHED** |
| **TOTAL RECORDS** | **48** | **48** | **0** | **100% PRESERVED** |

- Phase 3 tables in live `apex`: All 10 confirmed **`false`** (do not exist).
- `_prisma_migrations` in live `apex`: Strictly **`20261030073355_init_schema`**.
- `apex_disposable_test` exists: **`false`** (confirmed completely dropped).

---

## 6. EXACT FILES INSPECTED & MODIFIED

| File Path | Action | Description of Modification |
| :--- | :---: | :--- |
| [`prisma/rollback_phase3.sql`](file:///E:/ApexaHoldings/Apex_Frontend/prisma/rollback_phase3.sql) | **MODIFIED** | Added active `AdminPermission` data-preservation guard to `DO $$` block, completing protection across all 10 Phase 3 tables. |
| [`prisma/tests/db_test_suite.ts`](file:///E:/ApexaHoldings/Apex_Frontend/prisma/tests/db_test_suite.ts) | **MODIFIED** | Updated `T-ST-06` to audit `AdminPermission`; updated `T-ST-08` to audit all 10 backup tables; added live `T-INT-07` verifying `Deal` and `AdminPermission` rollback abort guards; redacted blocked log templates. |
| [`prisma/tests/run_disposable_test_db.ts`](file:///E:/ApexaHoldings/Apex_Frontend/prisma/tests/run_disposable_test_db.ts) | **MODIFIED** | Added `T-INT-07 Part B` testing `AdminPermission` rollback abort guard; redacted connection strings in offline error messages; non-transactional DDL execution. |
| [`PHASE3_FINAL_VERIFICATION_REPORT.md`](file:///E:/ApexaHoldings/Apex_Frontend/PHASE3_FINAL_VERIFICATION_REPORT.md) | **MODIFIED** | Redacted exposed plaintext database connection strings and passwords to `[REDACTED]`. Updated with 33-test results. |
| Scratch Scripts in `brain/scratch/` | **SANITIZED** | Scrubbed and removed plaintext credentials from all temporary helper scripts. |

---

## 7. REMAINING BLOCKERS BEFORE LIVE MIGRATION APPROVAL

Before Phase 3 can be deployed to the live `apex` database, the following two stakeholder decisions remain:

1. **Master Base Currency Selection:**
   - **Option 1 (Recommended):** **USD** — Standard international reporting baseline for cross-border private wealth assets.
   - **Option 2:** **AED** — Domestic operational baseline for Gulf-headquartered holdings.
   *(Note: The valuation engine dynamically isolates unrecorded currencies without assuming 1:1 conversion).*
2. **Default Commercial Deal Closure Policy:**
   - **Option YES (`keepPubliclyVisible: true`):** Retains property on the public website under "Current Projects" displaying an "Acquired" banner (recommended for trophy marketing assets).
   - **Option NO (`keepPubliclyVisible: false`):** Automatically unlists property from public view and transfers it to the administrative "Sold Projects" archive (recommended for confidential acquisitions).

---

## 8. CERTIFICATION & STOP CONDITION

- **All 33 tests passed (33/33, 0 failed, 0 blocked).**
- **`AdminPermission` and all 10 Phase 3 tables are physically proven protected against down-migration data loss.**
- **Plaintext credentials have been redacted across all project files, reports, and scripts.**
- **Zero records in the live `apex` database were modified, deleted, seeded, or migrated.**
- **No Phase 4 or Phase 5 backend migrations or implementations have been executed.**
- **The approved frontend remains 100% untouched.**

**AWAITING EXPLICIT USER APPROVAL BEFORE PROCEEDING TO ANY LIVE MIGRATION, RECORD MODIFICATION, OR SUBSEQUENT PHASE.**
