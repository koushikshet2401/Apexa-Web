-- AlterEnum
ALTER TYPE "MediaRole" ADD VALUE IF NOT EXISTS 'ONE_TEAM_SKY';
ALTER TYPE "MediaRole" ADD VALUE IF NOT EXISTS 'ONE_TEAM_WATERFRONT';

-- AlterTable
ALTER TABLE "OneTeamContent"
  ADD COLUMN IF NOT EXISTS "skyResidencesImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "skyResidencesMediaAssetId" TEXT,
  ADD COLUMN IF NOT EXISTS "waterfrontImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "waterfrontMediaAssetId" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OneTeamContent_skyResidencesMediaAssetId_fkey'
  ) THEN
    ALTER TABLE "OneTeamContent"
      ADD CONSTRAINT "OneTeamContent_skyResidencesMediaAssetId_fkey"
      FOREIGN KEY ("skyResidencesMediaAssetId") REFERENCES "MediaAsset"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OneTeamContent_waterfrontMediaAssetId_fkey'
  ) THEN
    ALTER TABLE "OneTeamContent"
      ADD CONSTRAINT "OneTeamContent_waterfrontMediaAssetId_fkey"
      FOREIGN KEY ("waterfrontMediaAssetId") REFERENCES "MediaAsset"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
