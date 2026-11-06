-- ==============================================================================
-- APEX PACIFIC HOLDINGS — PHASE 3 DATABASE MIGRATION
-- Migration: 20261105170000_phase3_approved_architecture
-- Non-destructive, backward-compatible DDL script.
-- ==============================================================================

-- 1. Create Enum Types
CREATE TYPE "DealStatus" AS ENUM ('INQUIRY', 'CONTACTED', 'OFFER_MADE', 'UNDER_CONTRACT', 'COMPLETED', 'LOST');

-- 2. Create Module A Tables (RBAC & Activity Logs)
CREATE TABLE "AdminRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminRole_name_key" ON "AdminRole"("name");

CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminPermission_module_action_key" ON "AdminPermission"("module", "action");
CREATE INDEX "AdminPermission_module_idx" ON "AdminPermission"("module");

CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

CREATE TABLE "AdminActivityLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminActivityLog_entityType_entityId_idx" ON "AdminActivityLog"("entityType", "entityId");
CREATE INDEX "AdminActivityLog_adminId_createdAt_idx" ON "AdminActivityLog"("adminId", "createdAt");
CREATE INDEX "AdminActivityLog_createdAt_idx" ON "AdminActivityLog"("createdAt");

-- 3. Create Module E & F Tables (Deals & Sold Projects)
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "dealRef" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "buyerName" TEXT,
    "buyerContact" TEXT,
    "actualSalePrice" DECIMAL(18, 2),
    "saleCurrency" TEXT,
    "actualSalePriceBase" DECIMAL(18, 2),
    "status" "DealStatus" NOT NULL DEFAULT 'INQUIRY',
    "keepPubliclyVisible" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Deal_dealRef_key" ON "Deal"("dealRef");
CREATE INDEX "Deal_status_closedAt_idx" ON "Deal"("status", "closedAt");
CREATE INDEX "Deal_propertyId_idx" ON "Deal"("propertyId");
CREATE INDEX "Deal_closedAt_idx" ON "Deal"("closedAt");
-- Database-level enforcement of the one-completed-deal-per-property business rule
CREATE UNIQUE INDEX "unique_completed_deal_per_property" ON "Deal"("propertyId") WHERE "status" = 'COMPLETED';

-- 4. Create Module H Tables (Multi-Currency & Valuation Snapshots)
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toBaseCurrency" TEXT NOT NULL,
    "rateToBase" DECIMAL(18, 8) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExchangeRate_fromCurrency_toBaseCurrency_effectiveDate_key" ON "ExchangeRate"("fromCurrency", "toBaseCurrency", "effectiveDate");
CREATE INDEX "ExchangeRate_fromCurrency_effectiveDate_idx" ON "ExchangeRate"("fromCurrency", "effectiveDate");

CREATE TABLE "PropertyValuationSnapshot" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "askingPriceNumeric" DECIMAL(18, 2) NOT NULL,
    "askingCurrency" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "exchangeRate" DECIMAL(18, 8) NOT NULL,
    "rateEffectiveDate" DATE NOT NULL,
    "rateSource" TEXT NOT NULL,
    "convertedValuation" DECIMAL(18, 2) NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "PropertyValuationSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PropertyValuationSnapshot_propertyId_snapshotDate_idx" ON "PropertyValuationSnapshot"("propertyId", "snapshotDate" DESC);
CREATE INDEX "PropertyValuationSnapshot_snapshotDate_idx" ON "PropertyValuationSnapshot"("snapshotDate" DESC);

-- 5. Create Module I Table (Website Traffic Analytics)
CREATE TABLE "DailyAnalytics" (
    "date" DATE NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyAnalytics_pkey" PRIMARY KEY ("date")
);

-- 6. Create Module J Child Tables (Enquiry Collaboration)
CREATE TABLE "EnquiryNote" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "authorId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EnquiryNote_enquiryId_createdAt_idx" ON "EnquiryNote"("enquiryId", "createdAt");

CREATE TABLE "EnquiryReply" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "senderId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EnquiryReply_enquiryId_sentAt_idx" ON "EnquiryReply"("enquiryId", "sentAt");

-- 7. Add Columns to Existing Table: AdminUser
ALTER TABLE "AdminUser" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdminUser" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN "roleId" TEXT;
CREATE INDEX "AdminUser_roleId_idx" ON "AdminUser"("roleId");

