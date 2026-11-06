# APEX PACIFIC HOLDINGS — PHASE 5 ARCHITECTURE SPECIFICATION & APPROVAL GATE

**Document ID:** `APH-PHASE5-ARCH-SPEC-002`  
**Date:** 6 November 2026, 1:35 PM  
**Project:** `E:\ApexaHoldings\Apex_Frontend`  
**Framework:** Next.js 15 App Router  
**Database Engine:** PostgreSQL 18.6 (`apex` on `localhost:5432`)  
**ORM:** Prisma 6.19.3  
**Document Status:** **Architecture Specification Awaiting Final Stakeholder Sign-Off**  
*(Strictly Pre-Implementation: Zero Application Code, Database Migrations, or Database Records Modified)*  

---

## 1. EXPLICIT DATABASE CONCURRENCY & TRANSACTION ISOLATION

### 1.1 Limitation of Standard Transactions
In PostgreSQL and Prisma, executing `prisma.$transaction(async (tx) => { ... })` with standard `findUnique()` operations operates under PostgreSQL's default `READ COMMITTED` isolation level. Under `READ COMMITTED`, two concurrent transactions reading the same row will both see the uncommitted state, resulting in lost updates, race conditions, or duplicate deal completions unless explicit row-level locks are acquired.

### 1.2 Canonical Lock Ordering (Deadlock Immunity)
To guarantee deadlock-free concurrency across all project and deal operations, transactions must acquire row-level locks in a strict canonical hierarchy:

$$\text{Lock Order: } \mathbf{Property} \longrightarrow \mathbf{Deal}$$

1. **Step 1 (Parent Lock):** Acquire an exclusive row lock on the `Property` record:
   ```sql
   SELECT id, "hasCompletedDeal", "isPublished", "isArchived", "updatedAt"
   FROM "Property"
   WHERE id = $1
   FOR UPDATE;
   ```
2. **Step 2 (Child Lock):** Acquire an exclusive row lock on the `Deal` record:
   ```sql
   SELECT id, "propertyId", status, "dealRef"
   FROM "Deal"
   WHERE id = $1
   FOR UPDATE;
   ```

Because every transaction locks `Property` before `Deal`, circular lock waits (deadlocks) are mathematically eliminated.

### 1.3 Two-Tier Enforcement of One-Completed-Deal-Per-Property

#### Tier 1: Database-Level Partial Unique Index
Application-level locks can be bypassed by manual SQL or concurrent service bugs. Therefore, an ironclad database-level constraint must be introduced in the Phase 3 schema:

```sql
-- PostgreSQL Partial Unique Index
CREATE UNIQUE INDEX "Deal_one_completed_deal_per_property" 
ON "Deal" ("propertyId") 
WHERE status = 'COMPLETED';
```
- **PostgreSQL Guarantee:** PostgreSQL physically forbids more than one row with `status = 'COMPLETED'` for any given `propertyId`.
- **Constraint Handling:** Any concurrent transaction attempting to complete a second deal triggers PostgreSQL error code `23505` (`unique_violation`), mapped by Prisma to error code `P2002`.

#### Tier 2: Application-Level In-Transaction Verification
Inside the locked transaction:
```typescript
// 1. Lock Property
const [property]: any[] = await tx.$queryRaw`
  SELECT id, "hasCompletedDeal", "isPublished", "isArchived"
  FROM "Property"
  WHERE id = ${propertyId}
  FOR UPDATE;
`
if (!property) throw new NotFoundError('Property not found')
if (property.hasCompletedDeal) {
  throw new ConflictError(
    'Conflict: This property already has a completed deal. Exactly one completed deal per property is permitted for Phase 5.'
  )
}

// 2. Lock Deal
const [deal]: any[] = await tx.$queryRaw`
  SELECT id, status, "dealRef"
  FROM "Deal"
  WHERE id = ${dealId}
  FOR UPDATE;
`
if (!deal) throw new NotFoundError('Deal not found')
if (deal.status === 'COMPLETED') {
  throw new ConflictError(`Conflict: Deal ${deal.dealRef} has already been completed.`)
}
```

#### HTTP 409 Conflict Contract
Any detected concurrency collision (whether caught by the `FOR UPDATE` check or the PostgreSQL `23505` unique index constraint) immediately aborts the transaction and returns:
- **HTTP Status:** `409 Conflict`
- **Response Payload:**
  ```json
  {
    "error": "Conflict: Another transaction concurrently completed a deal or modified this property.",
    "code": "CONCURRENT_DEAL_CONFLICT"
  }
  ```

---

## 2. CANONICAL DEAL API CONTRACT & RBAC AUDIT

### 2.1 Endpoint Reconciliation: Canonical `/complete` vs Alias `/close`
- **Canonical Endpoint:** `POST /api/admin/deals/[id]/complete`  
  This represents the canonical, fully validated contract for commercial transaction finalization.
