-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "dispositivo" VARCHAR,
    "ip" VARCHAR,
    "iniciada_en" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMP(6) NOT NULL,
    "ultima_actividad" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_refresh_token_key" ON "sesiones"("refresh_token");

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "fk_sesiones_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios_cp"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;
