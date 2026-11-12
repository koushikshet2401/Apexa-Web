-- AlterEnum
ALTER TYPE "MediaRole" ADD VALUE IF NOT EXISTS 'ONE_TEAM_VILLA';
ALTER TYPE "MediaRole" ADD VALUE IF NOT EXISTS 'ONE_TEAM_COMMERCIAL';
ALTER TYPE "MediaRole" ADD VALUE IF NOT EXISTS 'ONE_TEAM_VIDEO';
ALTER TYPE "MediaRole" ADD VALUE IF NOT EXISTS 'COLLECTION_COVER';
ALTER TYPE "MediaRole" ADD VALUE IF NOT EXISTS 'COLLECTION_HERO_VIDEO';

-- AlterTable
ALTER TABLE "ServiceCategory" ADD COLUMN IF NOT EXISTS "architecturalFocus" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ServiceCategory" ADD COLUMN IF NOT EXISTS "deliverables" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "OneTeamContent" (
    "id" TEXT NOT NULL,
    "luxuryVillasImageUrl" TEXT,
    "luxuryVillasMediaAssetId" TEXT,
    "commercialImageUrl" TEXT,
    "commercialMediaAssetId" TEXT,
    "centerVideoUrl" TEXT,
    "centerVideoMediaAssetId" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneTeamContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CollectionMedia" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "coverImageMediaAssetId" TEXT,
    "heroVideoUrl" TEXT,
    "heroVideoMediaAssetId" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CollectionMedia_countryId_key" ON "CollectionMedia"("countryId");

-- AddForeignKey
ALTER TABLE "OneTeamContent" ADD CONSTRAINT "OneTeamContent_luxuryVillasMediaAssetId_fkey" FOREIGN KEY ("luxuryVillasMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneTeamContent" ADD CONSTRAINT "OneTeamContent_commercialMediaAssetId_fkey" FOREIGN KEY ("commercialMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneTeamContent" ADD CONSTRAINT "OneTeamContent_centerVideoMediaAssetId_fkey" FOREIGN KEY ("centerVideoMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMedia" ADD CONSTRAINT "CollectionMedia_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMedia" ADD CONSTRAINT "CollectionMedia_coverImageMediaAssetId_fkey" FOREIGN KEY ("coverImageMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMedia" ADD CONSTRAINT "CollectionMedia_heroVideoMediaAssetId_fkey" FOREIGN KEY ("heroVideoMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
