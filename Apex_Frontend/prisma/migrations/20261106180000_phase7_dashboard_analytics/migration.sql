-- ==============================================================================
-- APEX PACIFIC HOLDINGS — PHASE 7 DATABASE MIGRATION
-- Migration: 20261106180000_phase7_dashboard_analytics
-- Non-destructive, backward-compatible DDL script for Dashboard & Analytics.
-- ==============================================================================

-- 1. Alter DailyAnalytics table (additive columns)
ALTER TABLE "DailyAnalytics" ADD COLUMN IF NOT EXISTS "projectViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DailyAnalytics" ADD COLUMN IF NOT EXISTS "countryViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DailyAnalytics" ADD COLUMN IF NOT EXISTS "enquiriesCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DailyAnalytics" ADD COLUMN IF NOT EXISTS "qualifyingVisits" INTEGER NOT NULL DEFAULT 0;

-- 2. Create AnalyticsEvent table (if not exists)
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "path" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "country" TEXT,
    "visitorHash" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- Unique and standard indexes for AnalyticsEvent
CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsEvent_idempotencyKey_key" ON "AnalyticsEvent"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_entityType_entityId_idx" ON "AnalyticsEvent"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_visitorHash_idx" ON "AnalyticsEvent"("visitorHash");
