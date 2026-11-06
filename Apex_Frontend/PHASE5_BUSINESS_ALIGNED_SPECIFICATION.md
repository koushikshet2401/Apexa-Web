# APEX PACIFIC HOLDINGS — PHASE 5 BUSINESS-ALIGNED SPECIFICATION
## Restored Phase 1 Valuation Governance, Multi-Currency Parity, Sold Property Visibility & Database Integrity

**Document ID:** `APH-PHASE5-BUSINESS-SPEC-009` (Supersedes `APH-PHASE5-BUSINESS-SPEC-008`, `007`, `006`, `005` & `004`)  
**Date:** 6 November 2026, 5:30 PM  
**Project:** `E:\ApexaHoldings\Apex_Frontend`  
**Framework:** Next.js 15 App Router  
**Database Engine:** PostgreSQL 18.6 (`apex` on `localhost:5432`)  
**ORM:** Prisma 6.19.3  
**Status:** **Definitive Pre-Implementation Architecture Specification Awaiting Executive Approval**  
*(Strictly Pre-Implementation: Architecture Documentation Only — Zero Application Code, Schema Mutations, or Database Changes Executed)*  

---

## ARCHITECTURAL CORRECTION MATRIX (EDITION 009)

The following matrix documents the specific architectural issues resolved in this revision Pass, identifying the root cause, architectural resolution, and relevant document section:

| # | Review Issue | Root Cause in Specification 008 | Architectural Resolution in Specification 009 | Relevant Section |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Currency Registry & Minor-Unit Precision** | DB table and TS enum risked manual drift; JPY fractional amounts were possible. | Defined `src/config/currencies.ts` as the single authoritative registry. DB seed and TS types derive directly from it. Enforced currency-specific `minorUnits` (JPY=0, USD=2) via Zod refinements and PostgreSQL function `validate_currency_minor_units()`. | **Section 2.2, 2.3 & 5.2** |
| **2** | **Completed Deal Financial Corrections** | Original transacted values risked overwrite; dashboard display of adjusted vs original was undefined. | Original `Deal` row is permanently immutable. Corrections are recorded in `DealFinancialAdjustment` by `SUPER_ADMIN` with `adjustmentSequence`. Dashboards report both `originalSalesVolume` and `effectiveSalesVolume`. | **Section 3.3, 3.4 & 8.4** |
| **3** | **Database Immutability, Privileges & TRUNCATE** | Triggers alone did not block `TRUNCATE`; table ownership and connection privileges were unseparated. | Revoked `UPDATE`, `DELETE`, `TRUNCATE` from runtime role `apex_app` on audit tables. Appended `BEFORE TRUNCATE` statement triggers. Clarified table ownership by migration admin role. Corrections insert into adjustment table without bypassing triggers. | **Section 4.3 & 5.3** |
| **4** | **Consistent Property Pricing States** | Three valid states (Priced, POA, Unpriced) were not formally unified across API and DB check constraints. | Formally defined the 3 states: A (Priced: `> 0` + currency), B (POA: `isPOA=true`, nulls), C (Unpriced: `isPOA=false`, nulls). Unified into a single PostgreSQL `CHECK` constraint and Zod schema. Zero strictly prohibited. | **Section 4.2 & 5.2** |
| **5** | **Currency-Specific Decimal Validation** | API validation lacked minor-unit awareness; floating-point risks were unspecified. | Aligned API maximum to `DECIMAL(18,2)` ceiling (`999999999999999.99`). Enforced `minorUnits` scale limits. Mandated `Prisma.Decimal` (`decimal.js`) for all backend calculations to eliminate IEEE 754 floating-point errors. | **Section 2.3 & 8.1** |
| **6** | **Dashboard Inventory Count Clarification** | Ambiguity between `publishedCount` and public website visibility (`isPubliclyVisible`). | Explicitly harmonized: `activePublicListingsCount` (`isPublished=true AND isArchived=false AND isPubliclyVisible=true`) vs. `totalPublishedCount` (including Option A Acquired trophy showcase). Clear labels across Metric 2 and Metric 5. | **Section 1.2, 1.3 & 8.4** |
| **7** | **Final Cross-Section Audit** | Potential minor field-name mismatches between SQL queries and TypeScript contracts. | Audited all 5 SQL queries, TypeScript interfaces, Prisma models, check constraints, and triggers for 100% field, alias, and type parity. Preserved Phase 1 portfolio scope, multi-currency grouping, and per-deal visibility choice. | **Section 1.3, 5.2, 8.4** |

---

## EXECUTIVE SUMMARY & ALIGNMENT MATRIX

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CORE ARCHITECTURAL MATRIX                                            │
├──────────────────────────────────────────────────────┬─────────────────────────────────────────────────┤
│ RESTORED PHASE 1 PORTFOLIO VALUATION RULE            │ FIVE SEPARATED DASHBOARD METRICS                │
├──────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ • Total portfolio valuation includes ALL states:     │ 1. Total Portfolio Value by Currency            │
│   - Published projects                               │    (Published + Draft + Sold + Archived)        │
│   - Draft projects                                   │ 2. Active Published Listings Valuation          │
│   - Sold projects (hasCompletedDeal: true)           │    (Live customer website showcase only)        │
│   - Recoverably archived projects (Deleted tab)      │ 3. Completed Deal Volume by Currency            │
│ • Excludes ONLY permanently deleted projects         │    (Reports original & effective sales volume)  │
│ • Never use active listing filter for portfolio val  │ 4. Completed Deal Counts & Ratios               │
│                                                      │    (Win Rate & Pipeline Throughput Rate)        │
│                                                      │ 5. POA & Unpriced Asset Inventory Counts        │
├──────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ DECISION 1: MULTI-CURRENCY GOVERNANCE                │ DECISION 2: SOLD PROPERTY VISIBILITY            │
├──────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ • Dynamic currency selection per project & deal      │ • Mandatory per-deal Admin choice               │
│ • Single source of truth currency registry           │ • Option A: Keep Publicly Visible               │
│ • minorUnits precision enforced (JPY=0, USD=2)       │   - Retained on public site with Acquired badge │
│ • Coupled dual storage: amount (18,2) + currency     │ • Option B: Hide Publicly                       │
│ • Strict anti-co-mingling: Zero cross-currency sums  │   - Unpublishes & moves to Sold Projects tab    │
│ • Historical FX snapshots: source, target, rate(18,8)│ • Both options count toward deal totals & volume│
├──────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ IMMUTABILITY & AUDITABILITY GUARANTEES               │ STRICT CONTRACT SEPARATION                      │
├──────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ • Triggers + DCL prevent deal & snapshot updates/del │ • PATCH /projects/[id] (Descriptive edits only) │
│ • TRUNCATE blocked by triggers & revoked permissions │   - Rejects financial fields with HTTP 400      │
│ • Corrections recorded via DealFinancialAdjustment   │ • PATCH /projects/[id]/price (Financials only)  │
│ • Three valid pricing states: Priced, POA, Unpriced  │   - Validates 3 pricing states; zero forbidden  │
└──────────────────────────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 1. RESTORED PHASE 1 PORTFOLIO VALUATION GOVERNANCE

