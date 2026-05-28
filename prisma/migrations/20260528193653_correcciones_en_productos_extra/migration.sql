/*
  Warnings:

  - Made the column `estatus` on table `productos_extra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `color` on table `productos_extra` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
CREATE SEQUENCE productos_extra_id_producto_seq;
ALTER TABLE "productos_extra" ALTER COLUMN "id_producto" SET DEFAULT nextval('productos_extra_id_producto_seq'),
ALTER COLUMN "estatus" SET NOT NULL,
ALTER COLUMN "estatus" SET DEFAULT true,
ALTER COLUMN "color" SET NOT NULL;
ALTER SEQUENCE productos_extra_id_producto_seq OWNED BY "productos_extra"."id_producto";
