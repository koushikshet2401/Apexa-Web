# APEX PACIFIC HOLDINGS — PHASE 5 ARCHITECTURE CORRECTION GATE REPORT

**Document ID:** `APH-PHASE5-ARCH-CORRECTION-001`  
**Date:** 6 November 2026, 1:15 PM  
**Project:** `E:\ApexaHoldings\Apex_Frontend`  
**Framework:** Next.js 15 App Router  
**Database:** PostgreSQL 18.6 (`apex` on `localhost:5432`)  
**ORM:** Prisma 6.19.3  
**Status:** Architecture Correction & Design Specification (Strictly Pre-Implementation)  

---

## 1. CORRECTED PROJECT LIFECYCLE STATE MACHINE

### 1.1 Complete State Model & Decoupled Architecture
The project lifecycle is strictly decoupled from the financial deal lifecycle. A project exists in one of four core states (`DRAFT`, `PUBLISHED`, `ARCHIVED`, `RESTORED_DRAFT`), while deal completion introduces an orthogonal commercial state (`hasCompletedDeal`) that interacts with visibility according to the approved Phase 1 rule.

```
                                  ┌───────────────────────────┐
                                  │           DRAFT           │
                                  │   isDraft: true           │
                                  │   isPublished: false      │
                                  │   isPubliclyVisible: fals.│
                                  │   isArchived: false       │
                                  └─────────────┬─────────────┘
                                                │
                                     publish    │    unpublish
                                                ▼
                                  ┌───────────────────────────┐
                                  │         PUBLISHED         │
                                  │   isDraft: false          │
                                  │   isPublished: true       │
                                  │   isPubliclyVisible: true │
                                  │   isArchived: false       │
                                  └──────┬──────────────┬─────┘
                                         │              │
                   DELETE (Soft Archive) │              │ Deal Closure (COMPLETED)
                                         │              │
                                         ▼              ▼
                   ┌──────────────────────────┐   ┌───────────────────────────┐
                   │         ARCHIVED         │   │      COMPLETED DEAL       │
                   │   isArchived: true       │   │   hasCompletedDeal: true  │
                   │   isPublished: false     │   │                           │
                   │   isPubliclyVisible: fal.│   │   [Admin Choice at Close]:│
                   │   (Soft-Deleted)         │   │   keepPubliclyVisible:    │
                   └─────────────┬────────────┘   │     true  -> Transacted   │
                                 │                │              Showcase     │
                         restore │                │     false -> Unlisted     │
                                 ▼                └───────────────────────────┘
                   ┌──────────────────────────┐
                   │      RESTORED DRAFT      │
                   │   isArchived: false      │
                   │   isDraft: true          │
                   │   isPublished: false     │
                   └──────────────────────────┘
```

### 1.2 Transition Rules & Permitted Operations Matrix

| Current State | Target State | Permitted? | Operation & HTTP Route | Pre-conditions & Guards |
| :--- | :--- | :---: | :--- | :--- |
| `DRAFT` | `PUBLISHED` | **YES** | `POST /api/admin/projects/[id]/publish` (`{ publish: true }`) | Must pass full publish validation (thumbnail, country, price/POA). Must NOT be archived. |
| `PUBLISHED` | `DRAFT` | **YES** | `POST /api/admin/projects/[id]/publish` (`{ publish: false }`) | Sets `isPublished: false, isDraft: true, isPubliclyVisible: false`. |
| `DRAFT` | `ARCHIVED` | **YES** | `DELETE /api/admin/projects/[id]` or `POST .../archive` | Soft-deletes. Captures `archivedAt`, `archivedById`, `archivedReason`. |
| `PUBLISHED` | `ARCHIVED` | **YES** | `DELETE /api/admin/projects/[id]` or `POST .../archive` | Soft-deletes and immediately revokes public visibility. |
| `ARCHIVED` | `DRAFT` | **YES** | `POST /api/admin/projects/[id]/restore` | **Strict Rule:** Always restores to `DRAFT`, never directly to `PUBLISHED`. Requires review. |
| `ARCHIVED` | `PUBLISHED` | **FORBIDDEN** | Direct publish rejected with HTTP `400` | Archived projects must be restored to Draft first before publishing. |
| `PUBLISHED` | `COMPLETED DEAL` | **YES** | `POST /api/admin/deals/[id]/close` | Transitions linked Deal to `COMPLETED`. Administrator chooses `keepPubliclyVisible`. |
| `DRAFT` | `COMPLETED DEAL` | **FORBIDDEN** | Deal closure rejected with HTTP `400` | **Strict Rule:** Deals cannot be completed on unpublished/draft projects. Must be published. |
| `ARCHIVED` | `COMPLETED DEAL` | **FORBIDDEN** | Deal closure rejected with HTTP `400` | Cannot close deals on an archived asset. |
| Any | `PERMANENT DELETE`| **RESTRICTED**| `DELETE /api/admin/projects/[id]/permanent` | Requires `SUPER_ADMIN` role, exact slug confirmation, and zero linked deal records. |