### 1.1 The Phase 1 Portfolio Valuation Invariant
In accordance with approved Phase 1 business logic, corporate portfolio valuation reflects the **total capital value under Apex Pacific Holdings stewardship across all managed assets**, regardless of immediate publication status.

$$\mathbf{Portfolio\ Valuation\ Asset\ Scope} = \texttt{Published} \cup \texttt{Draft} \cup \texttt{Sold} \cup \texttt{Recoverably\ Archived}$$

- **Published Projects:** Actively marketed luxury assets live on the public showcase.
- **Draft Projects:** Pipeline assets undergoing curation, photography, architectural copywriting, or legal review.
- **Sold Projects:** Successfully transacted properties under historical stewardship.
- **Recoverably Archived Projects:** Assets moved to the "Deleted Projects" section that remain soft-deleted in PostgreSQL.
- **Exclusions:** Excludes **ONLY** permanently deleted projects (in Phase 5, permanent physical deletion is disabled, guaranteeing 100% data preservation).

> [!CAUTION]
> **CRITICAL ARCHITECTURAL INVARIANT:**
> Under no circumstances may the active published listing filter (`isPublished = true AND isArchived = false AND isPubliclyVisible = true`) be used for the Total Portfolio Valuation calculation. Active listings represent only marketing inventory, not total portfolio stewardship.

### 1.2 Separation of Five Distinct Dashboard Financial Metrics
To prevent metric conflation, administrative dashboards, corporate reports, and analytics endpoints (`GET /api/admin/analytics/dashboard`) compute and return five distinctly separated financial metrics:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FIVE SEPARATED DASHBOARD FINANCIAL METRICS                             │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ METRIC 1: TOTAL PORTFOLIO VALUATION BY CURRENCY                                                        │
│   Scope: Published + Draft + Sold + Recoverably Archived                                               │
│   Filter: askingPriceNumeric IS NOT NULL AND isPOA = false                                             │
│   Grouping: GROUP BY askingCurrency                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ METRIC 2: ACTIVE PUBLISHED LISTINGS VALUATION BY CURRENCY                                              │
│   Scope: Active marketing inventory live on customer website                                          │
│   Filter: isPublished = true AND isArchived = false AND isPubliclyVisible = true                       │
│   Grouping: GROUP BY askingCurrency                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ METRIC 3: COMPLETED DEAL VOLUME BY SALE CURRENCY                                                       │
│   Scope: Closed transactions executed through the platform                                             │
│   Filter: status = 'COMPLETED' AND actualSalePrice IS NOT NULL                                         │
│   Reporting: Original Closed Volume AND Effective Adjusted Volume                                      │
│   Grouping: GROUP BY saleCurrency                                                                      │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ METRIC 4: COMPLETED DEAL COUNTS & RATIOS                                                               │
│   Scope: Closed transaction counts, visibility breakdown, Win Rate & Pipeline Throughput Rate         │
│   Sub-metrics: Total Completed, Option A Visible, Option B Hidden, Win Rate %, Pipeline Rate %         │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ METRIC 5: ASSET INVENTORY & PRICING STRUCTURE COUNTS                                                   │
│   Scope: Properties categorized by publication visibility, lifecycle stage, and pricing structure      │
│   Sub-metrics: activePublicListingsCount, totalPublishedCount, draftCount, archivedCount, poaCount    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Database Query Specification for the 5 Metrics

#### Metric 1: Total Corporate Portfolio Valuation by Currency
```sql
SELECT 
    "askingCurrency" AS currency,
    COUNT(*)::INTEGER AS property_count,
    SUM("askingPriceNumeric") AS total_amount
FROM "Property"
WHERE "askingPriceNumeric" IS NOT NULL 
  AND "isPOA" = false
GROUP BY "askingCurrency"
ORDER BY total_amount DESC;
```
*(Includes published, draft, sold, and archived properties; excludes zero records).*

#### Metric 2: Active Published Listings Valuation by Currency
```sql
SELECT 
    "askingCurrency" AS currency,
    COUNT(*)::INTEGER AS active_listing_count,
    SUM("askingPriceNumeric") AS active_amount
FROM "Property"
WHERE "isPublished" = true 
  AND "isArchived" = false 
  AND "isPubliclyVisible" = true
  AND "askingPriceNumeric" IS NOT NULL
  AND "isPOA" = false
GROUP BY "askingCurrency"
ORDER BY active_amount DESC;
```

#### Metric 3: Completed Deal Sales Volume (Original & Effective Adjusted)
```sql
WITH LatestAdjustments AS (
    SELECT DISTINCT ON ("dealId")
        "dealId",
        "adjustedSalePrice",
        "adjustedCurrency"
    FROM "DealFinancialAdjustment"
    ORDER BY "dealId", "adjustmentSequence" DESC
)
SELECT 
    d."saleCurrency" AS currency,
    COUNT(d.id)::INTEGER AS closed_deals_count,
    SUM(d."actualSalePrice") AS original_sales_volume,
    SUM(COALESCE(adj."adjustedSalePrice", d."actualSalePrice")) AS effective_sales_volume,
    COUNT(adj."dealId")::INTEGER AS adjusted_deals_count
FROM "Deal" d
LEFT JOIN LatestAdjustments adj ON d.id = adj."dealId" AND d."saleCurrency" = adj."adjustedCurrency"
WHERE d."status" = 'COMPLETED'
  AND d."actualSalePrice" IS NOT NULL
GROUP BY d."saleCurrency"
ORDER BY original_sales_volume DESC;
```

