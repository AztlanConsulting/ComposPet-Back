-- La transacción mantiene atómicos el cambio de esquema y la carga inicial.
BEGIN;

-- Primero se permite NULL para poder completar las filas existentes.
ALTER TABLE "ruta" ADD COLUMN "orden" INTEGER;

-- Prioridad inicial confirmada. No se modifica ningún campo preexistente.
UPDATE "ruta" AS r
SET "orden" = inicial."orden"
FROM (VALUES
    (1, 1),
    (9, 2),
    (10, 3),
    (2, 4),
    (3, 5),
    (4, 6),
    (5, 7),
    (6, 8),
    (11, 9),
    (7, 10),
    (8, 11),
    (12, 12)
) AS inicial("id_ruta", "orden")
WHERE r."id_ruta" = inicial."id_ruta";

-- Una base vacía es válida al reproducir el historial de Prisma.
-- Con datos, se exigen las 12 rutas autorizadas y la secuencia exacta 1..12.
DO $$
DECLARE
    total BIGINT;
    asignados BIGINT;
    distintos BIGINT;
    minimo INTEGER;
    maximo INTEGER;
BEGIN
    SELECT COUNT(*), COUNT("orden"), COUNT(DISTINCT "orden"),
           MIN("orden"), MAX("orden")
    INTO total, asignados, distintos, minimo, maximo
    FROM "ruta";

    IF total NOT IN (0, 12) THEN
        RAISE EXCEPTION 'ruta.orden: se esperaban las 12 rutas autorizadas o una tabla vacía; se encontraron %', total;
    END IF;

    IF asignados <> total THEN
        RAISE EXCEPTION 'ruta.orden: existen rutas sin asignación inicial; revisar el mapa de IDs';
    END IF;

    IF distintos <> total THEN
        RAISE EXCEPTION 'ruta.orden: existen valores duplicados';
    END IF;

    IF total > 0 AND (minimo <> 1 OR maximo <> total) THEN
        RAISE EXCEPTION 'ruta.orden: se esperaba una secuencia consecutiva de 1 a %', total;
    END IF;
END;
$$;

ALTER TABLE "ruta" ALTER COLUMN "orden" SET NOT NULL;
CREATE UNIQUE INDEX "ruta_orden_key" ON "ruta"("orden");

COMMIT;
