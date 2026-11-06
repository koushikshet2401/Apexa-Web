# APEX PACIFIC HOLDINGS — PHASE 4 CLOSURE & PHASE 5 PROJECT MANAGEMENT ARCHITECTURE REPORT

**Document ID:** `APH-PHASE4-CLOSURE-PHASE5-PLAN-001`  
**Date:** 6 November 2026, 12:55 PM  
**Project:** `E:\ApexaHoldings\Apex_Frontend`  
**Framework:** Next.js 15 App Router  
**Database:** PostgreSQL 18.6 (`apex` on `localhost:5432`)  
**ORM:** Prisma 6.19.3  
**Current Live Schema:** Baseline (`20261030073355_init_schema`)  
**Phase 3 Schema Status:** Prepared (`20261105170000_phase3_approved_architecture/migration.sql`), **NOT DEPLOYED**  
**Database State:** 0 mutations, 48 records intact across 8 tables  

---

## PART A — FORMAL PHASE 4 CLOSURE

### 1. Phase 4 Acceptance Certification
Phase 4 (Authentication & Admin Permissions / RBAC) is hereby formally recorded as **ACCEPTED** for the current single-instance deployment scope.

### 2. Empirical Acceptance Evidence Summary
1. **100% Test Suite Pass Rate (75 / 75 Tests):**
   - Section A (Static Code & Route Guard Configuration): 4 / 4 passed.
   - Section B (Unit, Cryptographic & Security Harness): 16 / 16 passed.
   - Section C (Live HTTP Backend & RBAC Authorization): 51 / 51 passed.
   - Section D (Live PostgreSQL Integration & Baseline Fallback): 4 / 4 passed.
2. **Complete API Route Guard Verification (37 Handlers across 20 Route Files):**
   - Every single exported HTTP handler in `src/app/api/admin/*` enforces server-side authentication (`verifyLiveAdminSession`) and granular permission checks (`requirePermission`).
   - All 34 permission-protected handlers empirically tested with an unprivileged JWT session and confirmed returning HTTP `403 Forbidden`.
   - Zero handlers rely solely on Edge middleware.
3. **Four-Way Baseline Administrator Verification:**
   - Fallback `SUPER_ADMIN` grants in `src/lib/rbac.ts`, `auth/me/route.ts`, and `auth/login/route.ts` are strictly gated on exact 4-way equality:
     - `dbUser.id === APPROVED_BASELINE_ADMIN_ID` (`cmvw_apex_superadmin_01`)
     - `dbUser.email === APPROVED_BASELINE_ADMIN_EMAIL` (`admin@apexpacific.com`)
     - `jwt.id === APPROVED_BASELINE_ADMIN_ID`
     - `jwt.email === APPROVED_BASELINE_ADMIN_EMAIL`
   - Permitted **only** when `AdminRole` / `RolePermission` tables are absent (Prisma errors `P2021` / `P2022`).
   - Connection failures, syntax errors, or arbitrary admin users immediately throw/return HTTP `500` or `401 Unauthorized`, never granting fallback privileges.
4. **Session Resurrection Vulnerability Eliminated:**
   - Session versioning redesigned with monotonic version counters (`inMemorySessionVersions = new Map<string, number>()`).
   - Removed `unrevokeAdminSessions(user.id)` on login.
   - Old tokens issued prior to an all-device logout retain outdated version numbers and remain permanently invalid even if the administrator logs in again on a new device.
   - Empirically verified via `prisma/tests/test_session_resurrection.ts`.
5. **Hardened Filesystem & Media Security:**
   - Pre-rename and pre-unlink parent-directory containment verification in `src/lib/pathSecurity.ts`.
   - Post-write canonical realpath checks preventing symlink and path traversal attacks.
6. **Zero Database Mutations & Frontend Integrity:**
   - Live PostgreSQL database records remain exactly untouched (`AdminUser: 1`, `Property: 6`, `PropertyImage: 21`, `Country: 5`, `Enquiry: 1`, `ServiceCategory: 4`, `HomepageContent: 1`, `PropertyService: 9`).
   - Approved frontend design, theme tokens, routes, animations, and layouts remain 100% untouched.

### 3. Documented Multi-Instance Deployment Limitations
As required by the single-instance certification scope, the following 4 limitations are explicitly logged for multi-instance production deployment:
1. **In-Memory Session Versioning:** Monotonic session versions and single-device revocations are currently tracked in process memory (`inMemorySessionVersions`, `revokedTokens`).
2. **PostgreSQL-Backed Session Versioning:** Multi-instance deployment requires persistent `AdminUser.sessionVersion` (INT NOT NULL DEFAULT 1) in PostgreSQL so that all-device logout propagates across any number of serverless or containerized instances.
3. **Shared Revocation Store:** Real-time cross-process individual-device logout requires a shared distributed cache (e.g., Redis / Dragonfly / Upstash) or database-backed `jti` blacklist.
4. **Cloudflare R2 Media Storage:** Local disk storage (`public/uploads`) is confined to a single filesystem. Multi-instance production requires Cloudflare R2 via `src/lib/r2.ts` for consistent media availability across instances.