#### Metric 4: Completed Deal Counts, Visibility Breakdown & Canonical Ratios
```sql
SELECT 
    COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::INTEGER AS total_completed_deals,
    COUNT(*) FILTER (WHERE "status" = 'COMPLETED' AND "keepPubliclyVisible" = true)::INTEGER AS option_a_visible_count,
    COUNT(*) FILTER (WHERE "status" = 'COMPLETED' AND "keepPubliclyVisible" = false)::INTEGER AS option_b_unlisted_count,
    COUNT(*) FILTER (WHERE "status" = 'LOST')::INTEGER AS total_lost_deals,
    COUNT(*) FILTER (WHERE "status" IN ('INQUIRY', 'CONTACTED', 'OFFER_MADE', 'UNDER_CONTRACT'))::INTEGER AS total_active_pipeline_deals,
    COUNT(*)::INTEGER AS total_deals_count,
    -- Canonical Win Rate: Completed / (Completed + Lost) * 100
    CASE 
        WHEN COUNT(*) FILTER (WHERE "status" IN ('COMPLETED', 'LOST')) > 0 
        THEN ROUND(
            (COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::DECIMAL / 
             COUNT(*) FILTER (WHERE "status" IN ('COMPLETED', 'LOST'))::DECIMAL) * 100, 
            2
        )
        ELSE NULL 
    END AS win_rate_percentage,
    -- Pipeline Throughput Rate: Completed / Total Deals * 100
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND(
            (COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::DECIMAL / COUNT(*)::DECIMAL) * 100, 
            2
        )
        ELSE NULL 
    END AS pipeline_throughput_percentage
FROM "Deal";
```

#### Metric 5: Asset Inventory & Pricing Structure Counts
```sql
SELECT 
    COUNT(*)::INTEGER AS total_properties_count,
    -- Active public showcase inventory (strictly live on public site)
    COUNT(*) FILTER (WHERE "isPublished" = true AND "isArchived" = false AND "isPubliclyVisible" = true)::INTEGER AS active_public_listings_count,
    -- Total published assets (including Option A Acquired showcase assets)
    COUNT(*) FILTER (WHERE "isPublished" = true AND "isArchived" = false)::INTEGER AS total_published_count,
    -- Internal draft pipeline
    COUNT(*) FILTER (WHERE "isDraft" = true AND "isArchived" = false)::INTEGER AS draft_count,
    -- Recoverably archived assets (in Deleted tab)
    COUNT(*) FILTER (WHERE "isArchived" = true)::INTEGER AS archived_count,
    -- Pricing structure counts
    COUNT(*) FILTER (WHERE "isPOA" = true)::INTEGER AS poa_count,
    COUNT(*) FILTER (WHERE "askingPriceNumeric" IS NULL AND "isPOA" = false)::INTEGER AS unpriced_count
FROM "Property";
```

### 1.4 Mathematical Anti-Co-Mingling Rule
> [!IMPORTANT]
> **Strict Anti-Co-Mingling Invariant:**  
> Direct arithmetic addition of numbers with differing currency tags is mathematically invalid and strictly prohibited:
> $$\text{Total} \neq \sum_{i} \text{Amount}_i \quad \text{if } \exists \, c_i \neq c_j$$
> Every financial response returned by the backend MUST return distinct arrays grouped by ISO 4217 currency code. The UI renders distinct currency badges without summing disparate currencies.

---

## 2. DECISION 1: AUTHORITATIVE CURRENCY REGISTRY & PRECISION GOVERNANCE

### 2.1 Single Authoritative Source of Truth (SSOT)
To eliminate any risk of drift between application validation and database storage, the system establishes a **single authoritative code-level registry** located at `src/config/currencies.ts`:

```typescript
export interface CurrencyDefinition {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly minorUnits: number; // 0 for JPY; 2 for AED, USD, EUR, etc.
  readonly isOperational: boolean;
  readonly jurisdiction: string;
}

export const SUPPORTED_CURRENCY_REGISTRY: Record<string, CurrencyDefinition> = {
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', minorUnits: 2, isOperational: true, jurisdiction: 'UAE' },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', minorUnits: 2, isOperational: true, jurisdiction: 'International' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnits: 2, isOperational: true, jurisdiction: 'India' },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', minorUnits: 2, isOperational: true, jurisdiction: 'Thailand' },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', minorUnits: 2, isOperational: true, jurisdiction: 'Malaysia' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', minorUnits: 2, isOperational: true, jurisdiction: 'Australia' },
  GEL: { code: 'GEL', name: 'Georgian Lari', symbol: '₾', minorUnits: 2, isOperational: true, jurisdiction: 'Georgia' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', minorUnits: 2, isOperational: true, jurisdiction: 'Europe' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', minorUnits: 2, isOperational: true, jurisdiction: 'UK' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', minorUnits: 2, isOperational: true, jurisdiction: 'Singapore' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', minorUnits: 2, isOperational: true, jurisdiction: 'Switzerland' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', minorUnits: 2, isOperational: true, jurisdiction: 'Canada' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', minorUnits: 0, isOperational: true, jurisdiction: 'Japan' }
} as const;

export const SUPPORTED_CURRENCY_CODES = Object.keys(SUPPORTED_CURRENCY_REGISTRY) as [string, ...string[]];
export type SupportedCurrencyCode = keyof typeof SUPPORTED_CURRENCY_REGISTRY;
```

### 2.2 PostgreSQL Reference Table & Foreign Key Constraints
The database table `SupportedCurrency` is populated directly from this registry during initial migration/seeding. Zero currencies outside this list may be inserted:

```sql
CREATE TABLE "SupportedCurrency" (
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "symbol" VARCHAR(8) NOT NULL,
    "minorUnits" INTEGER NOT NULL DEFAULT 2,
    "isOperational" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportedCurrency_pkey" PRIMARY KEY ("code")
);

-- Foreign Key Constraints enforcing supported currency registry across all financial models:
ALTER TABLE "Property" 
ADD CONSTRAINT "fk_property_asking_currency" 
FOREIGN KEY ("askingCurrency") REFERENCES "SupportedCurrency"("code") 
ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "Deal" 
ADD CONSTRAINT "fk_deal_sale_currency" 
FOREIGN KEY ("saleCurrency") REFERENCES "SupportedCurrency"("code") 
ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "ExchangeRate" 
ADD CONSTRAINT "fk_exchange_rate_from_currency" 
FOREIGN KEY ("fromCurrency") REFERENCES "SupportedCurrency"("code") 
ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "ExchangeRate" 
ADD CONSTRAINT "fk_exchange_rate_to_currency" 
FOREIGN KEY ("toBaseCurrency") REFERENCES "SupportedCurrency"("code") 
ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "PropertyValuationSnapshot" 
ADD CONSTRAINT "fk_snapshot_asking_currency" 
FOREIGN KEY ("askingCurrency") REFERENCES "SupportedCurrency"("code") 
ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "PropertyValuationSnapshot" 
ADD CONSTRAINT "fk_snapshot_base_currency" 
FOREIGN KEY ("baseCurrency") REFERENCES "SupportedCurrency"("code") 
ON UPDATE CASCADE ON DELETE RESTRICT;
```

