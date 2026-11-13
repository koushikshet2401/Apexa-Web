-- Additive Stage 1 P2 CMS copy and contact fields on existing HomepageContent & OneTeamContent models.
-- Reuses existing models cleanly without creating duplicate tables or dropping any columns/indexes.

ALTER TABLE "HomepageContent"
  ADD COLUMN IF NOT EXISTS "unveilLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "collectionEyebrow" TEXT,
  ADD COLUMN IF NOT EXISTS "collectionHeading" TEXT,
  ADD COLUMN IF NOT EXISTS "collectionDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "spacesHeading" TEXT,
  ADD COLUMN IF NOT EXISTS "spacesDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "advisoryEyebrow" TEXT,
  ADD COLUMN IF NOT EXISTS "advisoryHeading" TEXT,
  ADD COLUMN IF NOT EXISTS "advisoryDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "advisoryFooterNote" TEXT,
  ADD COLUMN IF NOT EXISTS "contactEyebrow" TEXT,
  ADD COLUMN IF NOT EXISTS "contactHeading" TEXT,
  ADD COLUMN IF NOT EXISTS "contactDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "contactPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "contactOfficeAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "contactWhatsappNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "contactFormHeading" TEXT,
  ADD COLUMN IF NOT EXISTS "contactFormSubtext" TEXT,
  ADD COLUMN IF NOT EXISTS "contactSuccessHeading" TEXT,
  ADD COLUMN IF NOT EXISTS "contactSuccessSubtext" TEXT;

ALTER TABLE "OneTeamContent"
  ADD COLUMN IF NOT EXISTS "sectionEyebrow" TEXT,
  ADD COLUMN IF NOT EXISTS "sectionHeading" TEXT,
  ADD COLUMN IF NOT EXISTS "sectionDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "bannerLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "bannerHeading" TEXT;
