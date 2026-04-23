-- CreateTable
CREATE TABLE "administrador" (
    "id_admin" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "clave" BIGINT,
    "nombre" VARCHAR NOT NULL,
    "banco" VARCHAR,

    CONSTRAINT "administrador_pkey" PRIMARY KEY ("id_admin")
);

-- CreateTable
CREATE TABLE "avisos" (
    "id_aviso" INTEGER NOT NULL,
    "id_admin" UUID NOT NULL,
    "titulo" VARCHAR NOT NULL,
    "texto" TEXT NOT NULL,
    "foto" VARCHAR,
    "fecha" DATE NOT NULL,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id_aviso")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id_bitacora" SERIAL NOT NULL,
    "origen" VARCHAR NOT NULL,
    "accion" VARCHAR NOT NULL,
    "tabla_afectada" VARCHAR,
    "objeto_afectado" VARCHAR,
    "id_registro" VARCHAR,
    "app_user_id" UUID,
    "db_user" VARCHAR NOT NULL,
    "fecha_evento" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "detalle" TEXT,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id_bitacora")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id_cliente" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_ruta" INTEGER NOT NULL,
    "mascotas" VARCHAR,
    "familia" TEXT,
    "direccion" VARCHAR,
    "orden_horario" INTEGER,
    "notas" TEXT,
    "fecha_entrada" DATE,
    "fecha_salida" DATE,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "compospet" (
    "id_cp" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "compospet_pkey" PRIMARY KEY ("id_cp")
);

-- CreateTable
CREATE TABLE "estados" (
    "id_estado" INTEGER NOT NULL,
    "estado" VARCHAR NOT NULL,

    CONSTRAINT "estados_pkey" PRIMARY KEY ("id_estado")
);

-- CreateTable
CREATE TABLE "faq" (
    "id_faq" INTEGER NOT NULL,
    "id_cp" UUID NOT NULL,
    "pregunta" VARCHAR NOT NULL,
    "respuesta" TEXT NOT NULL,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id_faq")
);

-- CreateTable
CREATE TABLE "formas_pago" (
    "id_pago" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" VARCHAR NOT NULL,
    "texto" TEXT,
    "notas" TEXT,

    CONSTRAINT "formas_pago_pkey" PRIMARY KEY ("id_pago")
);

-- CreateTable
CREATE TABLE "metricas" (
    "id_metrica" INTEGER NOT NULL,
    "id_cp" UUID NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "nombre" VARCHAR NOT NULL,
    "fecha" DATE NOT NULL,

    CONSTRAINT "metricas_pkey" PRIMARY KEY ("id_metrica")
);

-- CreateTable
CREATE TABLE "municipios" (
    "id_municipio" INTEGER NOT NULL,
    "municipio" VARCHAR NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id_municipio")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id_permiso" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id_permiso")
);

-- CreateTable
CREATE TABLE "personas_equipo" (
    "id_personas_equipo" INTEGER NOT NULL,
    "id_cp" UUID NOT NULL,
    "nombre" VARCHAR NOT NULL,
    "apellido_paterno" VARCHAR NOT NULL,
    "apellido_materno" VARCHAR NOT NULL,
    "foto" VARCHAR,

    CONSTRAINT "personas_equipo_pkey" PRIMARY KEY ("id_personas_equipo")
);

-- CreateTable
CREATE TABLE "productos_extra" (
    "id_producto" INTEGER NOT NULL,
    "nombre" VARCHAR NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "descripcion" VARCHAR,
    "cantidad" INTEGER NOT NULL,
    "imagen_url" VARCHAR,
    "estatus" VARCHAR(20) DEFAULT 'activo',
    "orden" INTEGER,

    CONSTRAINT "productos_extra_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "productos_solicitud" (
    "id_solicitud" UUID NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "fecha" DATE,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "productos_solicitud_pkey" PRIMARY KEY ("id_solicitud","id_producto")
);

-- CreateTable
CREATE TABLE "roles" (
    "id_rol" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "id_rol" UUID NOT NULL,
    "id_permiso" UUID NOT NULL,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("id_rol","id_permiso")
);

-- CreateTable
CREATE TABLE "ruta" (
    "id_ruta" INTEGER NOT NULL,
    "dia_ruta" VARCHAR NOT NULL,
    "id_zona" INTEGER NOT NULL,
    "turno_ruta" VARCHAR NOT NULL,

    CONSTRAINT "ruta_pkey" PRIMARY KEY ("id_ruta")
);

-- CreateTable
CREATE TABLE "solicitud_registro" (
    "id_solicitud_registro" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "nombre" VARCHAR NOT NULL,
    "apellido" VARCHAR NOT NULL,
    "telefono" VARCHAR,
    "correo" VARCHAR NOT NULL,
    "direccion" VARCHAR,
    "zona" VARCHAR,
    "mascotas" VARCHAR,
    "familia" VARCHAR,
    "notas" TEXT,
    "fecha" DATE NOT NULL,
    "estatus" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "solicitud_registro_pkey" PRIMARY KEY ("id_solicitud_registro")
);

-- CreateTable
CREATE TABLE "solicitudes_recoleccion" (
    "id_solicitud" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cliente" UUID NOT NULL,
    "id_pago" UUID NOT NULL,
    "cubetas_entregadas" INTEGER,
    "cubetas_recolectadas" INTEGER,
    "total_a_pagar" DOUBLE PRECISION,
    "total_pagado" DOUBLE PRECISION,
    "fecha" DATE NOT NULL,
    "horario" TIME(6),
    "notas" TEXT,

    CONSTRAINT "solicitudes_recoleccion_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "saldo" (
    "id_saldo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cliente" UUID NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "saldo_pkey" PRIMARY KEY ("id_saldo")
);

-- CreateTable
CREATE TABLE "usuarios_cp" (
    "id_usuario" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cp" UUID NOT NULL,
    "id_rol" UUID NOT NULL,
    "nombre" VARCHAR NOT NULL,
    "apellido" VARCHAR,
    "contrasena" VARCHAR NOT NULL,
    "estatus" BOOLEAN NOT NULL DEFAULT false,
    "telefono" VARCHAR,
    "correo" VARCHAR NOT NULL,
    "primer_inicio_sesion" BOOLEAN NOT NULL DEFAULT true,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(6),
    "codigo_expiracion" TIMESTAMP(6),
    "codigo_verificacion" VARCHAR(6),

    CONSTRAINT "usuarios_cp_pk" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "zona" (
    "id_zona" INTEGER NOT NULL,
    "descripcion" VARCHAR,
    "id_estado" INTEGER NOT NULL,
    "id_municipio" INTEGER NOT NULL,

    CONSTRAINT "zona_pkey" PRIMARY KEY ("id_zona")
);

-- CreateIndex
CREATE UNIQUE INDEX "administrador_id_usuario_key" ON "administrador"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_id_usuario_key" ON "cliente"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "saldo_id_cliente_key" ON "saldo"("id_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cp_unique_correo" ON "usuarios_cp"("correo");

-- AddForeignKey
ALTER TABLE "administrador" ADD CONSTRAINT "fk_administrador_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios_cp"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "fk_avisos_administrador" FOREIGN KEY ("id_admin") REFERENCES "administrador"("id_admin") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "fk_bitacora_usuario" FOREIGN KEY ("app_user_id") REFERENCES "usuarios_cp"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "fk_cliente_ruta" FOREIGN KEY ("id_ruta") REFERENCES "ruta"("id_ruta") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "fk_cliente_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios_cp"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "faq" ADD CONSTRAINT "fk_faq_compospet" FOREIGN KEY ("id_cp") REFERENCES "compospet"("id_cp") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metricas" ADD CONSTRAINT "fk_metricas_compospet" FOREIGN KEY ("id_cp") REFERENCES "compospet"("id_cp") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personas_equipo" ADD CONSTRAINT "fk_personas_equipo_compospet" FOREIGN KEY ("id_cp") REFERENCES "compospet"("id_cp") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos_solicitud" ADD CONSTRAINT "fk_productos_solicitud_producto" FOREIGN KEY ("id_producto") REFERENCES "productos_extra"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos_solicitud" ADD CONSTRAINT "fk_productos_solicitud_solicitud" FOREIGN KEY ("id_solicitud") REFERENCES "solicitudes_recoleccion"("id_solicitud") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "fk_roles_permisos_permiso" FOREIGN KEY ("id_permiso") REFERENCES "permisos"("id_permiso") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "fk_roles_permisos_rol" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ruta" ADD CONSTRAINT "ruta_zona_fk" FOREIGN KEY ("id_zona") REFERENCES "zona"("id_zona") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "solicitud_registro" ADD CONSTRAINT "fk_solicitud_registro_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios_cp"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "solicitudes_recoleccion" ADD CONSTRAINT "fk_solicitudes_recoleccion_cliente" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_cliente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "solicitudes_recoleccion" ADD CONSTRAINT "fk_solicitudes_recoleccion_pago" FOREIGN KEY ("id_pago") REFERENCES "formas_pago"("id_pago") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "saldo" ADD CONSTRAINT "fk_saldo_cliente" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_cliente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuarios_cp" ADD CONSTRAINT "usuarios_cp_compospet_fk" FOREIGN KEY ("id_cp") REFERENCES "compospet"("id_cp") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuarios_cp" ADD CONSTRAINT "usuarios_cp_roles_fk" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zona" ADD CONSTRAINT "fk_zona_estado" FOREIGN KEY ("id_estado") REFERENCES "estados"("id_estado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zona" ADD CONSTRAINT "fk_zona_municipio" FOREIGN KEY ("id_municipio") REFERENCES "municipios"("id_municipio") ON DELETE NO ACTION ON UPDATE NO ACTION;