- **Backward-Compatibility Alias:** `POST /api/admin/deals/[id]/close`  
  Implemented as a thin router delegation pointing directly to the canonical `/complete` handler:
  ```typescript
  // src/app/api/admin/deals/[id]/close/route.ts
  export { POST } from '../complete/route'
  ```

### 2.2 Actual Phase 4 Permission Catalogue Audit

An exact inspection of `src/lib/rbac.ts` reveals the following status:

| Permission Name | String Identifier | Status in `src/lib/rbac.ts` | Required Action |
| :--- | :--- | :---: | :--- |
| `DEALS_READ` | `'DEALS:READ'` | **EXISTS** | None (Active in Phase 4) |
| `DEALS_CLOSE` | `'DEALS:CLOSE'` | **EXISTS** | None (Active in Phase 4 — guards `/complete` and `/close`) |
| `DEALS_CREATE` | `'DEALS:CREATE'` | **ABSENT** | **Must be formally registered** |
| `DEALS_UPDATE` | `'DEALS:UPDATE'` | **ABSENT** | **Must be formally registered** |
| `PROPERTIES_PERMANENT_DELETE`| `'PROPERTIES:PERMANENT_DELETE'`| **ABSENT** | **Must be formally registered** |

### 2.3 Formal Registration Specifications

#### 1. Code-Level Catalogue Update (`src/lib/rbac.ts`)
```typescript
export const PERMISSIONS = {
  // Existing Properties permissions...
  PROPERTIES_READ: 'PROPERTIES:READ',
  PROPERTIES_CREATE: 'PROPERTIES:CREATE',
  PROPERTIES_UPDATE: 'PROPERTIES:UPDATE',
  PROPERTIES_DELETE: 'PROPERTIES:DELETE',
  PROPERTIES_PUBLISH: 'PROPERTIES:PUBLISH',
  // PROPOSED ADDITION (Phase 5 Requirement):
  PROPERTIES_PERMANENT_DELETE: 'PROPERTIES:PERMANENT_DELETE',

  // Deals permissions
  DEALS_READ: 'DEALS:READ',       // EXISTING
  DEALS_CLOSE: 'DEALS:CLOSE',     // EXISTING
  // PROPOSED ADDITIONS (Phase 5 Requirement):
  DEALS_CREATE: 'DEALS:CREATE',
  DEALS_UPDATE: 'DEALS:UPDATE',
  
  // Existing User, Role, Media, Content, Analytics permissions...
} as const
```

#### 2. Database `AdminPermission` Registration
The seed and migration definitions must insert the missing permission records:
- `('PROPERTIES', 'PERMANENT_DELETE', 'Permanently purge unencumbered project records from database')`
- `('DEALS', 'CREATE', 'Create new buyer inquiries and deal negotiations')`
- `('DEALS', 'UPDATE', 'Update deal progress, negotiation notes, and mark deals lost')`

#### 3. Strict Role Mappings
- `DEALS:CREATE` and `DEALS:UPDATE` $\longrightarrow$ Assigned to `SUPER_ADMIN` and `MANAGER` roles.
- `DEALS:CLOSE` $\longrightarrow$ Assigned to `SUPER_ADMIN` and `MANAGER` roles.
- `PROPERTIES:PERMANENT_DELETE` $\longrightarrow$ Assigned **strictly and exclusively** to `SUPER_ADMIN`.

---

## 3. COMPLETE PERMANENT-DELETION RECOVERY & EXTERNAL MEDIA CLEANUP SPECIFICATION

### 3.1 Pre-Purge Comprehensive Snapshot Contract
Before any `Property` row can be deleted from PostgreSQL, the system must generate an immutable, self-contained JSON snapshot stored inside `AdminActivityLog.metadata`:

```typescript
export interface ProjectPrePurgeSnapshot {
  snapshotVersion: '1.0'
  snapshotTimestamp: string // ISO 8601
  purgedByAdminId: string
  purgedByAdminEmail: string
  property: {
    id: string
    slug: string
    name: string
    cardLabel: string | null
    tagline: string | null
    shortDescription: string | null
    description: string
    type: string
    // Exact Decimal string representation (avoids float conversion)
    askingPriceNumeric: string | null
    askingCurrency: string | null
    isPOA: boolean
    bedroomsCount: number | null
    bathroomsCount: string | null
    areaNumeric: string | null
    areaUnit: string
    cityName: string
    locationLine: string | null
    latitude: number | null
    longitude: number | null
    mainImage: string
    mainVideoUrl: string | null
    mainVideoThumb: string | null
    spaceRoundImage: string | null
    highlights: string[]
    layoutVariant: number
    countryId: string
    createdAt: string
    updatedAt: string
    archivedAt: string
    archivedById: string
    archivedReason: string
  }
  country: {
    id: string
    slug: string
    name: string
    displayName: string
  }
  images: Array<{
    id: string
    url: string
    alt: string | null
    description: string | null
    isCover: boolean
    order: number
  }>
  services: Array<{
    serviceId: string
    serviceSlug: string
    serviceName: string
  }>
}
```

