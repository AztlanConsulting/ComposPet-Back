-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE public.bitacora_id_bitacora_seq;

CREATE SEQUENCE public.bitacora_id_bitacora_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.bitacora_id_bitacora_seq1;

CREATE SEQUENCE public.bitacora_id_bitacora_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- public.compospet definition

-- Drop table

-- DROP TABLE public.compospet;

CREATE TABLE public.compospet (
	id_cp uuid DEFAULT gen_random_uuid() NOT NULL,
	CONSTRAINT compospet_pkey PRIMARY KEY (id_cp)
);


-- public.formas_pago definition

-- Drop table

-- DROP TABLE public.formas_pago;

CREATE TABLE public.formas_pago (
	tipo varchar NOT NULL,
	texto text NULL,
	notas text NULL,
	id_pago int4 NOT NULL,
	CONSTRAINT formas_pago_pkey PRIMARY KEY (id_pago)
);


-- public.niveles definition

-- Drop table

-- DROP TABLE public.niveles;

CREATE TABLE public.niveles (
	id_nivel uuid DEFAULT gen_random_uuid() NOT NULL,
	nombre varchar NOT NULL,
	CONSTRAINT niveles_pkey PRIMARY KEY (id_nivel)
);


-- public.permisos definition

-- Drop table

-- DROP TABLE public.permisos;

CREATE TABLE public.permisos (
	id_permiso uuid DEFAULT gen_random_uuid() NOT NULL,
	nombre varchar NOT NULL,
	descripcion text NULL,
	CONSTRAINT permisos_pkey PRIMARY KEY (id_permiso)
);


-- public.productos_extra definition

-- Drop table

-- DROP TABLE public.productos_extra;

CREATE TABLE public.productos_extra (
	id_producto int4 NOT NULL,
	nombre varchar NOT NULL,
	precio float8 NOT NULL,
	descripcion varchar NULL,
	cantidad int4 NOT NULL,
	estatus bool DEFAULT true NOT NULL,
	imagen_url varchar NULL,
	CONSTRAINT productos_extra_pkey PRIMARY KEY (id_producto)
);


-- public.promociones definition

-- Drop table

-- DROP TABLE public.promociones;

CREATE TABLE public.promociones (
	id_promociones int4 NOT NULL,
	nombre varchar NOT NULL,
	descripcion text NULL,
	valor_descuento int4 NULL,
	CONSTRAINT promociones_pkey PRIMARY KEY (id_promociones)
);


-- public.roles definition

-- Drop table

-- DROP TABLE public.roles;

CREATE TABLE public.roles (
	id_rol uuid DEFAULT gen_random_uuid() NOT NULL,
	nombre varchar NOT NULL,
	CONSTRAINT roles_pkey PRIMARY KEY (id_rol)
);


-- public.zona definition

-- Drop table

-- DROP TABLE public.zona;

CREATE TABLE public.zona (
	id_zona int4 NOT NULL,
	nombre_zona varchar NOT NULL,
	municipio varchar NOT NULL,
	descripcion varchar NULL,
	estado varchar NOT NULL,
	CONSTRAINT zona_pkey PRIMARY KEY (id_zona)
);


-- public.faq definition

-- Drop table

-- DROP TABLE public.faq;

CREATE TABLE public.faq (
	id_faq int4 NOT NULL,
	id_cp uuid NOT NULL,
	pregunta varchar NOT NULL,
	respuesta text NOT NULL,
	CONSTRAINT faq_pkey PRIMARY KEY (id_faq),
	CONSTRAINT fk_faq_compospet FOREIGN KEY (id_cp) REFERENCES public.compospet(id_cp)
);


-- public.metricas definition

-- Drop table

-- DROP TABLE public.metricas;

CREATE TABLE public.metricas (
	id_metrica int4 NOT NULL,
	id_cp uuid NOT NULL,
	valor float8 NOT NULL,
	nombre varchar NOT NULL,
	fecha date NOT NULL,
	CONSTRAINT metricas_pkey PRIMARY KEY (id_metrica),
	CONSTRAINT fk_metricas_compospet FOREIGN KEY (id_cp) REFERENCES public.compospet(id_cp)
);


-- public.nivel_promociones definition

-- Drop table

-- DROP TABLE public.nivel_promociones;

CREATE TABLE public.nivel_promociones (
	id_nivel uuid NOT NULL,
	id_promociones int4 NOT NULL,
	CONSTRAINT nivel_promociones_pkey PRIMARY KEY (id_nivel, id_promociones),
	CONSTRAINT fk_nivel_promociones_nivel FOREIGN KEY (id_nivel) REFERENCES public.niveles(id_nivel),
	CONSTRAINT fk_nivel_promociones_promocion FOREIGN KEY (id_promociones) REFERENCES public.promociones(id_promociones)
);


-- public.personas_equipo definition

-- Drop table