### 2.3 Currency-Specific Precision Enforcement (Zero Fractional JPY)
Different ISO currencies operate with different minor-unit precisions. Specifically:
- **`JPY` has `minorUnits = 0`:** Fractional amounts (such as `150,000.50 JPY`) are economically invalid and must be rejected.
- **`USD`, `AED`, `EUR`, etc. have `minorUnits = 2`:** At most 2 decimal places are permitted.

#### 1. PostgreSQL Function & Check Constraints
```sql
CREATE OR REPLACE FUNCTION validate_currency_minor_units(p_amount DECIMAL, p_currency VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_minor_units INTEGER;
BEGIN
    IF p_amount IS NULL OR p_currency IS NULL THEN
        RETURN TRUE;
    END IF;
    
    SELECT "minorUnits" INTO v_minor_units FROM "SupportedCurrency" WHERE "code" = p_currency;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- JPY (minorUnits = 0): Must have zero decimal component (amount = floor(amount))
    IF v_minor_units = 0 AND (p_amount != FLOOR(p_amount)) THEN
        RETURN FALSE;
    END IF;

    -- 2 decimal currencies (minorUnits = 2): At most 2 decimal places
    IF v_minor_units = 2 AND (p_amount * 100 != FLOOR(p_amount * 100)) THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Apply to Property asking price
ALTER TABLE "Property" ADD CONSTRAINT "check_property_currency_precision"
CHECK (validate_currency_minor_units("askingPriceNumeric", "askingCurrency"));

-- Apply to Deal sale price
ALTER TABLE "Deal" ADD CONSTRAINT "check_deal_currency_precision"
CHECK (validate_currency_minor_units("actualSalePrice", "saleCurrency"));
```

#### 2. Zod Application-Level Refinement
```typescript
export const SupportedCurrencySchema = z.enum(SUPPORTED_CURRENCY_CODES, {
  errorMap: () => ({ message: 'Invalid or unsupported ISO 4217 currency code' })
});

export const MonetaryAmountSchema = (currencyField: string = 'currency') =>
  z.number()
    .positive('Amount must be strictly greater than zero')
    .max(999999999999999.99, 'Amount exceeds maximum DECIMAL(18,2) capacity')
    .superRefine((val, ctx) => {
      // Scale validation against currency minorUnits
      const parent = (ctx as any).parent;
      const currency = parent?.[currencyField] as SupportedCurrencyCode | undefined;
      if (currency && SUPPORTED_CURRENCY_REGISTRY[currency]) {
        const allowedDecimals = SUPPORTED_CURRENCY_REGISTRY[currency].minorUnits;
        const strVal = val.toString();
        const decimals = strVal.includes('.') ? strVal.split('.')[1].length : 0;
        if (decimals > allowedDecimals) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${currency} allows at most ${allowedDecimals} decimal places (received ${decimals})`
          });
        }
      }
    });
```

### 2.4 Decimal Arithmetic & Floating-Point Protection
- All backend monetary calculations, aggregations, and snapshot conversions **must never use native JavaScript floating-point numbers** (`number`), which suffer from IEEE 754 precision loss.
- All amounts must be instantiated as `Prisma.Decimal` (powered by `decimal.js`).
- Database columns are typed as `DECIMAL(18, 2)` for currency values and `DECIMAL(18, 8)` for exchange rates.

---

## 3. DECISION 2: SOLD PROPERTY VISIBILITY & TRANSACTION IMMUTABILITY

### 3.1 Mandatory Per-Deal Admin Visibility Choice
When completing a transaction via `POST /api/admin/deals/[id]/complete`, the administrator must explicitly select between two approved business workflows:

```
                               POST /api/admin/deals/[id]/complete
                                                │
                                                ▼
                               ┌──────────────────────────────────┐
                               │     MANDATORY ADMIN CHOICE       │
                               │    keepPubliclyVisible: bool     │
                               └────────────────┬─────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
                 ▼                                                             ▼
  ┌──────────────────────────────┐                              ┌──────────────────────────────┐
  │   OPTION A: KEEP VISIBLE     │                              │    OPTION B: HIDE PUBLIC     │
  │   keepPubliclyVisible: true  │                              │   keepPubliclyVisible: false │
  └──────────────┬───────────────┘                              └──────────────┬───────────────┘
                 │                                                             │
                 ▼                                                             ▼
  ┌──────────────────────────────┐                              ┌──────────────────────────────┐
  │   PUBLIC SHOWCASE OUTCOME    │                              │   PUBLIC SHOWCASE OUTCOME    │
  │ • hasCompletedDeal: true     │                              │ • hasCompletedDeal: true     │
  │ • isPublished: true          │                              │ • isPublished: false         │
  │ • isPubliclyVisible: true    │                              │ • isPubliclyVisible: false   │
  │ • Retained in Current Projects│                             │ • Removed from public website│
  │ • Displays "ACQUIRED" badge  │                              │ • Moved to Sold Projects tab │
  │ • Counted in deal totals     │                              │ • Counted in deal totals     │
  └──────────────────────────────┘                              └──────────────────────────────┘
