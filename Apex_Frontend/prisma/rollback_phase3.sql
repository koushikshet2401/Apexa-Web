-- ==============================================================================
-- APEX PACIFIC HOLDINGS — PHASE 3 DOWN-MIGRATION & SAFETY AUDIT SCRIPT
-- File: prisma/rollback_phase3.sql
--
-- CRITICAL ARCHITECTURAL WARNING:
-- A SCHEMA ROLLBACK IS NOT A DATA RECOVERY MECHANISM.
-- Executing this script drops schema objects. Any data created in dropped
-- tables or columns will be PERMANENTLY DESTROYED.
--
-- BEFORE RUNNING ON ANY SYSTEM CONTAINING BUSINESS DATA:
-- A complete physical or logical PostgreSQL backup MUST be performed and verified:
--   pg_dump -Fc -v -f apex_pre_rollback_$(date +%Y%m%d_%H%M%S).dump apex
--
-- TABLE COPY LIMITATION:
-- The pre-rollback copy procedure below is a temporary staging safeguard only.
-- It does NOT preserve primary keys, foreign keys, default expressions, check
-- constraints, sequences, or index performance structures.
--
-- WHEN ROLLBACK IS PERMISSIBLE:
-- 1. Immediately following an uncommitted or failed migration deployment where
--    no application writes or admin transactions have occurred.
-- 2. In ephemeral test/sandbox environments.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PRE-ROLLBACK DATA EXPORT PROCEDURE (RUN FIRST IF BUSINESS DATA EXISTS)
-- ------------------------------------------------------------------------------
-- DO $$
-- BEGIN
--     -- Safeguard against overwriting an existing backup schema
--     IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'apex_rollback_backup') THEN
--         RAISE EXCEPTION 'BACKUP ABORTED: Schema "apex_rollback_backup" already exists. Archive or rename existing backup before creating a new one to prevent data overwrite.';
--     END IF;
-- END $$;
--
-- CREATE SCHEMA apex_rollback_backup;
--
-- -- Complete backup of all 10 Phase 3 tables
-- CREATE TABLE apex_rollback_backup."Deal_backup" AS SELECT * FROM "Deal";
-- CREATE TABLE apex_rollback_backup."EnquiryNote_backup" AS SELECT * FROM "EnquiryNote";
-- CREATE TABLE apex_rollback_backup."EnquiryReply_backup" AS SELECT * FROM "EnquiryReply";
-- CREATE TABLE apex_rollback_backup."AdminActivityLog_backup" AS SELECT * FROM "AdminActivityLog";
-- CREATE TABLE apex_rollback_backup."PropertyValuationSnapshot_backup" AS SELECT * FROM "PropertyValuationSnapshot";
-- CREATE TABLE apex_rollback_backup."ExchangeRate_backup" AS SELECT * FROM "ExchangeRate";
-- CREATE TABLE apex_rollback_backup."DailyAnalytics_backup" AS SELECT * FROM "DailyAnalytics";
-- CREATE TABLE apex_rollback_backup."AdminRole_backup" AS SELECT * FROM "AdminRole";
-- CREATE TABLE apex_rollback_backup."AdminPermission_backup" AS SELECT * FROM "AdminPermission";
-- CREATE TABLE apex_rollback_backup."RolePermission_backup" AS SELECT * FROM "RolePermission";
--
-- -- Complete backup of all affected extended columns from existing tables
-- CREATE TABLE apex_rollback_backup."Property_extended_columns_backup" AS 
--   SELECT id, "askingPriceNumeric", "askingCurrency", "isPOA", "bedroomsCount", "bathroomsCount",
--          "areaNumeric", "areaUnit", "latitude", "longitude", "spaceRoundImage", "isPubliclyVisible",
--          "hasCompletedDeal", "isArchived", "archivedAt", "archivedReason", "archivedById",
--          "restoredAt", "restoredById"
--   FROM "Property";
--
-- CREATE TABLE apex_rollback_backup."Enquiry_extended_columns_backup" AS 
--   SELECT id, "isClosed", "closedAt", "closedById"
--   FROM "Enquiry";
--
-- CREATE TABLE apex_rollback_backup."AdminUser_extended_columns_backup" AS 
--   SELECT id, "isActive", "lastLoginAt", "roleId"
--   FROM "AdminUser";
--
-- CREATE TABLE apex_rollback_backup."PropertyImage_extended_columns_backup" AS 
--   SELECT id, "description", "isCover"
--   FROM "PropertyImage";
--
-- COMMENT ON SCHEMA apex_rollback_backup IS 'Pre-rollback safety export schema created for Phase 3 down-migration';
-- ------------------------------------------------------------------------------