-- DROP TABLE public.personas_equipo;

CREATE TABLE public.personas_equipo (
	id_personas_equipo int4 NOT NULL,
	id_cp uuid NOT NULL,
	nombre varchar NOT NULL,
	apellido_paterno varchar NOT NULL,
	apellido_materno varchar NOT NULL,
	foto varchar NULL,
	CONSTRAINT personas_equipo_pkey PRIMARY KEY (id_personas_equipo),
	CONSTRAINT fk_personas_equipo_compospet FOREIGN KEY (id_cp) REFERENCES public.compospet(id_cp)
);


-- public.roles_permisos definition

-- Drop table

-- DROP TABLE public.roles_permisos;

CREATE TABLE public.roles_permisos (
	id_rol uuid NOT NULL,
	id_permiso uuid NOT NULL,
	CONSTRAINT roles_permisos_pkey PRIMARY KEY (id_rol, id_permiso),
	CONSTRAINT fk_roles_permisos_permiso FOREIGN KEY (id_permiso) REFERENCES public.permisos(id_permiso),
	CONSTRAINT fk_roles_permisos_rol FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol)
);


-- public.ruta definition

-- Drop table

-- DROP TABLE public.ruta;

CREATE TABLE public.ruta (
	id_ruta int4 NOT NULL,
	dia_ruta varchar NOT NULL,
	id_zona int4 NOT NULL,
	turno_ruta varchar NOT NULL,
	CONSTRAINT ruta_pkey PRIMARY KEY (id_ruta),
	CONSTRAINT ruta_zona_fk FOREIGN KEY (id_zona) REFERENCES public.zona(id_zona)
);


-- public.usuarios_cp definition

-- Drop table

-- DROP TABLE public.usuarios_cp;

CREATE TABLE public.usuarios_cp (
	id_usuario uuid DEFAULT gen_random_uuid() NOT NULL,
	id_cp uuid NOT NULL,
	id_rol uuid NOT NULL,
	nombre varchar NOT NULL,
	apellido varchar NULL,
	contrasena varchar NOT NULL,
	estatus bool DEFAULT false NOT NULL,
	telefono varchar NULL,
	correo varchar NOT NULL,
	primer_inicio_sesion bool DEFAULT true NOT NULL,
	intentos_fallidos int4 DEFAULT 0 NOT NULL,
	bloqueado_hasta timestamp NULL,
	CONSTRAINT usuarios_cp_pk PRIMARY KEY (id_usuario),
	CONSTRAINT usuarios_cp_unique_correo UNIQUE (correo),
	CONSTRAINT usuarios_cp_compospet_fk FOREIGN KEY (id_cp) REFERENCES public.compospet(id_cp),
	CONSTRAINT usuarios_cp_roles_fk FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol)
);


-- public.administrador definition

-- Drop table

-- DROP TABLE public.administrador;

CREATE TABLE public.administrador (
	id_admin uuid DEFAULT gen_random_uuid() NOT NULL,
	id_usuario uuid NOT NULL,
	clave int8 NULL,
	nombre varchar NOT NULL,
	banco varchar NULL,
	CONSTRAINT administrador_id_usuario_key UNIQUE (id_usuario),
	CONSTRAINT administrador_pkey PRIMARY KEY (id_admin),
	CONSTRAINT fk_administrador_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios_cp(id_usuario)
);


-- public.avisos definition

-- Drop table

-- DROP TABLE public.avisos;

CREATE TABLE public.avisos (
	id_aviso int4 NOT NULL,
	id_admin uuid NOT NULL,
	titulo varchar NOT NULL,
	texto text NOT NULL,
	foto varchar NULL,
	fecha date NOT NULL,
	CONSTRAINT avisos_pkey PRIMARY KEY (id_aviso),
	CONSTRAINT fk_avisos_administrador FOREIGN KEY (id_admin) REFERENCES public.administrador(id_admin)
);


-- public.bitacora definition

-- Drop table

-- DROP TABLE public.bitacora;

CREATE TABLE public.bitacora (
	id_bitacora int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	origen varchar NOT NULL,
	accion varchar NOT NULL,
	tabla_afectada varchar NULL,
	objeto_afectado varchar NULL,
	id_registro varchar NULL,
	app_user_id uuid NULL,
	db_user varchar NOT NULL,
	fecha_evento timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	datos_anteriores jsonb NULL,
	datos_nuevos jsonb NULL,
	detalle text NULL,
	CONSTRAINT bitacora_pkey PRIMARY KEY (id_bitacora),
	CONSTRAINT fk_bitacora_usuario FOREIGN KEY (app_user_id) REFERENCES public.usuarios_cp(id_usuario)
);


-- public.cliente definition

-- Drop table

-- DROP TABLE public.cliente;