```

### 3.2 Operational Comparison: Option A vs. Option B

| Operational Dimension | Option A: Keep Publicly Visible (`true`) | Option B: Hide Publicly (`false`) |
| :--- | :--- | :--- |
| **Business Purpose** | Trophy marketing showcase; highlights brand transaction volume and prestige acquisitions. | Confidential acquisitions; protects high-net-worth client and family office privacy. |
| **Property `isPublished`** | `true` | `false` |
| **Property `isPubliclyVisible`**| `true` | `false` |
| **Property `hasCompletedDeal`** | `true` | `true` |
| **Public Website Display** | Retained in Current Projects, Country Collections, and Search. Displays gold luxury badge: `"ACQUIRED / PRIVATE TRANSACTION"`. | Immediately removed from public website; direct URL returns HTTP 404. |
| **Admin Panel Section** | Retained in Active Projects table with a `"Sold (Public)"` tag. | Moved to internal `"Sold Projects"` administrative archive view. |
| **Deal Record Status** | `status = 'COMPLETED'` | `status = 'COMPLETED'` |
| **Completed Deals Counter** | **Increments completed deal count** | **Increments completed deal count** |
| **Deal Sales Volume Sum** | **Included in closed deal volume** | **Included in closed deal volume** |
| **Audit Trail Action** | Logged with `visibilityOutcome: "PUBLIC_ACQUIRED"` | Logged with `visibilityOutcome: "HIDDEN_SOLD"` |

### 3.3 Completed Deal Immutability (PostgreSQL Triggers)
A PostgreSQL `CHECK` constraint evaluates row state in isolation and is physically incapable of comparing previous (`OLD`) vs. new (`NEW`) states during an `UPDATE`. To guarantee absolute financial immutability for completed transactions, PostgreSQL trigger functions are mandatory:

```sql
-- 1. Trigger function: Block any modification to financial, status, or attribution fields on COMPLETED deals
CREATE OR REPLACE FUNCTION enforce_completed_deal_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'COMPLETED' THEN
        IF NEW.status != 'COMPLETED' THEN
            RAISE EXCEPTION 'Terminal state violation: Deal % is COMPLETED and cannot be reopened or transitioned to %', 
                OLD.id, NEW.status
            USING ERRCODE = 'integrity_constraint_violation';
        END IF;

        IF NEW."actualSalePrice" IS DISTINCT FROM OLD."actualSalePrice" THEN
            RAISE EXCEPTION 'Financial immutability violation: actualSalePrice on COMPLETED deal % cannot be altered (Original: %, Attempted: %)', 
                OLD.id, OLD."actualSalePrice", NEW."actualSalePrice"
            USING ERRCODE = 'integrity_constraint_violation';
        END IF;

        IF NEW."saleCurrency" IS DISTINCT FROM OLD."saleCurrency" THEN
            RAISE EXCEPTION 'Financial immutability violation: saleCurrency on COMPLETED deal % cannot be altered (Original: %, Attempted: %)', 
                OLD.id, OLD."saleCurrency", NEW."saleCurrency"
            USING ERRCODE = 'integrity_constraint_violation';
        END IF;

        IF NEW."closedAt" IS DISTINCT FROM OLD."closedAt" THEN
            RAISE EXCEPTION 'Audit immutability violation: closedAt on COMPLETED deal % cannot be altered', OLD.id
            USING ERRCODE = 'integrity_constraint_violation';
        END IF;

        IF NEW."closedById" IS DISTINCT FROM OLD."closedById" THEN
            RAISE EXCEPTION 'Audit immutability violation: closedById on COMPLETED deal % cannot be altered', OLD.id
            USING ERRCODE = 'integrity_constraint_violation';
        END IF;

        IF NEW."propertyId" IS DISTINCT FROM OLD."propertyId" THEN
            RAISE EXCEPTION 'Integrity violation: propertyId on COMPLETED deal % cannot be re-assigned', OLD.id
            USING ERRCODE = 'integrity_constraint_violation';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_completed_immutability
BEFORE UPDATE ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION enforce_completed_deal_immutability();

-- 2. Trigger function: Prevent physical deletion of completed transactions
CREATE OR REPLACE FUNCTION prevent_completed_deal_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Security violation: COMPLETED deal % cannot be deleted from the platform', OLD.id
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_completed_prevent_delete
BEFORE DELETE ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION prevent_completed_deal_deletion();
```

### 3.4 Legitimate Administrative Corrections Protocol (`DealFinancialAdjustment`)
Completed transaction rows in `Deal` are **never overwritten in-place**. If a signed contract addendum, price revision, or clerical correction is formally authorized:

```sql
CREATE TABLE "DealFinancialAdjustment" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "adjustmentSequence" INTEGER NOT NULL,
    "previousSalePrice" DECIMAL(18, 2) NOT NULL,
    "previousCurrency" VARCHAR(3) NOT NULL,
    "adjustedSalePrice" DECIMAL(18, 2) NOT NULL,
    "adjustedCurrency" VARCHAR(3) NOT NULL,
    "adjustmentReason" TEXT NOT NULL,
    "legalContractRef" TEXT NOT NULL,
    "authorizedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealFinancialAdjustment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DealFinancialAdjustment_deal_seq_key" UNIQUE ("dealId", "adjustmentSequence"),
    CONSTRAINT "fk_adjustment_deal" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT,
    CONSTRAINT "fk_adjustment_prev_curr" FOREIGN KEY ("previousCurrency") REFERENCES "SupportedCurrency"("code") ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT "fk_adjustment_adj_curr" FOREIGN KEY ("adjustedCurrency") REFERENCES "SupportedCurrency"("code") ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT "fk_adjustment_admin" FOREIGN KEY ("authorizedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT,
    CONSTRAINT "check_adjustment_price_positive" CHECK ("adjustedSalePrice" > 0),
    CONSTRAINT "check_adjustment_precision" CHECK (validate_currency_minor_units("adjustedSalePrice", "adjustedCurrency"))
);

CREATE INDEX "DealFinancialAdjustment_dealId_idx" ON "DealFinancialAdjustment"("dealId", "adjustmentSequence" DESC);
```

#### Administrative Governance Rules:
1. **Authorization Gate:** Only users with `SUPER_ADMIN` role may execute `POST /api/admin/deals/[id]/adjustments`.
2. **Adjustment Sequence:** The database automatically sets `adjustmentSequence = (SELECT COALESCE(MAX("adjustmentSequence"), 0) + 1 FROM "DealFinancialAdjustment" WHERE "dealId" = $1)`.
3. **Audit Trail:** An adjustment writes an immutable record to `DealFinancialAdjustment` and logs a high-severity entry in `AdminActivityLog` under `action = 'DEAL_FINANCIAL_CORRECTION'`.
4. **Dashboard Reporting:** The original transaction price on `Deal` remains untouched. Analytics endpoints report both `originalSalesVolume` and `effectiveSalesVolume` (incorporating the latest adjustment sequence).

---

## 4. PRICE HISTORY & PROPERTY PRICING STATE ARCHITECTURE

### 4.1 The Three Approved Property Pricing States
Every property in the platform must reside in exactly one of three valid pricing states:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE THREE APPROVED PRICING STATES                                      │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────────────────────┤
│ STATE A: PRICED            │ STATE B: POA                │ STATE C: UNPRICED                           │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ • isPOA: false             │ • isPOA: true               │ • isPOA: false                              │
│ • askingPriceNumeric: > 0  │ • askingPriceNumeric: null  │ • askingPriceNumeric: null                  │
│ • askingCurrency: Valid FK │ • askingCurrency: null      │ • askingCurrency: null                      │
│ • price: "AED 45,000,000"  │ • price: "Price on App."    │ • price: null                               │
│ • Included in sums         │ • Excluded from sums        │ • Excluded from sums                        │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────────────────────┘
```

#### Strict Invariant: Zero is Strictly Prohibited
- A price of `0.00` is invalid in luxury property management.
- If an asset does not have a positive asking price, it must be designated as **POA** (`isPOA = true`) or **Unpriced** (`isPOA = false, price = null`).
- Partial combinations (e.g. price without currency, currency without price, or POA with price) are strictly rejected.