BEGIN;

-- ==============================================================================
-- COMPREHENSIVE ROLLBACK GUARDS
-- Aborts rollback if ANY table or extended column contains live business records.
-- ==============================================================================
DO $$
DECLARE
    v_count integer := 0;
BEGIN
    -- 1. Check Module E: Deal records
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Deal') THEN
        SELECT COUNT(*) INTO v_count FROM "Deal";
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "Deal" contains % records. Dropping will destroy sales transaction history.', v_count;
        END IF;
    END IF;

    -- 2. Check Module J: Enquiry Notes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EnquiryNote') THEN
        SELECT COUNT(*) INTO v_count FROM "EnquiryNote";
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "EnquiryNote" contains % records. Dropping will destroy internal customer communication notes.', v_count;
        END IF;
    END IF;

    -- 3. Check Module J: Enquiry Replies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EnquiryReply') THEN
        SELECT COUNT(*) INTO v_count FROM "EnquiryReply";
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "EnquiryReply" contains % records. Dropping will destroy outbound communication logs.', v_count;
        END IF;
    END IF;

    -- 4. Check Module C: Admin Activity Logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminActivityLog') THEN
        SELECT COUNT(*) INTO v_count FROM "AdminActivityLog";
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "AdminActivityLog" contains % audit records. Dropping will violate regulatory compliance.', v_count;
        END IF;
    END IF;

    -- 5. Check Module H: Valuation Snapshots
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PropertyValuationSnapshot') THEN
        SELECT COUNT(*) INTO v_count FROM "PropertyValuationSnapshot";
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "PropertyValuationSnapshot" contains % snapshots. Dropping will destroy valuation history.', v_count;
        END IF;
    END IF;

    -- 6. Check Module H: Exchange Rates
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ExchangeRate') THEN
        SELECT COUNT(*) INTO v_count FROM "ExchangeRate";
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "ExchangeRate" contains % currency records.', v_count;
        END IF;
    END IF;

    -- 7. Check Module I: Daily Analytics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'DailyAnalytics') THEN
        SELECT COUNT(*) INTO v_count FROM "DailyAnalytics";
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "DailyAnalytics" contains % analytics records.', v_count;
        END IF;
    END IF;

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

    -- 9. Check extended columns on Property
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Property' AND column_name = 'askingPriceNumeric'
    ) THEN
        SELECT COUNT(*) INTO v_count FROM "Property" 
        WHERE "askingPriceNumeric" IS NOT NULL 
           OR "isPOA" = true 
           OR "hasCompletedDeal" = true 
           OR "isArchived" = true;
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "Property" contains % properties with structured pricing, deal status, or archived history in newly added columns.', v_count;
        END IF;
    END IF;

    -- 10. Check extended columns on Enquiry
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Enquiry' AND column_name = 'isClosed'
    ) THEN
        SELECT COUNT(*) INTO v_count FROM "Enquiry" WHERE "isClosed" = true;
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "Enquiry" contains % closed enquiry records.', v_count;
        END IF;
    END IF;

    -- 11. Check extended columns on AdminUser
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AdminUser' AND column_name = 'roleId'
    ) THEN
        SELECT COUNT(*) INTO v_count FROM "AdminUser" WHERE "roleId" IS NOT NULL OR "isActive" = false;
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "AdminUser" contains % users with assigned roles or deactivated status.', v_count;
        END IF;
    END IF;

    -- 12. Check extended columns on PropertyImage
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PropertyImage' AND column_name = 'description'
    ) THEN
        SELECT COUNT(*) INTO v_count FROM "PropertyImage" WHERE "description" IS NOT NULL OR "isCover" = true;
        IF v_count > 0 THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Table "PropertyImage" contains % images with custom descriptions or cover status.', v_count;
        END IF;
    END IF;
END $$;