### 1.3 Prevention of Repeat Deal Closure and Conflicting Transitions
1. **Idempotent & Locked Deal Status:** A Deal record has an enum `status` (`INQUIRY | CONTACTED | OFFER_MADE | UNDER_CONTRACT | COMPLETED | LOST`). Once `COMPLETED`, the deal status is immutable. Any repeat call to close returns HTTP `400 Bad Request` ("Deal is already closed on [date]").
2. **Project-Level Flag Locking:** When a deal completes, `Property.hasCompletedDeal` is permanently set to `true`. If another deal is attempted for the same property, the system checks whether the property allows multi-unit transactions (commercial/residential building) or single-asset exclusivity. For single residences, closing a second deal is blocked.
3. **Optimistic Concurrency & Transaction Isolation:**
   - Every state transition executes in an interactive transaction:
     ```typescript
     await db.$transaction(async (tx) => {
       const project = await tx.property.findUnique({ where: { id } })
       if (project.isArchived) throw new ConflictError('Cannot modify an archived project')
       // Execute transition...
     })
     ```
   - If a concurrent admin request archived or updated the project while another request was in flight, the transaction aborts and returns HTTP `409 Conflict`.

---

## 2. CORRECTED DELETION AND ARCHIVE API CONTRACTS

### 2.1 Standard Deletion (Recoverable Archiving)
The standard deletion route executed by the admin list trash icon is converted from a destructive `DELETE` into a **safe, recoverable archive operation**.

- **HTTP Method & Route:** `DELETE /api/admin/projects/[id]` (and alias `DELETE /api/admin/properties/[id]`)
- **Alternative Explicit Route:** `POST /api/admin/projects/[id]/archive`
- **Required Permission:** `PROPERTIES:DELETE` or `PROPERTIES:UPDATE`
- **Request Body (Optional):**
  ```json
  {
    "reason": "Decommissioned from Q4 luxury portfolio"
  }
  ```
- **State Changes:**
  - `isArchived = true`
  - `isPublished = false`
  - `isPubliclyVisible = false`
  - `isDraft = false`
  - `archivedAt = new Date()`
  - `archivedById = session.id`
  - `archivedReason = body.reason || "Archived via administrative action"`
- **Audit Log Entry:** Action `PROJECT_ARCHIVED`, entityType `"Property"`, entityId `id`.
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "message": "Project archived successfully. The project has been safely removed from active listings.",
    "project": {
      "id": "cmvw891m4000bue8kaukwclze",
      "slug": "the-meridian",
      "isArchived": true,
      "archivedAt": "2026-11-06T13:15:00.000Z",
      "archivedReason": "Decommissioned from Q4 luxury portfolio"
    }
  }
  ```

### 2.2 Project Restoration
Restores an archived project back into an editable draft state.

- **HTTP Method & Route:** `POST /api/admin/projects/[id]/restore` (and alias `/properties/[id]/restore`)
- **Required Permission:** `PROPERTIES:UPDATE`
- **State Changes:**
  - `isArchived = false`
  - `isDraft = true`
  - `isPublished = false`
  - `isPubliclyVisible = false`
  - `restoredAt = new Date()`
  - `restoredById = session.id`
- **Audit Log Entry:** Action `PROJECT_RESTORED`.
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "message": "Project restored to Draft state. Please review and update before re-publishing.",
    "project": {
      "id": "cmvw891m4000bue8kaukwclze",
      "isArchived": false,
      "isDraft": true,
      "isPublished": false
    }
  }
  ```

