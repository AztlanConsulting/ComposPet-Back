-- AlterTable
ALTER TABLE "precios_cubetas"
ADD COLUMN "gratis" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "precios_cubetas"
ALTER COLUMN "gratis" DROP DEFAULT;