/*
  Warnings:

  - The primary key for the `formas_pago` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `estatus` column on the `productos_extra` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `id_pago` column on the `solicitudes_recoleccion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `nombre_zona` on the `zona` table. All the data in the column will be lost.
  - You are about to drop the `nivel_promociones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `niveles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promociones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tarjeta_lealtad` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `id_pago` on the `formas_pago` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "nivel_promociones" DROP CONSTRAINT "fk_nivel_promociones_nivel";

-- DropForeignKey
ALTER TABLE "nivel_promociones" DROP CONSTRAINT "fk_nivel_promociones_promocion";

-- DropForeignKey
ALTER TABLE "solicitudes_recoleccion" DROP CONSTRAINT "fk_solicitudes_recoleccion_pago";

-- DropForeignKey
ALTER TABLE "tarjeta_lealtad" DROP CONSTRAINT "fk_tarjeta_lealtad_cliente";

-- DropForeignKey
ALTER TABLE "tarjeta_lealtad" DROP CONSTRAINT "fk_tarjeta_lealtad_nivel";

-- AlterTable
ALTER TABLE "formas_pago" DROP CONSTRAINT "formas_pago_pkey",
DROP COLUMN "id_pago",
ADD COLUMN     "id_pago" INTEGER NOT NULL,
ADD CONSTRAINT "formas_pago_pkey" PRIMARY KEY ("id_pago");

-- AlterTable
ALTER TABLE "productos_extra" DROP COLUMN "estatus",
ADD COLUMN     "estatus" BOOLEAN;

-- AlterTable
ALTER TABLE "solicitudes_recoleccion" ADD COLUMN     "quiere_productos_extra" BOOLEAN DEFAULT false,
ADD COLUMN     "quiere_recoleccion" BOOLEAN DEFAULT false,
DROP COLUMN "id_pago",
ADD COLUMN     "id_pago" INTEGER;

-- AlterTable
ALTER TABLE "usuarios_cp" ALTER COLUMN "codigo_verificacion" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "zona" DROP COLUMN "nombre_zona";

-- DropTable
DROP TABLE "nivel_promociones";

-- DropTable
DROP TABLE "niveles";

-- DropTable
DROP TABLE "promociones";

-- DropTable
DROP TABLE "tarjeta_lealtad";

-- CreateTable
CREATE TABLE "saldo" (
    "id_saldo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cliente" UUID NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "saldo_pkey" PRIMARY KEY ("id_saldo")
);

-- CreateIndex
CREATE UNIQUE INDEX "saldo_id_cliente_key" ON "saldo"("id_cliente");

-- AddForeignKey
ALTER TABLE "solicitudes_recoleccion" ADD CONSTRAINT "fk_solicitudes_recoleccion_pago" FOREIGN KEY ("id_pago") REFERENCES "formas_pago"("id_pago") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "saldo" ADD CONSTRAINT "fk_saldo_cliente" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_cliente") ON DELETE NO ACTION ON UPDATE NO ACTION;