### 2.3 Highly Restricted Permanent Deletion (Purge)
Permanent deletion is isolated into a separate, highly guarded administrative endpoint.

- **HTTP Method & Route:** `DELETE /api/admin/projects/[id]/permanent`
- **Required Authorization:** **`SUPER_ADMIN` Only** (Enforced via `session.role === 'SUPER_ADMIN'` or fallback baseline administrator identity verification).
- **Mandatory Request Confirmation Body:**
  ```json
  {
    "confirmSlug": "the-meridian",
    "acknowledgement": "PERMANENT_PURGE_CONFIRMED"
  }
  ```
- **Strict Dependency & Integrity Checks:**
  1. **Slug Confirmation:** `body.confirmSlug` must match `project.slug` exactly. Mismatch returns HTTP `400 Bad Request` ("Confirmation slug mismatch").
  2. **Deal Dependency Guard:** 
     ```typescript
     const dealCount = await tx.deal.count({ where: { propertyId: id } })
     if (dealCount > 0) {
       return NextResponse.json({
         error: `Cannot permanently delete project: ${dealCount} financial deal record(s) are associated with this asset. Projects with deal history can only be Archived to safeguard audit and accounting integrity.`,
         code: 'DEAL_DEPENDENCY_EXISTS'
       }, { status: 409 })
     }
     ```
  3. **Valuation History Guard:** Any valuation snapshots are audited before cascade.
  4. **Audit History Safeguard:** **Never cascade-delete `AdminActivityLog`.** Historical logs retain `entityType: "Property", entityId: id` with summary noting the asset was permanently purged.
