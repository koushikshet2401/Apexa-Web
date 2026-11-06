-- ==============================================================================
-- APEX PACIFIC HOLDINGS — PHASE 5 DATABASE MIGRATION
-- Migration: phase5_project_management.sql
-- Implements Phase 5 Project Management, Multi-Currency Parity, and Immutability.
-- ==============================================================================

-- 1. Create SupportedCurrency Table
CREATE TABLE IF NOT EXISTS "SupportedCurrency" (
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "symbol" VARCHAR(8) NOT NULL,
    "minorUnits" INTEGER NOT NULL DEFAULT 2,
    "isOperational" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportedCurrency_pkey" PRIMARY KEY ("code")
);

-- Seed authoritative ISO 4217 currencies supported by Apex Pacific Holdings
INSERT INTO "SupportedCurrency" ("code", "name", "symbol", "minorUnits", "isOperational") VALUES
('AED', 'United Arab Emirates Dirham', 'AED', 2, true),
('USD', 'United States Dollar', '$', 2, true),
('INR', 'Indian Rupee', '₹', 2, true),
('THB', 'Thai Baht', '฿', 2, true),
('MYR', 'Malaysian Ringgit', 'RM', 2, true),
('AUD', 'Australian Dollar', 'A$', 2, true),
('GEL', 'Georgian Lari', '₾', 2, true),
('EUR', 'Euro', '€', 2, true),
('GBP', 'British Pound Sterling', '£', 2, true),
('SGD', 'Singapore Dollar', 'S$', 2, true),
('CHF', 'Swiss Franc', 'CHF', 2, true),
('CAD', 'Canadian Dollar', 'CA$', 2, true),
('JPY', 'Japanese Yen', '¥', 0, true)
ON CONFLICT ("code") DO NOTHING;

