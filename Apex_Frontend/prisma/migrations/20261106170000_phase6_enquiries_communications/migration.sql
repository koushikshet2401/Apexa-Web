-- ==============================================================================
-- APEX PACIFIC HOLDINGS — PHASE 6 DATABASE MIGRATION
-- Migration: 20261106170000_phase6_enquiries_communications
-- Non-destructive, backward-compatible DDL script for Enquiries & Communications.
-- ==============================================================================

-- 1. Alter Enquiry table (additive columns)
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'WEBSITE_CONTACT';
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "assignedAdminId" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Normalize existing status values if any (e.g. 'new' -> 'NEW', 'read' -> 'READ', 'closed' -> 'CLOSED')
UPDATE "Enquiry" SET "status" = UPPER("status") WHERE "status" IS NOT NULL AND "status" != UPPER("status");
-- Ensure isRead matches read/in_progress/closed
UPDATE "Enquiry" SET "isRead" = true WHERE "status" IN ('READ', 'IN_PROGRESS', 'CLOSED', 'REPLIED') AND "isRead" = false;

-- Foreign key constraints for Enquiry
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Enquiry_assignedAdminId_fkey'
    ) THEN
        ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_assignedAdminId_fkey" 
        FOREIGN KEY ("assignedAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Enquiry_closedById_fkey'
    ) THEN
        ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_closedById_fkey" 
        FOREIGN KEY ("closedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Indexes for Enquiry
CREATE INDEX IF NOT EXISTS "Enquiry_assignedAdminId_idx" ON "Enquiry"("assignedAdminId");
CREATE INDEX IF NOT EXISTS "Enquiry_country_idx" ON "Enquiry"("country");
CREATE INDEX IF NOT EXISTS "Enquiry_submittedAt_desc_idx" ON "Enquiry"("submittedAt" DESC);

-- 2. Alter EnquiryReply table (additive columns & indexes)
ALTER TABLE "EnquiryReply" ADD COLUMN IF NOT EXISTS "senderEmail" TEXT;
ALTER TABLE "EnquiryReply" ADD COLUMN IF NOT EXISTS "recipient" TEXT;
ALTER TABLE "EnquiryReply" ADD COLUMN IF NOT EXISTS "direction" TEXT NOT NULL DEFAULT 'OUTBOUND';
ALTER TABLE "EnquiryReply" ADD COLUMN IF NOT EXISTS "deliveryStatus" TEXT NOT NULL DEFAULT 'SENT';
ALTER TABLE "EnquiryReply" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "EnquiryReply" ADD COLUMN IF NOT EXISTS "externalMessageId" TEXT;
ALTER TABLE "EnquiryReply" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "EnquiryReply" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Unique and standard indexes for EnquiryReply
CREATE UNIQUE INDEX IF NOT EXISTS "EnquiryReply_idempotencyKey_key" ON "EnquiryReply"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "EnquiryReply_deliveryStatus_idx" ON "EnquiryReply"("deliveryStatus");
CREATE INDEX IF NOT EXISTS "EnquiryReply_externalMessageId_idx" ON "EnquiryReply"("externalMessageId");

-- 3. CHECK Constraint for Enquiry status validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_enquiry_valid_status'
    ) THEN
        ALTER TABLE "Enquiry" ADD CONSTRAINT "check_enquiry_valid_status" 
        CHECK ("status" IN ('NEW', 'READ', 'IN_PROGRESS', 'CLOSED', 'new', 'read', 'in_progress', 'closed', 'replied'));
    END IF;
END $$;