- **Audit Log Entry:** Action `PROJECT_PERMANENTLY_DELETED` with full pre-purge JSON snapshot stored in audit metadata.
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "message": "Project permanently purged from the database. Audit logs retained."
  }
  ```

---

## 3. UNIFIED PUBLIC VISIBILITY RULE

### 3.1 Single Canonical Filter Definition
All public-facing queries across the entire platform must apply one identical, non-negotiable visibility predicate:

$$\text{Publicly Visible} \iff (\texttt{isPublished} = \text{true}) \land (\texttt{isPubliclyVisible} = \text{true}) \land (\texttt{isArchived} = \text{false})$$

In Prisma:
```typescript
export const PUBLIC_PROJECT_VISIBILITY_FILTER = {
  isPublished: true,
  isPubliclyVisible: true,
  isArchived: false,
} as const
```

### 3.2 State Combination Visibility Evaluation

| State / Scenario | `isDraft` | `isPublished` | `isPubliclyVisible` | `isArchived` | `hasCompletedDeal` | Public Visibility | Public Experience Placement |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **New Draft Project** | `true` | `false` | `false` | `false` | `false` | **HIDDEN** | Nowhere (Admin Only) |
| **Active Live Listing** | `false` | `true` | `true` | `false` | `false` | **VISIBLE** | Current Projects Showcase, Country Collections, Search |
| **Archived Project** | `false` | `false` | `false` | `true` | Any | **HIDDEN** | Nowhere (Admin Archive Tab Only) |
| **Completed Deal (Keep Public)** | `false` | `true` | `true` | `false` | `true` | **VISIBLE** | Current Projects Showcase with `"ACQUIRED / PRIVATE TRANSACTION"` Badge |
| **Completed Deal (Unlist)** | `false` | `false` | `false` | `false` | `true` | **HIDDEN** | Excluded from Current Projects; appears in Sold Projects list if enabled |
| **Restored Draft** | `true` | `false` | `false` | `false` | Any | **HIDDEN** | Nowhere (Admin Only) |

### 3.3 Scope of Application
This single rule is applied uniformly across:
1. `GET /api/public/projects` (Paginated search, filter by country/price/type).
2. `GET /api/public/projects/[slug]` (Direct project slug lookups — returns HTTP 404 if filter fails).
3. `GET /api/public/countries/[slug]/projects` (Country-specific collection views).
4. `GET /api/public/launches` (Featured cinematic launches).
5. `GET /api/public/space-in-round` (Spaces in the Round showcase).
6. Server Components: [`LaunchesCinematicStackServer.tsx`](file:///e:/ApexaHoldings/Apex_Frontend/src/components/sections/LaunchesCinematicStackServer.tsx), [`CollectionCountryClient.tsx`](file:///e:/ApexaHoldings/Apex_Frontend/src/components/pages/CollectionCountryClient.tsx), [`CinematicPropertyDetail.tsx`](file:///e:/ApexaHoldings/Apex_Frontend/src/components/property-detail/CinematicPropertyDetail.tsx).

### 3.4 Public Response Data Sanitization
Public responses must strictly strip internal administrative and financial data:
- **Stripped:** `archivedAt`, `archivedById`, `archivedReason`, `restoredAt`, `restoredById`, `internalNotes`.
- **Stripped Deal Information:** `buyerName`, `buyerContact`, `actualSalePrice`, `actualSalePriceBase`, `closedById`.
- **Exposed for Completed Projects Kept Public:** `hasCompletedDeal: true`, display badge `"Acquired"`.

---

## 4. VERIFIED COUNTRY DATA & SCHEMA VERIFICATION

### 4.1 Live Database Record Audit
Direct PostgreSQL query on the live `apex` database verified the exact existing country records:

| Index | Database ID (`cuid`) | Slug | Name | Display Name | Region | Display Order | `isPublished` |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| 0 | `cmvw891ls0001ue8k00f5hqkv` | `dubai` | United Arab Emirates | Dubai / UAE | Middle East | 1 | `true` |
| 1 | `cmvw891lu0002ue8krnqn8nid` | `thailand` | Thailand | Thailand | Southeast Asia | 2 | `true` |
| 2 | `cmvw891lv0003ue8kpytep5c7` | `malaysia` | Malaysia | Malaysia | Southeast Asia | 3 | `true` |
| 3 | `cmvw891lx0004ue8k6qgqgj8u` | `australia` | Australia | Australia | Australasia & Pacific Coast | 4 | `true` |
| 4 | `cmvw891ly0005ue8kzqid9fya` | `georgia` | Georgia | Georgia | Caucasus & Black Sea | 5 | `true` |

### 4.2 Country Publication Field Verification
- **Audit Confirmation:** Column `isPublished` **DOES exist** on table `Country` in the live PostgreSQL database (`data_type: boolean, is_nullable: NO, column_default: true`, ordinal position 12).
- **Prisma Schema Match:** `model Country` includes `isPublished Boolean @default(true)`.
- **API Match:** Existing admin endpoint `src/app/api/admin/countries/[id]/route.ts` already reads and updates `isPublished`.
- **Safety Policy:**
  - Zero country records will be inserted, updated, replaced, or seeded.
  - Project creation/update validation strictly checks that `countryId` exists in this verified set of 5 IDs.
  - If a country has `isPublished: false`, public endpoints querying `/api/public/countries/[slug]/projects` return HTTP 404.

---

## 5. VALIDATION CORRECTIONS & MERGED-STATE VALIDATION

### 5.1 Separation of Creation and Update Schemas
Instead of a single schema, the validation layer ([`src/lib/validations/project.ts`](file:///e:/ApexaHoldings/Apex_Frontend/src/lib/validations/project.ts)) provides two distinct schemas:
1. `CreateProjectSchema`: Enforces all required fields for a new project.
2. `UpdateProjectSchema`: Validates partial payload types and strictly forbids internal lifecycle fields.
3. `validateMergedProjectState()`: Validates the **final merged project entity** before committing changes.

### 5.2 Create Schema (`CreateProjectSchema`)
```typescript
import { z } from 'zod'