CREATE TABLE public.cliente (
	id_cliente uuid DEFAULT gen_random_uuid() NOT NULL,
	id_usuario uuid NOT NULL,
	id_ruta int4 NOT NULL,
	mascotas varchar NULL,
	cantidad_familia int4 NULL,
	direccion varchar NULL,
	orden_horario int4 NULL,
	notas text NULL,
	fecha_entrada date NULL,
	fecha_salida date NULL,
	CONSTRAINT cliente_id_usuario_key UNIQUE (id_usuario),
	CONSTRAINT cliente_pkey PRIMARY KEY (id_cliente),
	CONSTRAINT fk_cliente_ruta FOREIGN KEY (id_ruta) REFERENCES public.ruta(id_ruta),
	CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios_cp(id_usuario)
);

-- Table Triggers

create trigger trg_default_notas_cliente before
insert
    on
    public.cliente for each row execute function fn_default_notas_cliente();


-- public.solicitud_registro definition

-- Drop table

-- DROP TABLE public.solicitud_registro;

CREATE TABLE public.solicitud_registro (
	id_solicitud_registro uuid DEFAULT gen_random_uuid() NOT NULL,
	id_usuario uuid NOT NULL,
	nombre varchar NOT NULL,
	apellido varchar NOT NULL,
	telefono varchar NULL,
	correo varchar NOT NULL,
	direccion varchar NULL,
	zona varchar NULL,
	mascotas varchar NULL,
	cantidad_familia int4 NULL,
	notas text NULL,
	fecha date NOT NULL,
	estatus bool DEFAULT false NOT NULL,
	CONSTRAINT solicitud_registro_pkey PRIMARY KEY (id_solicitud_registro),
	CONSTRAINT fk_solicitud_registro_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios_cp(id_usuario)
);


-- public.solicitudes_recoleccion definition

-- Drop table

-- DROP TABLE public.solicitudes_recoleccion;

CREATE TABLE public.solicitudes_recoleccion (
	id_solicitud uuid DEFAULT gen_random_uuid() NOT NULL,
	id_cliente uuid NOT NULL,
	cubetas_entregadas int4 NULL,
	cubetas_recolectadas int4 NULL,
	total_a_pagar float8 NULL,
	total_pagado float8 NULL,
	fecha date NOT NULL,
	horario time NULL,
	notas text NULL,
	quiere_recoleccion bool DEFAULT false NULL,
	quiere_productos_extra bool DEFAULT false NULL,
	id_pago int4 NULL,
	CONSTRAINT solicitudes_recoleccion_pkey PRIMARY KEY (id_solicitud),
	CONSTRAINT fk_solicitudes_recoleccion_cliente FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente),
	CONSTRAINT solicitudes_recoleccion_id_pago_fkey FOREIGN KEY (id_pago) REFERENCES public.formas_pago(id_pago)
);


-- public.tarjeta_lealtad definition

-- Drop table

-- DROP TABLE public.tarjeta_lealtad;

CREATE TABLE public.tarjeta_lealtad (
	id_tarjeta_lealtad uuid DEFAULT gen_random_uuid() NOT NULL,
	id_cliente uuid NOT NULL,
	id_nivel uuid NOT NULL,
	saldo float8 DEFAULT 0 NOT NULL,
	CONSTRAINT tarjeta_lealtad_id_cliente_key UNIQUE (id_cliente),
	CONSTRAINT tarjeta_lealtad_pkey PRIMARY KEY (id_tarjeta_lealtad),
	CONSTRAINT fk_tarjeta_lealtad_cliente FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente),
	CONSTRAINT fk_tarjeta_lealtad_nivel FOREIGN KEY (id_nivel) REFERENCES public.niveles(id_nivel)
);


-- public.productos_solicitud definition

-- Drop table

-- DROP TABLE public.productos_solicitud;

CREATE TABLE public.productos_solicitud (
	id_solicitud uuid NOT NULL,
	id_producto int4 NOT NULL,
	fecha date NULL,
	cantidad int4 NOT NULL,
	CONSTRAINT productos_solicitud_pkey PRIMARY KEY (id_solicitud, id_producto),
	CONSTRAINT fk_productos_solicitud_producto FOREIGN KEY (id_producto) REFERENCES public.productos_extra(id_producto),
	CONSTRAINT fk_productos_solicitud_solicitud FOREIGN KEY (id_solicitud) REFERENCES public.solicitudes_recoleccion(id_solicitud)
);



-- DROP FUNCTION public.fn_default_notas_cliente();

CREATE OR REPLACE FUNCTION public.fn_default_notas_cliente()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
		IF NEW.notas IS NULL OR TRIM(NEW.notas) = '' THEN
	        NEW.notas := 'Sin notas';
	    END IF;
	
	    RETURN NEW;
	END;
$function$
;

ALTER TABLE public.productos_extra
ADD COLUMN imagen_url character varying;

ALTER TABLE public.productos_extra
ADD COLUMN orden INT;