### 4.2 Explicitly Decoupled Update Contracts (Zero Silent Overwrites)

```
                            ADMIN PROJECT MUTATION ROUTING
                                          │
                 ┌────────────────────────┴────────────────────────┐
                 ▼                                                 ▼
  PATCH /api/admin/projects/[id]                 PATCH /api/admin/projects/[id]/price
  ┌──────────────────────────────┐               ┌───────────────────────────────────┐
  │     DESCRIPTIVE UPDATES      │               │         FINANCIAL UPDATES         │
  │ • name, tagline, description │               │ • isPOA: boolean                  │
  │ • bedrooms, bathrooms, area  │               │ • askingPriceNumeric: > 0 | null  │
  │ • coordinates, media, tags   │               │ • askingCurrency: code | null     │
  │                              │               │ • reason: mandatory string        │
  │ REJECTS WITH HTTP 400 IF:    │               │                                   │
  │ • askingPriceNumeric present │               │ REJECTS WITH HTTP 400 IF:         │
  │ • askingCurrency present     │               │ • Descriptive fields present      │
  │ • isPOA present              │               │ • Zero amount supplied            │
  │ • price present              │               │ • Invalid state combination       │
  │                              │               │ • Currency minorUnits violated    │
  │ Logs: PROJECT_UPDATED        │               │ Logs: PROJECT_PRICE_CHANGED       │
  └──────────────────────────────┘               └───────────────────────────────────┘
```

#### Financial Price Update Schema (`PATCH /api/admin/projects/[id]/price`):
```typescript
export const UpdateProjectPriceSchema = z.discriminatedUnion('pricingState', [
  // State A: Priced
  z.object({
    pricingState: z.literal('PRICED'),
    isPOA: z.literal(false),
    askingPriceNumeric: z.number().positive('Asking price must be strictly greater than zero').max(999999999999999.99),
    askingCurrency: SupportedCurrencySchema,
    reason: z.string().min(5, 'Mandatory price change reason (min 5 characters)')
  }),
  // State B: POA
  z.object({
    pricingState: z.literal('POA'),
    isPOA: z.literal(true),
    askingPriceNumeric: z.null(),
    askingCurrency: z.null(),
    reason: z.string().min(5, 'Mandatory price change reason (min 5 characters)')
  }),
  // State C: Unpriced
  z.object({
    pricingState: z.literal('UNPRICED'),
    isPOA: z.literal(false),
    askingPriceNumeric: z.null(),
    askingCurrency: z.null(),
    reason: z.string().min(5, 'Mandatory price change reason (min 5 characters)')
  })
]).superRefine((data, ctx) => {
  if (data.pricingState === 'PRICED') {
    const currencyDef = SUPPORTED_CURRENCY_REGISTRY[data.askingCurrency];
    if (currencyDef) {
      const decimals = data.askingPriceNumeric.toString().includes('.')
        ? data.askingPriceNumeric.toString().split('.')[1].length
        : 0;
      if (decimals > currencyDef.minorUnits) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${data.askingCurrency} allows at most ${currencyDef.minorUnits} decimal places (received ${decimals})`
        });
      }
    }
  }
});
```

### 4.3 Protection of Historical Valuation Snapshots & Audit Trail
- `PropertyValuationSnapshot` records represent point-in-time corporate portfolio valuations under historical exchange rates.
- Updating `Property.askingPriceNumeric` or `Property.askingCurrency`:
  1. **NEVER modifies, recalculates, or overwrites past `PropertyValuationSnapshot` rows.**
  2. **NEVER modifies past `Deal` sale prices or currencies.**
  3. Writes an immutable differential audit record to `AdminActivityLog` under `action = 'PROJECT_PRICE_CHANGED'` capturing `oldAmount`, `oldCurrency`, `newAmount`, `newCurrency`, `adminId`, `timestamp`, and `reason`.

---

## 5. DATABASE PRIVILEGES, IMMUTABILITY & TRUNCATE PROTECTION

### 5.1 Role Separation & Table Ownership Architecture
To ensure defense-in-depth, the PostgreSQL database operates with strict separation of roles:
1. **Schema & Migration Owner (`apex_migration_admin` or `postgres`):**
   - Owns all tables, constraints, functions, and triggers.
   - Executes DDL during maintenance gates.
   - Does NOT handle daily Next.js application traffic.
2. **Runtime Application Role (`apex_app`):**
   - Used by the Next.js Prisma connection pool.
   - **NOT a table owner and NOT a superuser.**
   - Subject to strict Data Control Language (DCL) permissions.

```sql
-- Revoke all default table modification privileges on append-only tables
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE 
    "PropertyValuationSnapshot", 
    "AdminActivityLog", 
    "DealFinancialAdjustment" 
FROM apex_app;

-- Grant strictly read and append access to the application role
GRANT SELECT, INSERT ON TABLE 
    "PropertyValuationSnapshot", 
    "AdminActivityLog", 
    "DealFinancialAdjustment" 
TO apex_app;

-- Revoke DELETE and TRUNCATE on transactions
REVOKE DELETE, TRUNCATE ON TABLE "Deal" FROM apex_app;
GRANT SELECT, INSERT, UPDATE ON TABLE "Deal" TO apex_app;
```

### 5.2 Trigger-Level TRUNCATE Protection
Because standard PostgreSQL row-level triggers do not fire on `TRUNCATE`, statement-level triggers are established on all transaction and audit tables:

```sql
CREATE OR REPLACE FUNCTION prevent_truncate_immutable_tables()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security violation: Table % is protected. TRUNCATE is strictly prohibited on financial audit tables.', TG_TABLE_NAME
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_prevent_truncate
BEFORE TRUNCATE ON "Deal"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_truncate_immutable_tables();

CREATE TRIGGER trigger_snapshot_prevent_truncate
BEFORE TRUNCATE ON "PropertyValuationSnapshot"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_truncate_immutable_tables();

CREATE TRIGGER trigger_activity_log_prevent_truncate
BEFORE TRUNCATE ON "AdminActivityLog"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_truncate_immutable_tables();

