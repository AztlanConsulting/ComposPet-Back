-- AlterTable
ALTER TABLE "cliente" ADD COLUMN     "tipo_precio" VARCHAR;

-- CreateTable
CREATE TABLE "precios_cubetas" (
    "id_precio" SERIAL NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "normal" DOUBLE PRECISION NOT NULL,
    "normal_iva" DOUBLE PRECISION NOT NULL,
    "pension" DOUBLE PRECISION NOT NULL,
    "pension_iva" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "precios_cubetas_pkey" PRIMARY KEY ("id_precio")
);
