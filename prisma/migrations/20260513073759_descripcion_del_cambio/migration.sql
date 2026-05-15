/*
  Warnings:

  - Made the column `estatus` on table `solicitudes_recoleccion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "cliente" ALTER COLUMN "familia" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "solicitudes_recoleccion" ALTER COLUMN "estatus" SET NOT NULL,
ALTER COLUMN "estatus" SET DEFAULT true;

-- CreateTable
CREATE TABLE "zona" (
    "id_zona" INTEGER NOT NULL,
    "municipio" VARCHAR NOT NULL,
    "descripcion" VARCHAR,
    "estado" VARCHAR NOT NULL,

    CONSTRAINT "zona_pkey" PRIMARY KEY ("id_zona")
);