export const ISO_CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'THB', 'MYR', 'AUD', 'GEL', 'INR', 'CHF', 'SGD'] as const
export const PROPERTY_TYPES = ['residential', 'commercial', 'penthouse', 'villa', 'estate', 'mixed_use', 'waterfront', 'mansion'] as const
export const AREA_UNITS = ['sqft', 'sqm'] as const

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  countryId: z.string().min(1, 'Country ID is required'),
  cityName: z.string().trim().min(2, 'City name is required').max(100),
  locationLine: z.string().trim().max(255).optional().nullable(),
  
  // Coordinate pairing (both null or both present)
  latitude: z.number().min(-90.0).max(90.0).optional().nullable(),
  longitude: z.number().min(-180.0).max(180.0).optional().nullable(),
  
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().trim().max(500).optional().nullable(),
  tagline: z.string().trim().max(300).optional().nullable(),
  cardLabel: z.string().trim().max(60).optional().nullable(),
  type: z.enum(PROPERTY_TYPES),
  serviceIds: z.array(z.string()).optional().default([]),
  
  // Numeric specifications
  bedroomsCount: z.number().int().min(0).max(50).optional().nullable(),
  bathroomsCount: z.number().min(0).max(50).step(0.5).optional().nullable(),
  areaNumeric: z.number().positive('Area must be a positive number').optional().nullable(),
  areaUnit: z.enum(AREA_UNITS).default('sqft'),
  
  // Pricing
  askingPriceNumeric: z.number().positive('Asking price must be positive').optional().nullable(),
  askingCurrency: z.enum(ISO_CURRENCIES).optional().nullable(),
  isPOA: z.boolean().default(false),
  
  // Media
  mainImage: z.string().min(1, 'Thumbnail is required'),
  mainVideoUrl: z.string().optional().nullable(),
  mainVideoThumb: z.string().optional().nullable(),
  
  // Flags
  isFeaturedLaunch: z.boolean().default(false),
  launchOrder: z.number().int().positive().optional().nullable(),
  launchDate: z.string().optional().nullable(),
  isSpaceInRound: z.boolean().default(false),
  spaceOrder: z.number().int().positive().optional().nullable(),
  spaceRoundImage: z.string().optional().nullable(),
  
  layoutVariant: z.number().int().min(1).max(5).default(1),
  highlights: z.array(z.string().trim().max(100)).max(20).default([]),
  isPublished: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // Coordinate pairing
  if ((data.latitude != null && data.longitude == null) || (data.latitude == null && data.longitude != null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Latitude and Longitude must both be provided together or both omitted.',
      path: ['latitude'],
    })
  }
  // POA rule
  if (!data.isPOA && (!data.askingPriceNumeric || !data.askingCurrency)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Numeric asking price and ISO currency are required when Price on Application (isPOA) is false.',
      path: ['askingPriceNumeric'],
    })
  }
  // Spaces in Round image requirement
  if (data.isSpaceInRound && !data.spaceRoundImage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Spaces in the Round image (spaceRoundImage) is required when isSpaceInRound is enabled.',
      path: ['spaceRoundImage'],
    })
  }
})
```

### 5.3 Update Schema (`UpdateProjectSchema`)
Clients cannot pass internal lifecycle, archiving, or deal fields to `PATCH`:
```typescript
export const UpdateProjectSchema = CreateProjectSchema.partial().omit({
  // Strictly forbid tampering with internal lifecycle and audit fields
  isPublished: true, // Handled exclusively via /publish and /unpublish
}).refine((data: any) => {
  const forbiddenFields = [
    'isArchived', 'archivedAt', 'archivedById', 'archivedReason',
    'restoredAt', 'restoredById', 'hasCompletedDeal', 'isPubliclyVisible'
  ]
  for (const f of forbiddenFields) {
    if (f in data) return false
  }
  return true
}, {
  message: 'Internal lifecycle fields (isArchived, hasCompletedDeal, etc.) cannot be modified via PATCH. Use dedicated endpoints.',
})
```

### 5.4 Final Merged-State Validation
When a `PATCH` request arrives:
1. Validate the incoming partial payload with `UpdateProjectSchema`.
2. Retrieve the existing `Property` record from the database.
3. Compute the **merged state**:
   ```typescript
   const merged = { ...existing, ...patch }
   ```
4. Execute cross-field validations on `merged`:
   - **Price & Currency Consistency:** If `merged.isPOA === false`, `merged.askingPriceNumeric` AND `merged.askingCurrency` must be valid and non-null.
   - **Conditional Spaces in Round:** If `merged.isSpaceInRound === true`, `merged.spaceRoundImage` must exist.
   - **Coordinate Pairing:** If either `merged.latitude` or `merged.longitude` is non-null, both must be non-null and within valid ranges (lat: -90..90, lng: -180..180).
   - **Valid Country:** If `patch.countryId` is provided, verify it exists in PostgreSQL `Country`.
   - **Unique Slug:** If `patch.slug` is provided and differs from `existing.slug`, verify uniqueness (`id !== existing.id`).

---

## 6. UPDATED RBAC & AUTHORIZATION MATRIX

Every admin endpoint enforces Phase 4 authentication and granular permissions:

| Endpoint Route | HTTP Method | Required Permission | Required Role | Audit Action Logged | Guard Failures |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/admin/projects` | `GET` | `PROPERTIES:READ` | Any Admin | — | 401 Unauth / 403 Forbidden |
| `/api/admin/projects` | `POST` | `PROPERTIES:CREATE` | Admin / SuperAdmin | `PROJECT_CREATED` | 401 Unauth / 403 Forbidden |
| `/api/admin/projects/[id]` | `GET` | `PROPERTIES:READ` | Any Admin | — | 401 Unauth / 403 / 404 |
| `/api/admin/projects/[id]` | `PATCH` | `PROPERTIES:UPDATE` | Admin / SuperAdmin | `PROJECT_UPDATED` | 401 Unauth / 403 / 404 |
| `/api/admin/projects/[id]` (Archive)| `DELETE` | `PROPERTIES:DELETE` | Admin / SuperAdmin | `PROJECT_ARCHIVED` | 401 Unauth / 403 / 404 |
| `/api/admin/projects/[id]/archive` | `POST` | `PROPERTIES:UPDATE` | Admin / SuperAdmin | `PROJECT_ARCHIVED` | 401 Unauth / 403 / 404 |
| `/api/admin/projects/[id]/restore` | `POST` | `PROPERTIES:UPDATE` | Admin / SuperAdmin | `PROJECT_RESTORED` | 401 Unauth / 403 / 404 |
| `/api/admin/projects/[id]/publish` | `POST` | `PROPERTIES:PUBLISH` | Admin / SuperAdmin | `PROJECT_PUBLISHED` / `PROJECT_UNPUBLISHED` | 401 Unauth / 403 / 404 |
| `/api/admin/projects/[id]/permanent`| `DELETE` | `PROPERTIES:PERMANENT_DELETE` | **SUPER_ADMIN Only** | `PROJECT_PERMANENTLY_DELETED` | 401 Unauth / 403 Forbidden / 409 Conflict |
| `/api/admin/projects/[id]/images` | `POST` | `PROPERTIES:UPDATE` | Admin / SuperAdmin | `PROJECT_IMAGE_ADDED` | 401 Unauth / 403 / 404 |
| `/api/admin/projects/[id]/images` | `DELETE`| `PROPERTIES:DELETE` | Admin / SuperAdmin | `PROJECT_IMAGE_DELETED` | 401 Unauth / 403 / 404 |
| `/api/public/projects` | `GET` | Public (None) | Anyone | — | Strictly filtered |
| `/api/public/projects/[slug]` | `GET` | Public (None) | Anyone | — | 404 if draft or archived |
| `/api/public/countries/[slug]/projects`| `GET` | Public (None) | Anyone | — | 404 if country unpublished |

