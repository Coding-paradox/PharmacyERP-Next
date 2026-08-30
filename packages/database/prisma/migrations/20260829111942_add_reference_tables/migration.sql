/*
  Warnings:

  - You are about to drop the column `dosage` on the `medicines` table. All the data in the column will be lost.
  - You are about to drop the column `dosageForm` on the `medicines` table. All the data in the column will be lost.
  - You are about to drop the column `genericName` on the `medicines` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "medicines" DROP COLUMN "dosage",
DROP COLUMN "dosageForm",
DROP COLUMN "genericName",
ADD COLUMN     "dosageFormId" TEXT,
ADD COLUMN     "dosageId" TEXT,
ADD COLUMN     "genericNameId" TEXT;

-- CreateTable
CREATE TABLE "generic_names" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pharmacyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generic_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pharmacyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dosages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosage_forms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pharmacyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dosage_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generic_names_pharmacyId_idx" ON "generic_names"("pharmacyId");

-- CreateIndex
CREATE UNIQUE INDEX "generic_names_pharmacyId_name_key" ON "generic_names"("pharmacyId", "name");

-- CreateIndex
CREATE INDEX "dosages_pharmacyId_idx" ON "dosages"("pharmacyId");

-- CreateIndex
CREATE UNIQUE INDEX "dosages_pharmacyId_name_key" ON "dosages"("pharmacyId", "name");

-- CreateIndex
CREATE INDEX "dosage_forms_pharmacyId_idx" ON "dosage_forms"("pharmacyId");

-- CreateIndex
CREATE UNIQUE INDEX "dosage_forms_pharmacyId_name_key" ON "dosage_forms"("pharmacyId", "name");

-- AddForeignKey
ALTER TABLE "generic_names" ADD CONSTRAINT "generic_names_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosages" ADD CONSTRAINT "dosages_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosage_forms" ADD CONSTRAINT "dosage_forms_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_genericNameId_fkey" FOREIGN KEY ("genericNameId") REFERENCES "generic_names"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_dosageId_fkey" FOREIGN KEY ("dosageId") REFERENCES "dosages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_dosageFormId_fkey" FOREIGN KEY ("dosageFormId") REFERENCES "dosage_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