-- 2. Create DealFinancialAdjustment Table
CREATE TABLE IF NOT EXISTS "DealFinancialAdjustment" (
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
    CONSTRAINT "fk_adjustment_admin" FOREIGN KEY ("authorizedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "DealFinancialAdjustment_dealId_idx" ON "DealFinancialAdjustment"("dealId", "adjustmentSequence" DESC);

-- 3. Currency Minor-Unit Validation Function
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

    -- JPY (minorUnits = 0): Must not have any decimal component
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

-- 4. Check Constraints on Property
ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "check_property_valid_pricing_states";
ALTER TABLE "Property" ADD CONSTRAINT "check_property_valid_pricing_states"
CHECK (
  ("isPOA" = false AND "askingPriceNumeric" IS NOT NULL AND "askingPriceNumeric" > 0 AND "askingCurrency" IS NOT NULL) OR
  ("isPOA" = true AND "askingPriceNumeric" IS NULL AND "askingCurrency" IS NULL) OR
  ("isPOA" = false AND "askingPriceNumeric" IS NULL AND "askingCurrency" IS NULL)
);

ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "check_property_currency_precision";
ALTER TABLE "Property" ADD CONSTRAINT "check_property_currency_precision"
CHECK (validate_currency_minor_units("askingPriceNumeric", "askingCurrency"));

-- 5. Check Constraints on Deal
ALTER TABLE "Deal" DROP CONSTRAINT IF EXISTS "check_completed_deal_has_financials";
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

ALTER TABLE "Deal" DROP CONSTRAINT IF EXISTS "check_deal_currency_precision";
ALTER TABLE "Deal" ADD CONSTRAINT "check_deal_currency_precision"
CHECK (validate_currency_minor_units("actualSalePrice", "saleCurrency"));

-- 6. Trigger: Completed Deal Immutability
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

DROP TRIGGER IF EXISTS trigger_deal_completed_immutability ON "Deal";
CREATE TRIGGER trigger_deal_completed_immutability
BEFORE UPDATE ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION enforce_completed_deal_immutability();

-- 7. Trigger: Prevent Deletion of Completed Deals
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

DROP TRIGGER IF EXISTS trigger_deal_completed_prevent_delete ON "Deal";
CREATE TRIGGER trigger_deal_completed_prevent_delete
BEFORE DELETE ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION prevent_completed_deal_deletion();

-- 8. Trigger: Prevent TRUNCATE on Financial Tables
CREATE OR REPLACE FUNCTION prevent_truncate_immutable_tables()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security violation: Table % is protected. TRUNCATE is strictly prohibited on financial audit tables.', TG_TABLE_NAME
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deal_prevent_truncate ON "Deal";
CREATE TRIGGER trigger_deal_prevent_truncate
BEFORE TRUNCATE ON "Deal"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_truncate_immutable_tables();

DROP TRIGGER IF EXISTS trigger_snapshot_prevent_truncate ON "PropertyValuationSnapshot";
CREATE TRIGGER trigger_snapshot_prevent_truncate
BEFORE TRUNCATE ON "PropertyValuationSnapshot"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_truncate_immutable_tables();

DROP TRIGGER IF EXISTS trigger_activity_log_prevent_truncate ON "AdminActivityLog";
CREATE TRIGGER trigger_activity_log_prevent_truncate
BEFORE TRUNCATE ON "AdminActivityLog"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_truncate_immutable_tables();

DROP TRIGGER IF EXISTS trigger_adjustment_prevent_truncate ON "DealFinancialAdjustment";
CREATE TRIGGER trigger_adjustment_prevent_truncate
BEFORE TRUNCATE ON "DealFinancialAdjustment"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_truncate_immutable_tables();

-- 9. Trigger: Append-Only Protection on PropertyValuationSnapshot
CREATE OR REPLACE FUNCTION enforce_append_only_valuation_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security violation: PropertyValuationSnapshot is append-only. Mutation and deletion are strictly forbidden.'
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_snapshot_prevent_update ON "PropertyValuationSnapshot";
CREATE TRIGGER trigger_snapshot_prevent_update
BEFORE UPDATE ON "PropertyValuationSnapshot"
FOR EACH ROW
EXECUTE FUNCTION enforce_append_only_valuation_snapshot();

DROP TRIGGER IF EXISTS trigger_snapshot_prevent_delete ON "PropertyValuationSnapshot";
CREATE TRIGGER trigger_snapshot_prevent_delete
BEFORE DELETE ON "PropertyValuationSnapshot"
FOR EACH ROW
EXECUTE FUNCTION enforce_append_only_valuation_snapshot();

-- 10. Trigger: Append-Only Protection on AdminActivityLog
CREATE OR REPLACE FUNCTION enforce_append_only_activity_log()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security violation: AdminActivityLog is append-only. Audit logs cannot be altered or deleted.'
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activity_log_prevent_update ON "AdminActivityLog";
CREATE TRIGGER trigger_activity_log_prevent_update
BEFORE UPDATE ON "AdminActivityLog"
FOR EACH ROW
EXECUTE FUNCTION enforce_append_only_activity_log();

DROP TRIGGER IF EXISTS trigger_activity_log_prevent_delete ON "AdminActivityLog";
CREATE TRIGGER trigger_activity_log_prevent_delete
BEFORE DELETE ON "AdminActivityLog"
FOR EACH ROW
EXECUTE FUNCTION enforce_append_only_activity_log();

-- 11. Trigger: Append-Only Protection on DealFinancialAdjustment
CREATE OR REPLACE FUNCTION enforce_append_only_deal_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security violation: DealFinancialAdjustment is append-only. Corrections cannot be altered or deleted.'
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_adjustment_prevent_update ON "DealFinancialAdjustment";
CREATE TRIGGER trigger_adjustment_prevent_update
BEFORE UPDATE ON "DealFinancialAdjustment"
FOR EACH ROW
EXECUTE FUNCTION enforce_append_only_deal_adjustment();

DROP TRIGGER IF EXISTS trigger_adjustment_prevent_delete ON "DealFinancialAdjustment";
CREATE TRIGGER trigger_adjustment_prevent_delete
BEFORE DELETE ON "DealFinancialAdjustment"
FOR EACH ROW
EXECUTE FUNCTION enforce_append_only_deal_adjustment();
