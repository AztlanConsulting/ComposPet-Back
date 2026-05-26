/*
  Warnings:

  - You are about to drop the `administrador` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `avisos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `faq` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `personas_equipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `solicitud_registro` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "administrador" DROP CONSTRAINT "fk_administrador_usuario";

-- DropForeignKey
ALTER TABLE "avisos" DROP CONSTRAINT "fk_avisos_administrador";

-- DropForeignKey
ALTER TABLE "faq" DROP CONSTRAINT "fk_faq_compospet";

-- DropForeignKey
ALTER TABLE "personas_equipo" DROP CONSTRAINT "fk_personas_equipo_compospet";

-- DropForeignKey
ALTER TABLE "solicitud_registro" DROP CONSTRAINT "fk_solicitud_registro_usuario";

-- DropTable
DROP TABLE "administrador";

-- DropTable
DROP TABLE "avisos";

-- DropTable
DROP TABLE "faq";

-- DropTable
DROP TABLE "personas_equipo";

-- DropTable
DROP TABLE "solicitud_registro";