CREATE TRIGGER trigger_adjustment_prevent_truncate
BEFORE TRUNCATE ON "DealFinancialAdjustment"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_truncate_immutable_tables();
```

### 5.3 Unified PostgreSQL Check Constraints

#### 1. Pricing States Check Constraint (Property Table)
```sql
ALTER TABLE "Property" ADD CONSTRAINT "check_property_valid_pricing_states"
CHECK (
  -- State A: Priced (positive amount, valid currency, isPOA=false)
  ("isPOA" = false AND "askingPriceNumeric" IS NOT NULL AND "askingPriceNumeric" > 0 AND "askingCurrency" IS NOT NULL) OR
  -- State B: POA (both null, isPOA=true)
  ("isPOA" = true AND "askingPriceNumeric" IS NULL AND "askingCurrency" IS NULL) OR
  -- State C: Unpriced (both null, isPOA=false)
  ("isPOA" = false AND "askingPriceNumeric" IS NULL AND "askingCurrency" IS NULL)
);
```

#### 2. Completed Deal Financial Check Constraint (Deal Table)
```sql
ALTER TABLE "Deal" ADD CONSTRAINT "check_completed_deal_has_financials"
CHECK (
  "status" != 'COMPLETED' OR (
    "actualSalePrice" IS NOT NULL AND 
    "actualSalePrice" > 0 AND 
    "saleCurrency" IS NOT NULL AND 
    "closedAt" IS NOT NULL AND 
    "closedById" IS NOT NULL
  )
);
```

---

## 6. COMPLETED DEAL RATIO ARCHITECTURE & DEFINITION

### 6.1 The Mathematical Definition of Completed Deal Ratios
The platform establishes **two distinct, standard commercial real estate (CRE) deal conversion ratios**:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              CANONICAL DEAL CONVERSION RATIO DEFINITIONS                               │
├────────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ PRIMARY METRIC: DEAL CONVERSION WIN RATE           │ SECONDARY METRIC: PIPELINE THROUGHPUT RATE        │
├────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ Evaluates sales performance of closed deals.       │ Evaluates overall deal creation conversion.       │
│                                                    │                                                   │
│   $$\text{Win Rate} = \frac{C}{C + L} \times 100$$ │   $$\text{Pipeline Rate} = \frac{C}{T} \times 100$$│
│                                                    │                                                   │
│ • Numerator (C): Completed Deals (COMPLETED)       │ • Numerator (C): Completed Deals (COMPLETED)      │
│ • Denominator: COMPLETED + LOST                    │ • Denominator (T): Total Deals in All Stages      │
│ • Eligibility: Terminal / resolved deals only      │ • Eligibility: All registered deals               │
│ • In-flight deals (Inquiry, Offer, etc.) EXCLUDED  │ • Includes active pipeline + terminal deals       │
│ • Denominator = 0 Handling: Returns NULL (N/A)     │ • Denominator = 0 Handling: Returns NULL (N/A)     │
└────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

### 6.2 Detailed Eligibility Rules & Edge Cases
1. **Deal Conversion Win Rate (Terminal Outcome Ratio):**
   - **Numerator ($C$):** Deals with `status = 'COMPLETED'`.
   - **Denominator ($C + L$):** Deals with `status = 'COMPLETED'` plus deals with `status = 'LOST'`.
   - **Exclusions:** Active in-flight pipeline deals (`INQUIRY`, `CONTACTED`, `OFFER_MADE`, `UNDER_CONTRACT`) are excluded because open negotiations are not terminal outcomes.
   - **Zero Denominator:** When $(C + L) = 0$, returns `null` (rendered in UI as `"N/A"` or `"—"` with tooltip `"No resolved deals in period"`).
2. **Pipeline Throughput Rate (Total Pipeline Conversion):**
   - **Numerator ($C$):** Deals with `status = 'COMPLETED'`.
   - **Denominator ($T$):** Total deals across all 6 stages (`COUNT(*)` from `Deal`).
   - **Zero Denominator:** When $T = 0$, returns `null`.

---

## 7. PROJECT LIFECYCLE & WORKFLOW STATE MACHINE

### 7.1 Canonical Non-Destructive State Machine

```
                           ┌───────────────────────────────┐
                           │             DRAFT             │
                           │   isDraft: true               │
                           │   isPublished: false          │
                           │   isPubliclyVisible: false    │
                           │   isArchived: false           │
                           │   (Internal - Admin Only)     │
                           └───────────────┬───────────────┘
                                           │
                                Publish    │    Unpublish
                                           ▼
                           ┌───────────────────────────────┐
                           │           PUBLISHED           │
                           │   isDraft: false              │
                           │   isPublished: true           │
                           │   isPubliclyVisible: true     │
                           │   isArchived: false           │
                           │   (Live on Public Website)    │
                           └───────┬───────────────┬───────┘
                                   │               │
        Admin clicks "Delete"      │               │ Deal Closed (COMPLETED)
     (Non-Destructive Archive)     │               │
                                   ▼               ▼
        ┌──────────────────────────────────┐   ┌───────────────────────────────┐
        │         DELETED PROJECTS         │   │        COMPLETED DEAL         │
        │       (ARCHIVED IN DATABASE)     │   │   hasCompletedDeal: true      │
        │   isArchived: true               │   │                               │
        │   isPublished: false             │   │   [Admin Choice at Close]:    │
        │   isPubliclyVisible: false       │   │   keepPubliclyVisible:        │
        │   - 100% Data & Media Preserved  │   │     true  -> Option A (Public)│
        │   - Hidden from Public Site      │   │     false -> Option B (Hidden)│
        │   - Visible in Admin Archive View│   │   Both increment deal totals  │
        └──────────────────┬───────────────┘   └───────────────────────────────┘
                           │
             Admin clicks  │
           "Restore/Revoke"│
                           ▼
        ┌──────────────────────────────────┐
        │          RESTORED DRAFT          │
        │   isArchived: false              │
        │   isDraft: true                  │
        │   isPublished: false             │
        │   isPubliclyVisible: false       │
        │   (Returned to Admin Active List)│
        └──────────────────────────────────┘