### 3.2 Non-Destructive Financial & Audit Guards
Permanent deletion is **strictly blocked** if any of the following exist:
1. `tx.deal.count({ where: { propertyId: id } }) > 0`: **Blocked with HTTP 409 Conflict.** (Deals are never deleted).
2. `tx.propertyValuationSnapshot.count({ where: { propertyId: id } }) > 0`: **Blocked with HTTP 409 Conflict.** (Valuation snapshots are never deleted).
3. If complete snapshot generation fails: **Transaction rolls back immediately.**

### 3.3 Durable Outbox Pattern for External Media Deletion
To prevent partial failure (e.g. database row deleted, but R2 delete fails or network aborts):

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ATOMIC DATABASE TRANSACTION (tx)                     │
│  1. Verify zero deals, zero valuation snapshots, cooling-off elapsed. │
│  2. Write complete Pre-Purge Snapshot into AdminActivityLog.          │
│  3. Insert media delete tasks into durable MediaDeletionOutbox table.  │
│  4. Delete Property row (cascades to PropertyImage & PropertyService). │
│  5. COMMIT TRANSACTION                                                 │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ (Transaction Committed Safely)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               RETRYABLE ASYNCHRONOUS MEDIA CLEANUP WORKER              │
│  1. Read pending tasks from MediaDeletionOutbox.                       │
│  2. Delete files from Cloudflare R2 / local uploads folder.            │
│  3. Mark task completed in outbox.                                     │
│  4. If R2 fails/times out: Retry with exponential backoff.             │
└────────────────────────────────────────────────────────────────────────┘
```
- **Failsafe Invariant:** The database deletion is committed atomically with the snapshot. If Cloudflare R2 experiences an outage, the database state remains 100% consistent and retryable. External media failure never corrupts the audit record.

---

## 4. FINANCIAL PRECISION & DECIMAL-SAFE INPUT HANDLING

### 4.1 Strict Avoidance of Floating-Point Arithmetic
JavaScript `number` uses IEEE-754 double-precision floating-point arithmetic. High-value property transactions (e.g. AED 45,000,000.50) subject to floating-point multiplication suffer from binary precision drift and rounding anomalies.

### 4.2 Exact Decimal String Validation
All monetary and area inputs must be ingested as **exact decimal strings** (or parsed through strict string validators) and converted directly to `Prisma.Decimal`:

```typescript
import { Decimal } from '@prisma/client/runtime/library'
import { z } from 'zod'

// Validates exact decimal string with up to 2 fractional digits
export const MonetaryDecimalSchema = z.string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be an exact decimal monetary string with up to 2 decimal places')
  .refine((val) => {
    try {
      const d = new Decimal(val)
      return d.greaterThan(0) && d.lessThanOrEqualTo(new Decimal('9999999999999999.99'))
    } catch {
      return false
    }
  }, 'Monetary value must be positive and within Decimal(18,2) precision bounds')

