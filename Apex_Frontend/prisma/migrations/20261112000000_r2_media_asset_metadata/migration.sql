-- CreateEnum
CREATE TYPE "MediaRole" AS ENUM ('THUMBNAIL', 'HERO_VIDEO', 'VIDEO_THUMB', 'GALLERY_IMAGE', 'SPACE_IN_ROUND', 'HOMEPAGE_VIDEO', 'HOMEPAGE_THUMB', 'COUNTRY_MEDIA', 'SERVICE_MEDIA', 'GENERAL');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "mediaType" TEXT NOT NULL,
    "mediaRole" "MediaRole" NOT NULL DEFAULT 'GENERAL',
    "originalFilename" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_r2Key_key" ON "MediaAsset"("r2Key");

-- CreateIndex
CREATE INDEX "MediaAsset_propertyId_mediaRole_idx" ON "MediaAsset"("propertyId", "mediaRole");

-- CreateIndex
CREATE INDEX "MediaAsset_r2Key_idx" ON "MediaAsset"("r2Key");

-- CreateIndex
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