-- 8. Add Columns to Existing Table: Property (Additive only, preserving price String)
ALTER TABLE "Property" ADD COLUMN "askingPriceNumeric" DECIMAL(18, 2);
ALTER TABLE "Property" ADD COLUMN "askingCurrency" TEXT;
ALTER TABLE "Property" ADD COLUMN "isPOA" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "bedroomsCount" INTEGER;
ALTER TABLE "Property" ADD COLUMN "bathroomsCount" DECIMAL(3, 1);
ALTER TABLE "Property" ADD COLUMN "areaNumeric" DECIMAL(10, 2);
ALTER TABLE "Property" ADD COLUMN "areaUnit" TEXT DEFAULT 'sqft';
ALTER TABLE "Property" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "spaceRoundImage" TEXT;
ALTER TABLE "Property" ADD COLUMN "isPubliclyVisible" BOOLEAN;
ALTER TABLE "Property" ADD COLUMN "hasCompletedDeal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- Safe one-time initialization of public visibility:
-- Published, unarchived, non-dealt properties are preserved as visible (true).
-- Existing draft (unpublished) and archived properties are initialized to private (false).
UPDATE "Property"
SET "isPubliclyVisible" = (
    CASE 
        WHEN "isPublished" = true AND ("isArchived" IS NULL OR "isArchived" = false) THEN true
        ELSE false
    END
);

-- Enforce NOT NULL and DEFAULT false for all future created properties
ALTER TABLE "Property" ALTER COLUMN "isPubliclyVisible" SET DEFAULT false;
ALTER TABLE "Property" ALTER COLUMN "isPubliclyVisible" SET NOT NULL;
ALTER TABLE "Property" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN "archivedReason" TEXT;
ALTER TABLE "Property" ADD COLUMN "archivedById" TEXT;
ALTER TABLE "Property" ADD COLUMN "restoredAt" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN "restoredById" TEXT;

-- 9. Add Columns to Existing Table: PropertyImage
ALTER TABLE "PropertyImage" ADD COLUMN "description" TEXT;
ALTER TABLE "PropertyImage" ADD COLUMN "isCover" BOOLEAN NOT NULL DEFAULT false;

-- 10. Add Columns to Existing Table: Enquiry
ALTER TABLE "Enquiry" ADD COLUMN "isClosed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Enquiry" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN "closedById" TEXT;

-- 11. Add Foreign Key Constraints
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "AdminPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminActivityLog" ADD CONSTRAINT "AdminActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Property" ADD CONSTRAINT "Property_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Deal" ADD CONSTRAINT "Deal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertyValuationSnapshot" ADD CONSTRAINT "PropertyValuationSnapshot_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EnquiryNote" ADD CONSTRAINT "EnquiryNote_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnquiryNote" ADD CONSTRAINT "EnquiryNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EnquiryReply" ADD CONSTRAINT "EnquiryReply_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnquiryReply" ADD CONSTRAINT "EnquiryReply_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 12. Create Indexes (Deploying 13 Missing Migration Drift Indexes + Audited Phase 2 Indexes)
CREATE INDEX "Country_isPublished_displayOrder_idx" ON "Country"("isPublished", "displayOrder");
CREATE INDEX "ServiceCategory_isPublished_displayOrder_idx" ON "ServiceCategory"("isPublished", "displayOrder");

CREATE INDEX "Property_isArchived_isPublished_idx" ON "Property"("isArchived", "isPublished");
CREATE INDEX "Property_countryId_isPublished_createdAt_idx" ON "Property"("countryId", "isPublished", "createdAt");
CREATE INDEX "Property_isPublished_isFeaturedLaunch_launchOrder_launchDate_createdAt_idx" ON "Property"("isPublished", "isFeaturedLaunch", "launchOrder", "launchDate", "createdAt");
CREATE INDEX "Property_isPublished_isSpaceInRound_spaceOrder_idx" ON "Property"("isPublished", "isSpaceInRound", "spaceOrder");
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

CREATE INDEX "PropertyImage_propertyId_order_idx" ON "PropertyImage"("propertyId", "order");
CREATE INDEX "PropertyService_serviceId_idx" ON "PropertyService"("serviceId");

CREATE INDEX "Enquiry_status_submittedAt_idx" ON "Enquiry"("status", "submittedAt");
CREATE INDEX "Enquiry_propertyId_idx" ON "Enquiry"("propertyId");