-- ==============================================================================
-- 1. DROP CHILD TABLES & CONSTRAINTS
-- ==============================================================================
DROP TABLE IF EXISTS "EnquiryReply" CASCADE;
DROP TABLE IF EXISTS "EnquiryNote" CASCADE;
DROP TABLE IF EXISTS "PropertyValuationSnapshot" CASCADE;
DROP TABLE IF EXISTS "ExchangeRate" CASCADE;
DROP TABLE IF EXISTS "DailyAnalytics" CASCADE;
DROP TABLE IF EXISTS "Deal" CASCADE;
DROP TABLE IF EXISTS "RolePermission" CASCADE;
DROP TABLE IF EXISTS "AdminPermission" CASCADE;
DROP TABLE IF EXISTS "AdminActivityLog" CASCADE;

-- ==============================================================================
-- 2. REMOVE RBAC FOREIGN KEYS & DROP ADMINROLE
-- ==============================================================================
ALTER TABLE IF EXISTS "AdminUser" DROP CONSTRAINT IF EXISTS "AdminUser_roleId_fkey";
DROP TABLE IF EXISTS "AdminRole" CASCADE;

-- ==============================================================================
-- 3. DROP ENUM TYPES
-- ==============================================================================
DROP TYPE IF EXISTS "DealStatus";

-- ==============================================================================
-- 4. REMOVE EXTENDED COLUMNS FROM BASE TABLES
-- ==============================================================================
ALTER TABLE IF EXISTS "AdminUser"
  DROP COLUMN IF EXISTS "isActive",
  DROP COLUMN IF EXISTS "lastLoginAt",
  DROP COLUMN IF EXISTS "roleId";

ALTER TABLE IF EXISTS "Property"
  DROP CONSTRAINT IF EXISTS "Property_archivedById_fkey",
  DROP CONSTRAINT IF EXISTS "Property_restoredById_fkey",
  DROP COLUMN IF EXISTS "askingPriceNumeric",
  DROP COLUMN IF EXISTS "askingCurrency",
  DROP COLUMN IF EXISTS "isPOA",
  DROP COLUMN IF EXISTS "bedroomsCount",
  DROP COLUMN IF EXISTS "bathroomsCount",
  DROP COLUMN IF EXISTS "areaNumeric",
  DROP COLUMN IF EXISTS "areaUnit",
  DROP COLUMN IF EXISTS "latitude",
  DROP COLUMN IF EXISTS "longitude",
  DROP COLUMN IF EXISTS "spaceRoundImage",
  DROP COLUMN IF EXISTS "isPubliclyVisible",
  DROP COLUMN IF EXISTS "hasCompletedDeal",
  DROP COLUMN IF EXISTS "isArchived",
  DROP COLUMN IF EXISTS "archivedAt",
  DROP COLUMN IF EXISTS "archivedReason",
  DROP COLUMN IF EXISTS "archivedById",
  DROP COLUMN IF EXISTS "restoredAt",
  DROP COLUMN IF EXISTS "restoredById";

ALTER TABLE IF EXISTS "PropertyImage"
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "isCover";

ALTER TABLE IF EXISTS "Enquiry"
  DROP COLUMN IF EXISTS "isClosed",
  DROP COLUMN IF EXISTS "closedAt",
  DROP COLUMN IF EXISTS "closedById";

-- ==============================================================================
-- 5. DROP DRIFT INDEXES (RESTORING PRE-MIGRATION BASELINE)
-- ==============================================================================
DROP INDEX IF EXISTS "Country_isPublished_displayOrder_idx";
DROP INDEX IF EXISTS "ServiceCategory_isPublished_displayOrder_idx";
DROP INDEX IF EXISTS "Property_isArchived_isPublished_idx";
DROP INDEX IF EXISTS "Property_countryId_isPublished_createdAt_idx";
DROP INDEX IF EXISTS "Property_isPublished_isFeaturedLaunch_launchOrder_launchDate_createdAt_idx";
DROP INDEX IF EXISTS "Property_isPublished_isSpaceInRound_spaceOrder_idx";
DROP INDEX IF EXISTS "Property_createdAt_idx";
DROP INDEX IF EXISTS "PropertyImage_propertyId_order_idx";
DROP INDEX IF EXISTS "PropertyService_serviceId_idx";
DROP INDEX IF EXISTS "Enquiry_status_submittedAt_idx";
DROP INDEX IF EXISTS "Enquiry_propertyId_idx";

COMMIT;