// Schema ingestion
export const ProjectFinancialInputSchema = z.object({
  askingPrice: MonetaryDecimalSchema.optional(),
  askingCurrency: z.enum(ISO_CURRENCIES).optional(),
  isPOA: z.boolean().default(false),
})
```

### 4.3 Database Monetary Precision Preservation
- **`Property.askingPriceNumeric`:** `DECIMAL(18, 2)` (Up to 16 integer digits, 2 fractional decimal places).
- **`Deal.actualSalePrice`:** `DECIMAL(18, 2)`.
- **`Deal.actualSalePriceBase`:** `DECIMAL(18, 2)`.
- **`ExchangeRate.rateToBase`:** `DECIMAL(18, 8)` (High precision to prevent FX rounding truncation).
- **Calculations:** Any valuation snapshot conversion must use `Decimal.mul()` and `Decimal.div()`:
  $$\text{convertedValuation} = \text{actualSalePrice} \times \text{rateToBase}$$
  Calculated entirely within arbitrary-precision `Decimal` objects before committing to PostgreSQL.

---

## 5. PERMANENT-DELETE AUTHORIZATION & APPROVED BASELINE IDENTITY

### 5.1 RBAC Enforcement Gate
1. **Permission Check:** Requires `PROPERTIES:PERMANENT_DELETE`. (Currently absent from catalogue; must be formally registered and assigned exclusively to `SUPER_ADMIN`).
2. **Role Gate:** Requires `session.role === 'SUPER_ADMIN'`.
3. **Reconciliation Against Approved Baseline Identity:**
   - The Phase 4 certified baseline administrator identity:
     $$\texttt{APPROVED\_BASELINE\_ADMIN\_ID} = \text{"cmvw\_apex\_superadmin\_01"}$$
     $$\texttt{APPROVED\_BASELINE\_ADMIN\_EMAIL} = \text{"admin@apexpacific.com"}$$
   - When the system operates in fallback mode prior to Phase 3 RBAC table deployment, permanent deletion is permitted **only** if the caller's JWT ID and email match these exact certified constants.
   - Any other administrator account (including newly created admin users) cannot invoke permanent deletion under any circumstances.
4. **Current Inactive State:** Permanent deletion remains **completely disabled** until the permission is registered and identity verification passes.

---

## 6. BUSINESS DECISIONS (EXPLICITLY PENDING STAKEHOLDER APPROVAL)

The following 4 business rules are **NOT** approved and are explicitly recorded as pending executive sign-off:

| Decision Item | Proposed Default Rule | Alternative Option | Status |
| :--- | :--- | :--- | :---: |
| **1. Archive Cooling-Off Window** | Asset must reside in `isArchived = true` status for $\ge 30$ calendar days before permanent purge is unlocked. | Immediate permanent purge permitted for `SUPER_ADMIN` on any deal-free asset. | **PENDING STAKEHOLDER APPROVAL** |
| **2. Off-Market Deal Workflow** | Deals can **only** be completed on `PUBLISHED` properties. Draft deals are strictly forbidden. | Create an off-market deal workflow permitting direct `DRAFT → COMPLETED DEAL` transitions. | **PENDING STAKEHOLDER APPROVAL** |
| **3. Inventory Granularity** | Exactly **one completed deal per property asset**. Multi-unit inventory is excluded from Phase 5. | Support multiple active deals on master developments with discrete sub-unit allocations. | **PENDING STAKEHOLDER APPROVAL** |
| **4. Custom Display Price Override** | Auto-formatted copy (`price = "AED 8.2M"`) is used by default, but an administrator can supply custom display copy (e.g. `"Guide Price AED 8.2M"`). | System strictly and automatically overwrites display copy with standard formatted string. | **PENDING STAKEHOLDER APPROVAL** |

---

## 7. PHASE 3 DEPENDENCY & VERIFICATION GATES

### 7.1 Hard Database Dependency
Phase 5 backend implementation **cannot proceed on the live database** until the approved Phase 3 migration is executed. The live PostgreSQL database is on migration `20261030073355_init_schema` and lacks:
- Columns: `Property.askingPriceNumeric`, `Property.isArchived`, `Property.isPubliclyVisible`, `Property.hasCompletedDeal`, etc.
- Tables: `Deal`, `ExchangeRate`, `PropertyValuationSnapshot`, `AdminActivityLog`.
- `AdminUser.sessionVersion` (required for Phase 4 multi-instance revocation).

### 7.2 Required Migration Deployment & Verification Sequence
When stakeholder approval is granted, the implementation must proceed through these sequential verification gates:

```
┌────────────────────────────────────────────────────────────────────────┐
│ GATE 1: PREPARATION & SESSION VERSION SQL                              │
│ - Append sessionVersion INTEGER NOT NULL DEFAULT 1 to AdminUser table  │
│   in migration.sql.                                                    │
│ - Verify migration SQL syntax on disposable test harness.              │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ GATE 2: STAKEHOLDER MIGRATION DEPLOYMENT AUTHORIZATION                 │
│ - Explicit user authorization to execute prisma migrate deploy on live │
│   apex database.                                                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ GATE 3: POST-MIGRATION ZERO-MUTATION DATA AUDIT                        │
│ - Confirm 48 existing records across 8 tables remain 100% intact.      │
│ - Verify all new columns have applied defaults without data loss.      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ GATE 4: BACKEND SERVICE & API IMPLEMENTATION (SUB-PHASES 5.2 - 5.6)   │
│ - Implement Zod schemas, ProjectService, Deal endpoints, and tests.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## STRICT STOP CONDITIONS CONFIRMATION

In strict compliance with instructions:
- **No application code was written or modified.**
- **No Prisma schema modifications were made.**
- **No migrations were created or executed (`prisma migrate deploy` was NOT run).**
- **No database pushes or resets were executed (`prisma db push` was NOT run).**
- **No database records were created, modified, or seeded.**
- **No administrator accounts or permissions were modified.**
- **No frontend files or UI components were changed.**
- **Phase 6 was NOT started.**

**WE HAVE STOPPED HERE.** This document represents the corrected architecture specification. We await your final stakeholder sign-off and deployment authorization before proceeding.
