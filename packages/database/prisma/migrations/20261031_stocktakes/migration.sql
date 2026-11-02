CREATE TYPE "StocktakeStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

CREATE TABLE "stocktakes" (
  "id" TEXT NOT NULL,
  "pharmacyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "StocktakeStatus" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "stocktakes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stocktake_items" (
  "id" TEXT NOT NULL,
  "stocktakeId" TEXT NOT NULL,
  "medicineId" TEXT NOT NULL,
  "medicineBatchId" TEXT,
  "batchNumber" TEXT NOT NULL,
  "expiryDate" TIMESTAMP(3),
  "expectedQuantity" INTEGER NOT NULL,
  "countedQuantity" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stocktake_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stocktakes_pharmacyId_status_createdAt_idx" ON "stocktakes"("pharmacyId", "status", "createdAt");
CREATE UNIQUE INDEX "stocktake_items_stocktakeId_medicineId_batchNumber_key" ON "stocktake_items"("stocktakeId", "medicineId", "batchNumber");
CREATE INDEX "stocktake_items_stocktakeId_idx" ON "stocktake_items"("stocktakeId");
CREATE INDEX "stocktake_items_medicineId_idx" ON "stocktake_items"("medicineId");

ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_stocktakeId_fkey" FOREIGN KEY ("stocktakeId") REFERENCES "stocktakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_medicineBatchId_fkey" FOREIGN KEY ("medicineBatchId") REFERENCES "medicine_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
