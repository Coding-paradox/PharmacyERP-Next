CREATE TABLE "medicine_batches" (
  "id" TEXT NOT NULL,
  "medicineId" TEXT NOT NULL,
  "pharmacyId" TEXT NOT NULL,
  "batchNumber" TEXT NOT NULL,
  "expiryDate" TIMESTAMP(3),
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "costPrice" DECIMAL(10,2) NOT NULL,
  "currency" "Currency" NOT NULL DEFAULT 'CDF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "medicine_batches_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sale_item_batches" (
  "id" TEXT NOT NULL,
  "saleItemId" TEXT NOT NULL,
  "medicineBatchId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sale_item_batches_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "purchase_items" ADD COLUMN "medicineBatchId" TEXT;
ALTER TABLE "inventory_movements" ADD COLUMN "medicineBatchId" TEXT;
CREATE UNIQUE INDEX "medicine_batches_pharmacyId_medicineId_batchNumber_key" ON "medicine_batches"("pharmacyId", "medicineId", "batchNumber");
CREATE INDEX "medicine_batches_pharmacyId_medicineId_expiryDate_idx" ON "medicine_batches"("pharmacyId", "medicineId", "expiryDate");
CREATE INDEX "medicine_batches_pharmacyId_quantity_idx" ON "medicine_batches"("pharmacyId", "quantity");
CREATE UNIQUE INDEX "sale_item_batches_saleItemId_medicineBatchId_key" ON "sale_item_batches"("saleItemId", "medicineBatchId");
CREATE INDEX "sale_item_batches_medicineBatchId_idx" ON "sale_item_batches"("medicineBatchId");
ALTER TABLE "medicine_batches" ADD CONSTRAINT "medicine_batches_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medicine_batches" ADD CONSTRAINT "medicine_batches_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_item_batches" ADD CONSTRAINT "sale_item_batches_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_item_batches" ADD CONSTRAINT "sale_item_batches_medicineBatchId_fkey" FOREIGN KEY ("medicineBatchId") REFERENCES "medicine_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_medicineBatchId_fkey" FOREIGN KEY ("medicineBatchId") REFERENCES "medicine_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_medicineBatchId_fkey" FOREIGN KEY ("medicineBatchId") REFERENCES "medicine_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve each current aggregate balance in a legacy lot, including zero-stock medicines for historical audit records.
INSERT INTO "medicine_batches" ("id", "medicineId", "pharmacyId", "batchNumber", "expiryDate", "quantity", "costPrice", "currency", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text || m."id"), m."id", m."pharmacyId", COALESCE(NULLIF(m."batchNumber", ''), 'LEGACY-' || m."id"), m."expiryDate", m."stock", m."costPrice", m."costCurrency", CURRENT_TIMESTAMP
FROM "medicines" m
WHERE NOT EXISTS (SELECT 1 FROM "medicine_batches" b WHERE b."medicineId" = m."id");

-- Historical sale allocations do not change today's balances.
INSERT INTO "sale_item_batches" ("id", "saleItemId", "medicineBatchId", "quantity")
SELECT md5(random()::text || clock_timestamp()::text || si."id"), si."id", b."id", si."quantity"
FROM "sale_items" si
JOIN "medicines" m ON m."id" = si."medicineId"
JOIN "medicine_batches" b ON b."medicineId" = m."id" AND b."pharmacyId" = m."pharmacyId"
WHERE NOT EXISTS (SELECT 1 FROM "sale_item_batches" sb WHERE sb."saleItemId" = si."id");