---

## 7. DATABASE DEPENDENCY & MIGRATION PLAN

### 7.1 Missing Columns on Baseline `apex` Database
The live database currently lacks:
- **`Property` table:** `askingPriceNumeric`, `askingCurrency`, `isPOA`, `bedroomsCount`, `bathroomsCount`, `areaNumeric`, `areaUnit`, `latitude`, `longitude`, `spaceRoundImage`, `isPubliclyVisible`, `hasCompletedDeal`, `isArchived`, `archivedAt`, `archivedReason`, `archivedById`, `restoredAt`, `restoredById`.
- **`PropertyImage` table:** `description`, `isCover`.
- **New Tables:** `Deal`, `ExchangeRate`, `PropertyValuationSnapshot`, `AdminActivityLog`.
- **`AdminUser` table:** `sessionVersion` (required for Phase 4 multi-instance revocation).

### 7.2 Migration Preparation Steps
1. **Incorporate `sessionVersion`:** Add `ALTER TABLE "AdminUser" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1;` into the approved Phase 3 migration file before deployment.
2. **Backward-Compatibility Verification:** Ensure default values are applied so existing 6 properties and 21 images cleanly transition:
   - `isArchived = false`
   - `isPubliclyVisible = isPublished`
   - `hasCompletedDeal = false`
   - `areaUnit = 'sqft'`
   - `isPOA = false`
