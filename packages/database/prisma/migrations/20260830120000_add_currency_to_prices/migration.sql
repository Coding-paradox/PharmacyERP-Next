-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CDF', 'USD');

-- AlterTable
ALTER TABLE "medicines" ADD COLUMN "costCurrency" "Currency" NOT NULL DEFAULT 'CDF';
ALTER TABLE "medicines" ADD COLUMN "sellingCurrency" "Currency" NOT NULL DEFAULT 'CDF';

-- AlterTable
ALTER TABLE "sales" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'CDF';

-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'CDF';

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'CDF';

-- AlterTable
ALTER TABLE "purchase_items" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'CDF';