> **Phase 4 Status:** **CLOSED AND ACCEPTED.** No further changes will be made to Phase 4 authentication or RBAC logic unless a new defect is discovered.

---

## PART B & C — PHASE 5: PROJECT MANAGEMENT BACKEND ARCHITECTURE & IMPLEMENTATION PLAN

---

### SECTION 1: REPOSITORY DOMAIN CONVENTION RECONCILIATION

#### 1.1 Existing Domain Nomenclature
Across the existing codebase, portfolio developments are modeled as **`Property`**:
- **Database Models:** `Property`, `PropertyImage`, `PropertyService`
- **Prisma Client Accessor:** `db.property`, `db.propertyImage`, `db.propertyService`
- **Admin Frontend Pages:** `/admin/properties`, `/admin/properties/new`, `/admin/properties/[id]`
- **Public Routes:** `/collection/[country]/[slug]`, `/launches`, `/collection/[country]`
- **Public APIs:** `/api/public/collection-countries`, `/api/public/properties/[country]/[slug]`, `/api/public/launches`, `/api/public/space-in-round`
- **Admin APIs:** `/api/admin/properties`, `/api/admin/properties/[id]`, `/api/admin/properties/[id]/images`

#### 1.2 Dual-Route Architecture Strategy
The user requirements specify RESTful endpoints under `/api/admin/projects` and `/api/public/projects`. To achieve **100% zero-regression compatibility** with the existing admin UI while delivering the modern Phase 5 project management API:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   UNIFIED PROJECT SERVICE LAYER                        │
│                 (src/lib/services/projectService.ts)                   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         │                                                   │
┌────────▼───────────────────────┐         ┌─────────────────▼──────────────────┐
│     NEW PHASE 5 CONTRACTS      │         │   BACKWARD COMPATIBILITY ALIASES   │
│   /api/admin/projects/*        │         │   /api/admin/properties/*          │
│   /api/public/projects/*       │         │   /api/public/properties/*         │
└────────────────────────────────┘         └────────────────────────────────────┘
```

1. **Both endpoint families are supported natively:**
   - `/api/admin/projects` (New Phase 5 standard)
   - `/api/admin/properties` (Preserves existing `PropertiesListClient` & `PropertyForm`)
   - Both forward requests directly to the identical, strongly typed `ProjectService` functions.
2. **Public API endpoints:**
   - `/api/public/projects`: General paginated, filtered, searchable public showcase.
   - `/api/public/projects/[slug]`: Project detail by unique slug.
   - `/api/public/countries/[slug]/projects`: Projects belonging to a specific portfolio country.
   - Existing `/api/public/properties/[country]/[slug]`, `/api/public/launches`, and `/api/public/space-in-round` remain intact and functional.

---

### SECTION 2: SCHEMA DEPENDENCY & GAP ANALYSIS

#### 2.1 Schema Comparison Matrix

| Field / Model | Baseline DB (Live `apex`) | Phase 3 Migration (`migration.sql`) | Phase 5 Requirement | Status on Live DB |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `TEXT PRIMARY KEY` | `TEXT PRIMARY KEY` | Required | **Present** |
| `slug` | `TEXT UNIQUE` | `TEXT UNIQUE` | Required | **Present** |
| `name` | `TEXT` | `TEXT` | Required | **Present** |
| `cardLabel` | `TEXT` | `TEXT` | Optional | **Present** |
| `tagline` | `TEXT` | `TEXT` | Optional | **Present** |
| `shortDescription` | `TEXT` | `TEXT` | Optional | **Present** |
| `description` | `TEXT` | `TEXT` | Required | **Present** |
| `type` | `TEXT` | `TEXT` | Required | **Present** |
| `beds` | `TEXT` | `TEXT` (legacy copy) | Legacy display | **Present** |
| `baths` | `TEXT` | `TEXT` (legacy copy) | Legacy display | **Present** |
| `area` | `TEXT` | `TEXT` (legacy copy) | Legacy display | **Present** |
| `price` | `TEXT` | `TEXT` (legacy copy) | Legacy display | **Present** |
| `askingPriceNumeric` | **MISSING** | `DECIMAL(18, 2)` | **Strict Required** | **Pending Phase 3** |
| `askingCurrency` | **MISSING** | `TEXT` (ISO 4217) | **Strict Required** | **Pending Phase 3** |
| `isPOA` | **MISSING** | `BOOLEAN DEFAULT false` | **Strict Required** | **Pending Phase 3** |
| `bedroomsCount` | **MISSING** | `INTEGER` | **Strict Required** | **Pending Phase 3** |
| `bathroomsCount` | **MISSING** | `DECIMAL(3, 1)` | **Strict Required** | **Pending Phase 3** |
| `areaNumeric` | **MISSING** | `DECIMAL(10, 2)` | **Strict Required** | **Pending Phase 3** |
| `areaUnit` | **MISSING** | `TEXT DEFAULT 'sqft'` | **Strict Required** | **Pending Phase 3** |
| `cityName` | `TEXT` | `TEXT` | Required | **Present** |
| `locationLine` | `TEXT` | `TEXT` | Optional | **Present** |
| `latitude` | **MISSING** | `DOUBLE PRECISION` | **Strict Required** | **Pending Phase 3** |
| `longitude` | **MISSING** | `DOUBLE PRECISION` | **Strict Required** | **Pending Phase 3** |
| `mainVideoUrl` | `TEXT` | `TEXT` | Required | **Present** |
| `mainVideoThumb` | `TEXT` | `TEXT` | Optional | **Present** |
| `mainImage` | `TEXT` | `TEXT` | Required (Thumbnail) | **Present** |
| `spaceRoundImage` | **MISSING** | `TEXT` | **Conditionally Req.** | **Pending Phase 3** |
| `highlights` | `TEXT[]` | `TEXT[]` | Optional | **Present** |
| `layoutVariant` | `INTEGER` | `INTEGER` | Required | **Present** |
| `isPublished` | `BOOLEAN DEFAULT false` | `BOOLEAN DEFAULT false` | Required | **Present** |
| `isDraft` | `BOOLEAN DEFAULT true` | `BOOLEAN DEFAULT true` | Required | **Present** |
| `isPubliclyVisible` | **MISSING** | `BOOLEAN DEFAULT false` | **Strict Required** | **Pending Phase 3** |
| `hasCompletedDeal` | **MISSING** | `BOOLEAN DEFAULT false` | **Strict Required** | **Pending Phase 3** |
| `isFeaturedLaunch` | `BOOLEAN DEFAULT false` | `BOOLEAN DEFAULT false` | Required (New Launch) | **Present** |
| `launchOrder` | `INTEGER` | `INTEGER` | Optional | **Present** |
| `launchDate` | `TIMESTAMP` | `TIMESTAMP` | Optional | **Present** |
| `isSpaceInRound` | `BOOLEAN DEFAULT false` | `BOOLEAN DEFAULT false` | Required (Spaces Flag) | **Present** |
| `spaceOrder` | `INTEGER` | `INTEGER` | Optional | **Present** |
| `isArchived` | **MISSING** | `BOOLEAN DEFAULT false` | **Strict Required** | **Pending Phase 3** |
| `archivedAt` | **MISSING** | `TIMESTAMP(3)` | **Strict Required** | **Pending Phase 3** |
| `archivedReason` | **MISSING** | `TEXT` | Optional | **Pending Phase 3** |
| `archivedById` | **MISSING** | `TEXT FK AdminUser` | **Strict Required** | **Pending Phase 3** |
| `restoredAt` | **MISSING** | `TIMESTAMP(3)` | Optional | **Pending Phase 3** |
| `restoredById` | **MISSING** | `TEXT FK AdminUser` | Optional | **Pending Phase 3** |
| `PropertyImage.description` | **MISSING** | `TEXT` | **Strict Required** | **Pending Phase 3** |
| `PropertyImage.isCover` | **MISSING** | `BOOLEAN DEFAULT false` | **Strict Required** | **Pending Phase 3** |
| `Deal` Table | **MISSING** | `TABLE Deal` (14 cols) | **Strict Required** | **Pending Phase 3** |
| `AdminActivityLog` Table | **MISSING** | `TABLE AdminActivityLog` | **Strict Required** | **Pending Phase 3** |
| `AdminUser.sessionVersion` | **MISSING** | **MISSING** | **Phase 4 Multi-inst.** | **Requires Addition** |

#### 2.2 Critical Schema Prerequisite Finding
1. **The Live Database is strictly on Baseline:** Querying columns such as `askingPriceNumeric`, `isArchived`, `latitude`, `spaceRoundImage`, or table `Deal` directly via Prisma on the live database currently triggers error `P2022` ("The column does not exist in the current database") or `P2021` ("The table does not exist").
2. **Phase 3 Migration Prerequisite:** Full Phase 5 execution (including numeric prices, structured areas, GPS coordinates, soft-delete archiving, deal closure separation, and image descriptions) depends directly on deploying the Phase 3 migration.
3. **Session Versioning Prerequisite:** As established during Phase 4 closure, `AdminUser.sessionVersion INTEGER NOT NULL DEFAULT 1` must be incorporated into the Phase 3 migration script before deployment to ensure multi-instance session invalidation.

---

### SECTION 3: FIELD SPECIFICATIONS & PRECISION VALIDATION RULES

All incoming data to `POST` and `PATCH` project endpoints must be validated using Zod schemas (`src/lib/validations/project.ts`):

```typescript
import { z } from 'zod'

export const ISO_CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'THB', 'MYR', 'AUD', 'GEL', 'INR', 'CHF', 'SGD'] as const
export const PROPERTY_TYPES = ['residential', 'commercial', 'penthouse', 'villa', 'estate', 'mixed_use', 'waterfront', 'mansion'] as const
export const AREA_UNITS = ['sqft', 'sqm'] as const

export const ProjectSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters').max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe lowercase alphanumeric with hyphens').optional(),
  countryId: z.string().cuid('Valid country ID is required'),
  cityName: z.string().trim().min(2, 'City name is required').max(100),
  locationLine: z.string().trim().max(255).optional().nullable(),
  
  // Coordinates
  latitude: z.number().min(-90.0).max(90.0, 'Latitude must be between -90 and +90').optional().nullable(),
  longitude: z.number().min(-180.0).max(180.0, 'Longitude must be between -180 and +180').optional().nullable(),
  
  // Descriptions
  tagline: z.string().trim().max(300).optional().nullable(),
  shortDescription: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().min(10, 'Full project description must be at least 10 characters'),
  cardLabel: z.string().trim().max(60).optional().nullable(),
  
  // Categorization
  type: z.enum(PROPERTY_TYPES, { errorMap: () => ({ message: 'Invalid property type' }) }),
  serviceIds: z.array(z.string().cuid()).optional().default([]),
  
  // Quantitative Specifications
  bedroomsCount: z.number().int().min(0, 'Bedrooms must be 0 or greater').max(50).optional().nullable(),
  bathroomsCount: z.number().min(0, 'Bathrooms must be 0 or greater').max(50).step(0.5, 'Bathrooms must increment in half baths (e.g. 2.5)').optional().nullable(),
  areaNumeric: z.number().positive('Area must be a positive number').max(99999999.99).optional().nullable(),
  areaUnit: z.enum(AREA_UNITS).default('sqft'),
  
  // Financial Precision
  askingPriceNumeric: z.number().positive('Asking price must be positive').max(9999999999999999.99).optional().nullable(),
  askingCurrency: z.enum(ISO_CURRENCIES).optional().nullable(),
  isPOA: z.boolean().default(false),
  
  // Media References
  mainImage: z.string().url('Thumbnail must be a valid URL or path').or(z.string().regex(/^\/uploads\/[a-zA-Z0-9_\-\.\/]+$/)),
  mainVideoUrl: z.string().url().or(z.string().regex(/^\/uploads\/[a-zA-Z0-9_\-\.\/]+$/)).optional().nullable(),
  mainVideoThumb: z.string().url().or(z.string().regex(/^\/uploads\/[a-zA-Z0-9_\-\.\/]+$/)).optional().nullable(),
  
  // Curation & Featured Flags
  isFeaturedLaunch: z.boolean().default(false),
  launchOrder: z.number().int().positive().optional().nullable(),
  launchDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  
  // Spaces in the Round Flag & Conditional Media
  isSpaceInRound: z.boolean().default(false),
  spaceOrder: z.number().int().positive().optional().nullable(),
  spaceRoundImage: z.string().url().or(z.string().regex(/^\/uploads\/[a-zA-Z0-9_\-\.\/]+$/)).optional().nullable(),
  
  // Layout & Content
  layoutVariant: z.number().int().min(1).max(5).default(1),
  highlights: z.array(z.string().trim().max(100)).max(20).default([]),
  
  // Publication Status
  isPublished: z.boolean().default(false),
  isDraft: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // Conditional: If POA is false, askingPriceNumeric and askingCurrency are required
  if (!data.isPOA && (!data.askingPriceNumeric || !data.askingCurrency)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Asking price and ISO currency are required when Price on Application (isPOA) is disabled.',
      path: ['askingPriceNumeric'],
    })
  }
  // Conditional: Spaces in the Round requires spaceRoundImage
  if (data.isSpaceInRound && !data.spaceRoundImage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Spaces in the Round image (spaceRoundImage) is required when isSpaceInRound is enabled.',
      path: ['spaceRoundImage'],
    })
  }
})
```

---

### SECTION 4: COUNTRY SUPPORT & PORTFOLIO INTEGRATION

All projects must maintain referential integrity with the approved five portfolio countries:
```
1. United Arab Emirates / Dubai (slug: 'dubai', id: 'cmvw891ls0001ue8k00f5hqkv')
2. Thailand (slug: 'thailand', id: 'cmvw891lu0002ue8krnqn8nid')
3. Malaysia (slug: 'malaysia', id: 'cmvw891lv0003ue8kpytep5c7')
4. Australia (slug: 'australia', id: 'cmvw891lx0004ue8k6qgqgj8u')
5. Georgia (slug: 'georgia', id: 'cmvw891ly0005ue8kzqid9fya')
```

- When a project is created or updated, `countryId` is strictly verified against the `Country` table. Invalid or missing `countryId` yields HTTP `400 Bad Request` ("Country does not exist").
- Public country collections dynamically aggregate published projects via `GET /api/public/countries/[slug]/projects`.

---

### SECTION 5: PROJECT STATUS & DEAL SEPARATION STATE MACHINE

```
                       ┌─────────────────────────┐
                       │          DRAFT          │
                       │  isDraft: true          │
                       │  isPublished: false     │
                       │  isArchived: false      │
                       └────────────┬────────────┘
                                    │
                         publish    │    unpublish
                                    ▼
                       ┌─────────────────────────┐
                       │        PUBLISHED        │
                       │  isDraft: false         │
                       │  isPublished: true      │
                       │  isPubliclyVisible: true│
                       │  isArchived: false      │
                       └─────┬──────────────┬────┘
                             │              │
                     archive │              │ deal closed (COMPLETED)
                             │              │
                             ▼              ▼
       ┌────────────────────────┐      ┌─────────────────────────┐
       │        ARCHIVED        │      │    DEAL COMPLETED       │
       │  isArchived: true      │      │    hasCompletedDeal: true│
       │  isPublished: false    │      │                         │
       │  isPubliclyVisible: fal│      │  [Admin Choice]:        │
       │  (Soft-Deleted)        │      │  keepPubliclyVisible:   │
       └───────────┬────────────┘      │    true  -> Shown Sold  │
                   │                   │    false -> Unlisted    │
           restore │                   └─────────────────────────┘
                   ▼
       ┌────────────────────────┐
       │      RESTORED DRAFT    │
       │  isArchived: false     │
       │  isDraft: true         │
       │  isPublished: false    │
       └────────────────────────┘
```

#### 5.1 Decoupled State Definitions
1. **DRAFT:** Work in progress. Never returned by public endpoints. Visible only in Admin Panel.
2. **PUBLISHED:** Active listing. Visible across public showcase, country collection, search, and detail pages.
3. **ARCHIVED (Soft Delete):** Recoverably deactivated project. Excluded from active admin lists (unless `status=archived` is explicitly filtered) and strictly barred from public queries. Tracks `archivedAt`, `archivedById`, and `archivedReason`. Can be restored back to DRAFT state via `/restore`.
4. **COMPLETED DEAL & SOLD STATUS (Phase 1 Approved Rule):**
   - When a deal reaches `COMPLETED`, the administrator is prompted with:
     `"Keep this project visible on the public showcase as a transacted portfolio asset?"`
   - If `keepPubliclyVisible: true`:
     - `Property.hasCompletedDeal = true`
     - `Property.isPublished = true`
     - `Property.isPubliclyVisible = true`
     - Public cards render a discrete luxury badge: `"ACQUIRED / PRIVATE TRANSACTION"`.
   - If `keepPubliclyVisible: false`:
     - `Property.hasCompletedDeal = true`
     - `Property.isPublished = false`
     - `Property.isPubliclyVisible = false`
     - Project is removed from public showcase.
5. **PERMANENT DELETION (`DELETE /api/admin/projects/[id]`):**
   - Protected by `PROPERTIES_DELETE` permission.
   - Guarded check: If `Deal` records are linked to the project (`_count.deals > 0`), **permanent deletion is strictly rejected** with HTTP `409 Conflict`:
     `"Cannot delete project with associated deal records. You must Archive the project to preserve audit and financial transaction records."`
   - Cascades only to `PropertyImage` and `PropertyService` when zero deals exist.

---

### SECTION 6: MEDIA MANAGEMENT & CLOUDFLARE R2 ARCHITECTURE

#### 6.1 Multi-Media Capabilities
- **Thumbnail Image:** Primary showcase asset (`Property.mainImage`).
- **Main Cinematic Video:** High-definition showcase video (`Property.mainVideoUrl`, `Property.mainVideoThumb`).
- **Conditional Spaces Image:** Required when `isSpaceInRound = true` (`Property.spaceRoundImage`).
- **Gallery Images:** Zero or more sequential architectural photos (`model PropertyImage`):
  - `url`: Direct CDN or local upload URL.
  - `alt`: Accessibility description.
  - `description`: Architectural note (e.g. "Cantilevered infinity pool overlooking Gulf").
  - `isCover`: Primary gallery cover flag.
  - `order`: Sequential display index for drag-and-drop reordering.

#### 6.2 Dual-Storage Operation
1. **Local Development (Single-Instance):**
   - Uploads stored in `public/uploads/{folder}/{uuid}-{filename}`.
   - Path containment verified via `validateUploadPath` and `safeWriteUploadFile` in `src/lib/pathSecurity.ts`.
2. **Production Multi-Instance (Cloudflare R2):**
   - Enabled automatically when `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` are present via `isR2Configured()` in `src/lib/r2.ts`.
   - Browser uploads utilize presigned PUT URLs via `POST /api/admin/media/presign`.
   - Deletions utilize S3 `DeleteObjectCommand`.
3. **MIME & Size Validation:**
   - Images: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` (Max 10 MB).
   - Videos: `.mp4` (Max 150 MB).
   - Content-Type header strictly validated.

---

### SECTION 7: DETAILED API SPECIFICATIONS & CONTRACTS

#### 7.1 Admin Endpoints

##### 1. `GET /api/admin/projects` (and alias `/api/admin/properties`)
- **Permission:** `PROPERTIES:READ`
- **Query Parameters:**
  - `search`: string (matches name, slug, city, country name)
  - `status`: `'all' | 'published' | 'draft' | 'archived' | 'sold'` (default: `'all'`, excludes archived unless explicitly requested)
  - `countryId`: string (filter by country CUID)
  - `type`: string (filter by property type)
  - `page`: integer (default: 1)
  - `pageSize`: integer (default: 20, max: 100)
  - `sortBy`: `'createdAt' | 'name' | 'price' | 'order'` (default: `'createdAt'`)
  - `sortOrder`: `'asc' | 'desc'` (default: `'desc'`)
- **Response (200 OK):**
```json
{
  "items": [
    {
      "id": "cmvw891m4000bue8kaukwclze",
      "slug": "the-meridian",
      "name": "The Meridian",
      "cardLabel": "THE MERIDIAN",
      "type": "residential",
      "cityName": "Dubai",
      "country": {
        "id": "cmvw891ls0001ue8k00f5hqkv",
        "name": "United Arab Emirates",
        "displayName": "Dubai / UAE",
        "slug": "dubai"
      },
      "askingPriceNumeric": 8200000.00,
      "askingCurrency": "AED",
      "isPOA": false,
      "bedroomsCount": 4,
      "bathroomsCount": 4.0,
      "areaNumeric": 3800.00,
      "areaUnit": "sqft",
      "mainImage": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
      "isPublished": true,
      "isDraft": false,
      "isArchived": false,
      "hasCompletedDeal": false,
      "isFeaturedLaunch": true,
      "isSpaceInRound": false,
      "_count": { "images": 5, "deals": 0 },
      "createdAt": "2026-10-30T07:33:55.000Z",
      "updatedAt": "2026-11-05T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 6,
    "totalPages": 1
  }
}
```

##### 2. `POST /api/admin/projects` (and alias `/api/admin/properties`)
- **Permission:** `PROPERTIES:CREATE`
- **Request Body:** JSON conforming to `ProjectSchema`.
- **Audit Log:** Action `PROJECT_CREATED`, entityType `"Property"`.
- **Response:** `201 Created` with full project record.

##### 3. `GET /api/admin/projects/[id]` (and alias `/api/admin/properties/[id]`)
- **Permission:** `PROPERTIES:READ`
- **Response:** `200 OK` with full project relations (images, country, services, deal summary).

##### 4. `PATCH /api/admin/projects/[id]` (and alias `/api/admin/properties/[id]`)
- **Permission:** `PROPERTIES:UPDATE`
- **Request Body:** Partial JSON conforming to `ProjectSchema`.
- **Audit Log:** Action `PROJECT_UPDATED`.
- **Response:** `200 OK` with updated project.

##### 5. `DELETE /api/admin/projects/[id]` (and alias `/api/admin/properties/[id]`)
- **Permission:** `PROPERTIES:DELETE`
- **Guarded Logic:** Rejects deletion if linked deals exist (HTTP `409 Conflict`).
- **Audit Log:** Action `PROJECT_DELETED`.
- **Response:** `200 OK` `{ "ok": true, "message": "Project permanently deleted" }`.

##### 6. `POST /api/admin/projects/[id]/publish`
- **Permission:** `PROPERTIES:PUBLISH`
- **Request Body:** `{ "publish": true | false }`
- **State Logic:**
  - `publish: true` -> `isPublished: true`, `isDraft: false`, `isPubliclyVisible: true`.
  - `publish: false` -> `isPublished: false`, `isDraft: true`, `isPubliclyVisible: false`.
- **Audit Log:** `PROJECT_PUBLISHED` or `PROJECT_UNPUBLISHED`.
- **Response:** `200 OK` with updated status.

##### 7. `POST /api/admin/projects/[id]/archive`
- **Permission:** `PROPERTIES:UPDATE`
- **Request Body:** `{ "reason": string }` (optional)
- **State Logic:** Sets `isArchived: true`, `isPublished: false`, `isPubliclyVisible: false`, `archivedAt: now()`, `archivedById: admin.id`, `archivedReason: reason`.
- **Audit Log:** `PROJECT_ARCHIVED`.
- **Response:** `200 OK` `{ "ok": true, "isArchived": true, "archivedAt": "..." }`.

##### 8. `POST /api/admin/projects/[id]/restore`
- **Permission:** `PROPERTIES:UPDATE`
- **State Logic:** Sets `isArchived: false`, `isDraft: true`, `isPublished: false`, `restoredAt: now()`, `restoredById: admin.id`. (Restores to DRAFT for review).
- **Audit Log:** `PROJECT_RESTORED`.
- **Response:** `200 OK` `{ "ok": true, "isArchived": false, "isDraft": true }`.

##### 9. `POST /api/admin/projects/[id]/images` & `DELETE .../images`
- **Permission:** `PROPERTIES:UPDATE` / `PROPERTIES:DELETE`
- **Capabilities:** Create gallery image, specify `description`, toggle `isCover`, and reorder.

---

#### 7.2 Public Endpoints

##### 10. `GET /api/public/projects`
- **Authentication:** Public (No credentials required)
- **Filters Enforced:** `isPublished: true`, `isArchived: false` (or `isPubliclyVisible: true`)
- **Query Parameters:**
  - `country`: slug string
  - `type`: property type string
  - `minPrice`: number
  - `maxPrice`: number
  - `beds`: integer
  - `search`: string
  - `page`: integer
  - `pageSize`: integer
- **Response:** Sanitized public project listing. Never exposes admin metadata (`archivedReason`, `archivedById`, internal notes).

##### 11. `GET /api/public/projects/[slug]`
- **Authentication:** Public
- **Lookup:** Unique `slug` matching `isPublished: true` and `isArchived: false`.
- **Response:** Full public project detail with ordered gallery, country specs, and amenities.

##### 12. `GET /api/public/countries/[slug]/projects`
- **Authentication:** Public
- **Lookup:** Retrieves country details and all published projects for that destination.

---

### SECTION 8: SECURITY & RBAC ENFORCEMENT MATRIX

| Endpoint Route | HTTP Method | Auth Guard | Permission Guard | Audit Log Action | IDOR Protection |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/admin/projects` | `GET` | `verifyLiveAdminSession` | `PROPERTIES:READ` | — | Scoped to active records |
| `/api/admin/projects` | `POST` | `verifyLiveAdminSession` | `PROPERTIES:CREATE` | `PROJECT_CREATED` | Unique slug enforcement |
| `/api/admin/projects/[id]` | `GET` | `verifyLiveAdminSession` | `PROPERTIES:READ` | — | Validated CUID param |
| `/api/admin/projects/[id]` | `PATCH` | `verifyLiveAdminSession` | `PROPERTIES:UPDATE` | `PROJECT_UPDATED` | Verified existence before update |
| `/api/admin/projects/[id]` | `DELETE` | `verifyLiveAdminSession` | `PROPERTIES:DELETE` | `PROJECT_DELETED` | Restrict check on Deal FK |
| `/api/admin/projects/[id]/publish`| `POST` | `verifyLiveAdminSession` | `PROPERTIES:PUBLISH` | `PROJECT_PUBLISHED` | Verified existence |
| `/api/admin/projects/[id]/archive`| `POST` | `verifyLiveAdminSession` | `PROPERTIES:UPDATE` | `PROJECT_ARCHIVED` | Cannot archive already archived |
| `/api/admin/projects/[id]/restore`| `POST` | `verifyLiveAdminSession` | `PROPERTIES:UPDATE` | `PROJECT_RESTORED` | Only archived projects |
| `/api/admin/projects/[id]/images` | `POST` | `verifyLiveAdminSession` | `PROPERTIES:UPDATE` | `PROJECT_IMAGE_ADDED` | Scoped to propertyId |
| `/api/admin/projects/[id]/images` | `DELETE`| `verifyLiveAdminSession` | `PROPERTIES:DELETE` | `PROJECT_IMAGE_DELETED`| Scoped to propertyId & imageId |
| `/api/public/projects` | `GET` | Public | None | — | Strict `isPublished: true` filter |
| `/api/public/projects/[slug]` | `GET` | Public | None | — | 404 if draft or archived |
| `/api/public/countries/[slug]/projects`| `GET` | Public | None | — | 404 if country unpublished |

---

### SECTION 9: PUBLIC WEBSITE INTEGRATION & ZERO-REGRESSION ASSURANCE

1. **Frontend Preservation Guarantee:**
   - Approved page layouts (`/collection`, `/collection/[country]`, `/collection/[country]/[slug]`, `/launches`) will not undergo any layout, JSX structure, styling, or animation alterations.
   - Server-side data fetching components (`LaunchesCinematicStackServer.tsx`, `CollectionCountryClient.tsx`, `CinematicPropertyDetail.tsx`) already query Prisma models. They will seamlessly consume the published projects with zero visual disruption.
2. **Backward Compatible Data Mapping:**
   - Both numeric (`askingPriceNumeric`, `bedroomsCount`, `areaNumeric`) and formatted display strings (`price`, `beds`, `area`) will be maintained simultaneously by the project service layer.
   - If `askingPriceNumeric = 8200000` and `askingCurrency = "AED"`, the service automatically formats display copy `"AED 8.2M"` to preserve existing frontend cards without breaking string format expectations.

---

### SECTION 10: PHASE 5 IMPLEMENTATION SEQUENCE ROADMAP

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE 5 EXECUTION ROADMAP                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         │                                                   │
┌────────▼───────────────────────┐         ┌─────────────────▼──────────────────┐
│ SUB-PHASE 5.1: MIGRATION PREP  │         │ SUB-PHASE 5.2: VALIDATION LAYER    │
│ - Incorporate sessionVersion   │         │ - Create Zod ProjectSchema         │
│ - Review Phase 3 SQL           │         │ - ISO 4217, coordinates, numbers   │
│ - AWAIT USER DEPLOY APPROVAL   │         │ - Unit test validation rules       │
└────────┬───────────────────────┘         └─────────────────┬──────────────────┘
         │                                                   │
         └─────────────────────────┬─────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SUB-PHASE 5.3: CORE PROJECT SERVICE LAYER                              │
│ - src/lib/services/projectService.ts (CRUD, queries, formatters)       │
│ - Transactional integrity & audit log integration                     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SUB-PHASE 5.4: ADMIN REST ENDPOINTS                                    │
│ - /api/admin/projects & /api/admin/properties handlers                 │
│ - /publish, /unpublish, /archive, /restore, /images endpoints          │
│ - Guarded permanent deletion with Deal protection                     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SUB-PHASE 5.5: PUBLIC REST ENDPOINTS                                   │
│ - /api/public/projects (search, filters, pagination)                   │
│ - /api/public/projects/[slug]                                          │
│ - /api/public/countries/[slug]/projects                                │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SUB-PHASE 5.6: ADMIN UI NON-BREAKING ENHANCEMENTS                      │
│ - Update PropertiesListClient: Add Status badges, Archive/Restore modal│
│ - Update PropertyForm: Structured numeric price/area & coordinates     │
│ - Preserve approved design tokens, styling, and navigation             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SUB-PHASE 5.7: VERIFICATION TEST SUITE                                 │
│ - 80+ automated tests covering CRUD, validations, RBAC, Deal isolation │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SECTION 11: COMPREHENSIVE VERIFICATION & TEST PLAN

The Phase 5 test harness will introduce a dedicated test suite (`prisma/tests/verify_phase5_project_management.ts`) executing across 6 automated sections:

1. **Section A: Static Contract & Guard Verification (12 tests)**
   - All exported handlers import `verifyLiveAdminSession` and `requirePermission`.
   - Exact permission keys mapped correctly.
   - Slug regex and ISO currency enum integrity.
2. **Section B: Validation Engine Unit Tests (20 tests)**
   - Valid payload acceptance.
   - Reject negative prices, invalid currencies, negative areas.
   - Reject invalid coordinates (< -90, > 90, < -180, > 180).
   - Enforce conditional `spaceRoundImage` when `isSpaceInRound = true`.
   - Enforce price & currency when `isPOA = false`.
3. **Section C: Lifecycle & State Machine Tests (18 tests)**
   - Draft creation -> verified unpublished.
   - Publish transition -> verified published & publicly visible.
   - Unpublish transition -> returned to draft.
   - Archive transition -> soft-deleted with timestamp and admin attribution.
   - Restore transition -> returned to draft state.
   - Rejection of permanent deletion when deal records exist.
4. **Section D: RBAC & Negative Authorization Tests (15 tests)**
   - Unauthenticated requests rejected with HTTP 401.
   - Read-only admin session rejected with HTTP 403 on create/edit/delete/publish/archive.
   - Standard user session rejected on all admin routes.
5. **Section E: Public Filter & Isolation Tests (10 tests)**
   - Draft projects excluded from public endpoints.
   - Archived projects excluded from public endpoints.
   - Unlisted sold projects excluded from public endpoints.
   - Showcase-enabled sold projects returned with `"hasCompletedDeal": true`.
6. **Section F: Database Integrity & Zero-Mutation Audit (5 tests)**
   - Verify baseline record counts remain strictly unchanged throughout testing.

---

### SECTION 12: FORMAL STOP STATEMENT

In strict adherence to the critical execution rules:
1. **NO database migrations have been run** (`prisma migrate deploy` was NOT run).
2. **NO database pushes or schema resets were executed** (`prisma db push` was NOT run).
3. **NO production or baseline records were mutated, backfilled, or deleted.**
4. **NO frontend components or layouts were modified.**
5. **Phase 6 was NOT initiated.**

**WE HAVE STOPPED HERE.** We await your formal review and approval of this Phase 5 Architecture, Schema Dependency Report, and Implementation Plan before applying database migrations or writing implementation code.