3. **Execution Gate:** No migration will be executed until the user explicitly issues deployment authorization.

---

## 8. FRONTEND & BACKWARD-COMPATIBILITY PLAN

### 8.1 Dual Endpoint Support
To guarantee that existing admin pages ([`PropertiesListClient.tsx`](file:///e:/ApexaHoldings/Apex_Frontend/src/components/admin/PropertiesListClient.tsx) and [`PropertyForm.tsx`](file:///e:/ApexaHoldings/Apex_Frontend/src/components/admin/PropertyForm.tsx)) work seamlessly without breakage:
- Handlers in `src/app/api/admin/properties/route.ts` and `src/app/api/admin/properties/[id]/route.ts` will forward directly to the new `ProjectService`.
- The trash button in `PropertiesListClient` calls `DELETE /api/admin/properties/${id}`, which will now safely execute **archive** instead of permanent deletion.

### 8.2 Auto-Generated Display Copy
To prevent breaking existing frontend cards expecting formatted strings:
- When a project is saved with `askingPriceNumeric = 8200000` and `askingCurrency = "AED"`, the service automatically computes and populates `price = "AED 8.2M"`.
- When `bedroomsCount = 4`, it populates `beds = "4 Bedrooms"`.
- When `bathroomsCount = 4`, it populates `baths = "4 Baths"`.
- When `areaNumeric = 3800` and `areaUnit = "sqft"`, it populates `area = "3,800 sq ft"`.
- This ensures existing public and admin UI components continue displaying formatted typography while the backend leverages exact numeric precision for filtering.

---

## 9. COMPREHENSIVE TEST CASES FOR LIFECYCLE & VISIBILITY

When implementation is authorized, the test suite (`prisma/tests/verify_phase5_project_management.ts`) will execute:

### 9.1 Lifecycle Transition Tests
1. **Test L1 (Draft Creation):** Create project -> Verify `isDraft: true`, `isPublished: false`, `isArchived: false`, `isPubliclyVisible: false`.
2. **Test L2 (Publish Transition):** Call `POST /publish` `{ publish: true }` -> Verify `isPublished: true`, `isPubliclyVisible: true`, `isDraft: false`.
3. **Test L3 (Unpublish Transition):** Call `POST /publish` `{ publish: false }` -> Verify `isPublished: false`, `isPubliclyVisible: false`, `isDraft: true`.
4. **Test L4 (Archive from Published):** Call `DELETE /projects/[id]` -> Verify `isArchived: true`, `isPublished: false`, `isPubliclyVisible: false`, `archivedAt` is recorded, `archivedById` matches session.
5. **Test L5 (Restore to Draft):** Call `POST /restore` on archived project -> Verify `isArchived: false`, `isDraft: true`, `isPublished: false`, `restoredAt` recorded.
6. **Test L6 (Reject Publish on Archived):** Attempt `POST /publish` on archived project -> Verify HTTP `400 Bad Request`.
7. **Test L7 (Reject Update on Archived):** Attempt `PATCH` on archived project -> Verify HTTP `400 Bad Request`.
8. **Test L8 (Reject Deal on Draft):** Attempt to close deal on draft project -> Verify HTTP `400 Bad Request`.
9. **Test L9 (Deal Closure Keep Public):** Close deal with `keepPubliclyVisible: true` -> Verify `hasCompletedDeal: true`, `isPublished: true`, `isPubliclyVisible: true`.
10. **Test L10 (Deal Closure Unlist):** Close deal with `keepPubliclyVisible: false` -> Verify `hasCompletedDeal: true`, `isPublished: false`, `isPubliclyVisible: false`.
11. **Test L11 (Reject Repeat Deal Close):** Attempt to close already completed deal -> Verify HTTP `400 Bad Request`.
12. **Test L12 (Guarded Permanent Deletion):** Attempt `DELETE /permanent` without slug confirmation -> Verify HTTP `400`.
13. **Test L13 (Permanent Deletion Deal Protection):** Attempt `DELETE /permanent` on project with linked deal -> Verify HTTP `409 Conflict`.
14. **Test L14 (Permanent Deletion Role Check):** Attempt `DELETE /permanent` with standard admin role -> Verify HTTP `403 Forbidden`.

### 9.2 Public Visibility Tests
15. **Test V1 (Public Excludes Drafts):** `GET /api/public/projects` -> Verify zero draft projects returned.
16. **Test V2 (Public Excludes Archived):** `GET /api/public/projects` -> Verify zero archived projects returned.
17. **Test V3 (Public Excludes Unlisted Sold):** `GET /api/public/projects` -> Verify sold project with `keepPubliclyVisible: false` is excluded.
18. **Test V4 (Public Includes Showcase Sold):** `GET /api/public/projects` -> Verify sold project with `keepPubliclyVisible: true` is returned with `"hasCompletedDeal": true`.
19. **Test V5 (Public Detail 404 on Draft):** `GET /api/public/projects/draft-slug` -> Returns HTTP `404 Not Found`.
20. **Test V6 (Public Detail 404 on Archived):** `GET /api/public/projects/archived-slug` -> Returns HTTP `404 Not Found`.
21. **Test V7 (Public Data Sanitization):** Verify public response strips `archivedReason`, `archivedById`, buyer info, and audit metadata.

---

## 10. LIST OF UNRESOLVED BUSINESS DECISIONS

The following business rules require stakeholder confirmation:

1. **Off-Market Project Deal Workflow:**
   - *Current Rule:* Deals can only be closed on `PUBLISHED` projects.
   - *Decision:* Should an off-market deal workflow be added in the future allowing a direct `DRAFT → COMPLETED DEAL` transition if an asset is sold privately without public marketing? (Recommended default: Keep strictly rejected for Phase 5).
2. **Permanent Deletion Retention Window:**
   - *Decision:* Should permanent deletion only be permitted after a project has been in `ARCHIVED` status for a mandatory cooling-off period (e.g. 30 days), or can a `SUPER_ADMIN` permanently purge any deal-free project immediately?
3. **Multi-Unit Inventory vs. Single Asset:**
   - *Current Rule:* A completed deal marks the entire `Property` as `hasCompletedDeal = true`.
   - *Decision:* If a project is a master development with multiple units (e.g. 50 apartments in The Meridian), should it support multiple active deals, or is each project modeled as a single unique asset? (Current schema models each `Property` as a single discrete listing).
4. **Display Copy Auto-Generation Override:**
   - *Decision:* When an administrator enters exact numeric price (`askingPriceNumeric = 8200000, askingCurrency = "AED"`), should they also be permitted to provide custom display copy (e.g. `"Guide Price AED 8.2M"`), or should the system strictly format the copy automatically? (Recommended: Allow custom display copy if provided, otherwise auto-format).

---

## STRICT EXECUTION CONFIRMATION & STOP

In compliance with your strict safety instructions:
- **No implementation code was written.**
- **No Prisma schema modifications were made.**
- **No migrations were created or executed (`prisma migrate deploy` was NOT run).**
- **No database pushes or resets were executed (`prisma db push` was NOT run).**
- **No production or baseline database records were modified.**
- **No frontend files were touched.**
- **Phase 6 was NOT started.**

**WE HAVE STOPPED HERE.** We await your review and authorization of these corrections before proceeding.