```

### 7.2 Non-Destructive Delete (Archiving) & Restoration
- **Admin clicks "Delete":** Sets `isArchived = true, isPublished = false, isPubliclyVisible = false`. Project moves to the "Deleted Projects" section. **Physical deletion is disabled; media and records are 100% preserved.**
- **Admin clicks "Restore":** Sets `isArchived = false, isDraft = true, isPublished = false, isPubliclyVisible = false`. Returns to the Active Projects list in **DRAFT** state for mandatory review prior to re-publishing.

---

## 8. COMPREHENSIVE API CONTRACT SPECIFICATIONS

### 8.1 Project Creation (`POST /api/admin/projects`)
**Request Body (`CreateProjectSchema`):**
```typescript
{
  name: string // 3..120 characters
  countryId: string // Valid foreign key
  cityName?: string
  tagline?: string
  shortDescription?: string
  description?: string
  type?: string
  
  // Pricing State (One of the 3 valid states)
  isPOA?: boolean // default: false
  askingPriceNumeric?: number | null // strictly positive (> 0); null if isPOA is true or unpriced
  askingCurrency?: SupportedCurrencyCode | null // Valid SupportedCurrency code; null if isPOA is true or unpriced
  
  // Quantitative Specs
  bedroomsCount?: number | null
  bathroomsCount?: number | null
  areaNumeric?: number | null
  areaUnit?: 'sqft' | 'sqm'
  latitude?: number | null // -90..90
  longitude?: number | null // -180..180
  
  // Media & Relations
  mainImage?: string
  mainVideoUrl?: string
  mainVideoThumb?: string
  serviceIds?: string[]
}
```

### 8.2 Project Update Endpoints (Strictly Decoupled)

#### Endpoint A: Descriptive Update (`PATCH /api/admin/projects/[id]`)
- **Allowed:** `name`, `tagline`, `shortDescription`, `description`, `type`, `bedroomsCount`, `bathroomsCount`, `areaNumeric`, `areaUnit`, `cityName`, `locationLine`, `latitude`, `longitude`, `highlights`, `layoutVariant`, `mainImage`, `mainVideoUrl`, `mainVideoThumb`, `spaceRoundImage`, `serviceIds`, `countryId`.
- **Policy:** Any presence of `askingPriceNumeric`, `askingCurrency`, `isPOA`, or `price` returns **HTTP 400 Bad Request (`FORBIDDEN_FINANCIAL_FIELDS`)**. Logs `PROJECT_UPDATED`.

#### Endpoint B: Financial Price Update (`PATCH /api/admin/projects/[id]/price`)
- **Payload:** Validates `UpdateProjectPriceSchema` (Priced, POA, or Unpriced).
- **Policy:** Any descriptive fields return HTTP 400 Bad Request. Acquires row lock, updates property price display, and logs `PROJECT_PRICE_CHANGED` with differential metadata.

### 8.3 Deal Completion (`POST /api/admin/deals/[id]/complete`)
**Request Body (`CompleteDealSchema`):**
```typescript
{
  actualSalePrice: number // Strictly positive (> 0), max 999999999999999.99
  currency: SupportedCurrencyCode // Must match minorUnits precision (e.g. integer for JPY)
  keepPubliclyVisible: boolean // true = Option A, false = Option B
  notes?: string
}
```

### 8.4 Dashboard Financial Analytics (`GET /api/admin/analytics/dashboard`)
**Response Contract (TypeScript):**
```typescript
interface DashboardFinancialAnalyticsResponse {
  // METRIC 1: Total Corporate Portfolio Valuation (All Lifecycle States)
  totalPortfolioValuation: {
    byCurrency: Array<{
      currency: SupportedCurrencyCode
      totalAmount: string // e.g. "450000000.00"
      propertyCount: number
    }>
    scopeDescription: "Includes Published, Draft, Sold, and Recoverably Archived projects"
  }

  // METRIC 2: Active Published Listings Valuation (Live Customer Showcase)
  activePublishedValuation: {
    byCurrency: Array<{
      currency: SupportedCurrencyCode
      totalAmount: string // e.g. "120000000.00"
      activeListingCount: number
    }>
    scopeDescription: "Includes only properties currently live on public website"
  }

  // METRIC 3: Completed Deal Sales Volume (Original & Effective Adjusted)
  completedDealVolume: {
    byCurrency: Array<{
      currency: SupportedCurrencyCode
      originalSalesVolume: string // Closed legal transaction sum
      effectiveSalesVolume: string // Net adjusted sum accounting for authorized adjustments
      closedDealsCount: number
      adjustedDealsCount: number
    }>
  }

  // METRIC 4: Completed Deal Counts, Visibility & Canonical Ratios
  completedDealMetrics: {
    totalCompletedDeals: number
    optionAVisibleCount: number // Retained on public website with "Acquired" badge
    optionBUnlistedCount: number // Unlisted into internal Sold Projects archive
    totalLostDeals: number
    totalActivePipelineDeals: number // INQUIRY, CONTACTED, OFFER_MADE, UNDER_CONTRACT
    totalDealsCount: number // All 6 statuses

    winRate: {
      ratioPercent: number | null // e.g. 75.00 for 75.00%, or null if 0 resolved deals
      numerator: number // totalCompletedDeals
      denominator: number // totalCompletedDeals + totalLostDeals
      formula: "COMPLETED / (COMPLETED + LOST) * 100"
      eligibilityDescription: "Terminal / resolved deals only; excludes in-flight pipeline deals"
    }
    pipelineThroughputRate: {
      ratioPercent: number | null // e.g. 30.00 for 30.00%, or null if 0 total deals
      numerator: number // totalCompletedDeals
      denominator: number // totalDealsCount
      formula: "COMPLETED / TOTAL_DEALS * 100"
      eligibilityDescription: "All deals across all 6 pipeline stages"
    }
  }

  // METRIC 5: Asset Inventory & Pricing Structure Counts
  assetInventoryCounts: {
    totalPropertiesCount: number // All non-permanently-deleted records
    activePublicListingsCount: number // isPublished=true AND isArchived=false AND isPubliclyVisible=true
    totalPublishedCount: number // isPublished=true AND isArchived=false (includes Option A trophy showcase)
    draftCount: number // isDraft=true AND isArchived=false
    archivedCount: number // isArchived=true (in Deleted tab)
    poaCount: number // isPOA=true
    unpricedCount: number // askingPriceNumeric IS NULL AND isPOA=false
  }
}
```

---

## 9. REMAINING DECISIONS BEFORE IMPLEMENTATION

| Operational Item | Status | Resolution |
| :--- | :--- | :--- |
| **Common Master Reporting Currency** | **DEFERRED** | Financial totals are strictly grouped by currency. No single master reporting currency is chosen or enforced. `actualSalePriceBase` remains `NULL`. |
| **Third-Party Live FX Ingestion** | **DEFERRED** | Relies on manual/audit rate snapshots; automated live currency feed scheduled for a future phase. |
| **Permanent Deletion** | **CONFIRMED DISABLED** | Deletion soft-deletes to "Deleted Projects". Physical deletion is disabled. |

---

## STRICT PRE-IMPLEMENTATION COMPLIANCE CONFIRMATION

In strict accordance with directives:
- **Architecture documentation only:** Zero application code written or modified.
- **Zero Prisma schema mutations.**
- **Zero database migrations executed:** Live `apex` database was NOT modified.
- **Zero seeds or backfills executed.**
- **Zero existing project prices or currencies were altered.**
- **Zero frontend changes:** Approved public layout, themes, responsive styles, and animations remain 100% untouched.

**AWAITING EXPLICIT IMPLEMENTATION APPROVAL BEFORE COMMENCING ANY CODE OR DATABASE MODIFICATIONS.**
