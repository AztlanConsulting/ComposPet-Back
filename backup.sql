--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fn_default_notas_cliente(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_default_notas_cliente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
	BEGIN
		IF NEW.notas IS NULL OR TRIM(NEW.notas) = '' THEN
	        NEW.notas := 'Sin notas';
	    END IF;
	
	    RETURN NEW;
	END;
$$;


ALTER FUNCTION public.fn_default_notas_cliente() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administrador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.administrador (
    id_admin uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    clave bigint,
    nombre character varying NOT NULL,
    banco character varying
);


ALTER TABLE public.administrador OWNER TO postgres;

--
-- Name: avisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avisos (
    id_aviso integer NOT NULL,
    id_admin uuid NOT NULL,
    titulo character varying NOT NULL,
    texto text NOT NULL,
    foto character varying,
    fecha date NOT NULL
);


ALTER TABLE public.avisos OWNER TO postgres;

--
-- Name: bitacora; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bitacora (
    id_bitacora integer NOT NULL,
    origen character varying NOT NULL,
    accion character varying NOT NULL,
    tabla_afectada character varying,
    objeto_afectado character varying,
    id_registro character varying,
    app_user_id uuid,
    db_user character varying NOT NULL,
    fecha_evento timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    detalle text
);


ALTER TABLE public.bitacora OWNER TO postgres;

--
-- Name: bitacora_id_bitacora_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bitacora_id_bitacora_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bitacora_id_bitacora_seq OWNER TO postgres;

--
-- Name: bitacora_id_bitacora_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bitacora_id_bitacora_seq OWNED BY public.bitacora.id_bitacora;


--
-- Name: bitacora_id_bitacora_seq1; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bitacora_id_bitacora_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER SEQUENCE public.bitacora_id_bitacora_seq1 OWNER TO postgres;

--
-- Name: cliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cliente (
    id_cliente uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    id_ruta integer NOT NULL,
    mascotas character varying,
    cantidad_familia integer,
    direccion character varying,
    orden_horario integer,
    notas text,
    fecha_entrada date,
    fecha_salida date
);


ALTER TABLE public.cliente OWNER TO postgres;

--
-- Name: compospet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compospet (
    id_cp uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.compospet OWNER TO postgres;

--
-- Name: faq; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faq (
    id_faq integer NOT NULL,
    id_cp uuid NOT NULL,
    pregunta character varying NOT NULL,
    respuesta text NOT NULL
);


ALTER TABLE public.faq OWNER TO postgres;

--
-- Name: formas_pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formas_pago (
    tipo character varying NOT NULL,
    texto text,
    notas text,
    id_pago integer NOT NULL
);


ALTER TABLE public.formas_pago OWNER TO postgres;

--
-- Name: metricas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metricas (
    id_metrica integer NOT NULL,
    id_cp uuid NOT NULL,
    valor double precision NOT NULL,
    nombre character varying NOT NULL,
    fecha date NOT NULL
);


ALTER TABLE public.metricas OWNER TO postgres;

--
-- Name: nivel_promociones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nivel_promociones (
    id_nivel uuid NOT NULL,
    id_promociones integer NOT NULL
);


ALTER TABLE public.nivel_promociones OWNER TO postgres;

--
-- Name: niveles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.niveles (
    id_nivel uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying NOT NULL
);


ALTER TABLE public.niveles OWNER TO postgres;

--
-- Name: permisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permisos (
    id_permiso uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying NOT NULL,
    descripcion text
);


ALTER TABLE public.permisos OWNER TO postgres;

--
-- Name: personas_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personas_equipo (
    id_personas_equipo integer NOT NULL,
    id_cp uuid NOT NULL,
    nombre character varying NOT NULL,
    apellido_paterno character varying NOT NULL,
    apellido_materno character varying NOT NULL,
    foto character varying
);


ALTER TABLE public.personas_equipo OWNER TO postgres;

--
-- Name: productos_extra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos_extra (
    id_producto integer NOT NULL,
    nombre character varying NOT NULL,
    precio double precision NOT NULL,
    descripcion character varying,
    cantidad integer NOT NULL,
    imagen_url character varying,
    estatus character varying(20) DEFAULT 'activo'::character varying,
    orden integer
);


ALTER TABLE public.productos_extra OWNER TO postgres;

--
-- Name: productos_solicitud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos_solicitud (
    id_solicitud uuid NOT NULL,
    id_producto integer NOT NULL,
    fecha date,
    cantidad integer NOT NULL
);


ALTER TABLE public.productos_solicitud OWNER TO postgres;

--
-- Name: promociones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promociones (
    id_promociones integer NOT NULL,
    nombre character varying NOT NULL,
    descripcion text,
    valor_descuento integer
);


ALTER TABLE public.promociones OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id_rol uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_permisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_permisos (
    id_rol uuid NOT NULL,
    id_permiso uuid NOT NULL
);


ALTER TABLE public.roles_permisos OWNER TO postgres;

--
-- Name: ruta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ruta (
    id_ruta integer NOT NULL,
    dia_ruta character varying NOT NULL,
    id_zona integer NOT NULL,
    turno_ruta character varying NOT NULL
);


ALTER TABLE public.ruta OWNER TO postgres;

--
-- Name: solicitud_registro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitud_registro (
    id_solicitud_registro uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    nombre character varying NOT NULL,
    apellido character varying NOT NULL,
    telefono character varying,
    correo character varying NOT NULL,
    direccion character varying,
    zona character varying,
    mascotas character varying,
    cantidad_familia integer,
    notas text,
    fecha date NOT NULL,
    estatus boolean DEFAULT false NOT NULL
);


ALTER TABLE public.solicitud_registro OWNER TO postgres;

--
-- Name: solicitudes_recoleccion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudes_recoleccion (
    id_solicitud uuid DEFAULT gen_random_uuid() NOT NULL,
    id_cliente uuid NOT NULL,
    cubetas_entregadas integer,
    cubetas_recolectadas integer,
    total_a_pagar double precision,
    total_pagado double precision,
    fecha date NOT NULL,
    horario time(6) without time zone,
    notas text,
    quiere_recoleccion boolean DEFAULT false,
    quiere_productos_extra boolean DEFAULT false,
    id_pago integer
);


ALTER TABLE public.solicitudes_recoleccion OWNER TO postgres;

--
-- Name: tarjeta_lealtad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tarjeta_lealtad (
    id_tarjeta_lealtad uuid DEFAULT gen_random_uuid() NOT NULL,
    id_cliente uuid NOT NULL,
    id_nivel uuid NOT NULL,
    saldo double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public.tarjeta_lealtad OWNER TO postgres;

--
-- Name: usuarios_cp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios_cp (
    id_usuario uuid DEFAULT gen_random_uuid() NOT NULL,
    id_cp uuid NOT NULL,
    id_rol uuid NOT NULL,
    nombre character varying NOT NULL,
    apellido character varying,
    contrasena character varying NOT NULL,
    estatus boolean DEFAULT false NOT NULL,
    telefono character varying,
    correo character varying NOT NULL,
    primer_inicio_sesion boolean DEFAULT true NOT NULL,
    intentos_fallidos integer DEFAULT 0 NOT NULL,
    bloqueado_hasta timestamp(6) without time zone,
    codigo_expiracion timestamp(6) without time zone,
    codigo_verificacion character varying(6)
);


ALTER TABLE public.usuarios_cp OWNER TO postgres;

--
-- Name: zona; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zona (
    id_zona integer NOT NULL,
    nombre_zona character varying NOT NULL,
    municipio character varying NOT NULL,
    descripcion character varying,
    estado character varying NOT NULL
);


ALTER TABLE public.zona OWNER TO postgres;

--
-- Name: bitacora id_bitacora; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora ALTER COLUMN id_bitacora SET DEFAULT nextval('public.bitacora_id_bitacora_seq'::regclass);


--
-- Data for Name: administrador; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.administrador (id_admin, id_usuario, clave, nombre, banco) FROM stdin;
\.


--
-- Data for Name: avisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.avisos (id_aviso, id_admin, titulo, texto, foto, fecha) FROM stdin;
\.


--
-- Data for Name: bitacora; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bitacora (id_bitacora, origen, accion, tabla_afectada, objeto_afectado, id_registro, app_user_id, db_user, fecha_evento, datos_anteriores, datos_nuevos, detalle) FROM stdin;
\.


--
-- Data for Name: cliente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cliente (id_cliente, id_usuario, id_ruta, mascotas, cantidad_familia, direccion, orden_horario, notas, fecha_entrada, fecha_salida) FROM stdin;
\.


--
-- Data for Name: compospet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compospet (id_cp) FROM stdin;
11111111-1111-1111-1111-111111111111
\.


--
-- Data for Name: faq; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faq (id_faq, id_cp, pregunta, respuesta) FROM stdin;
\.


--
-- Data for Name: formas_pago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formas_pago (tipo, texto, notas, id_pago) FROM stdin;
\.


--
-- Data for Name: metricas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metricas (id_metrica, id_cp, valor, nombre, fecha) FROM stdin;
\.


--
-- Data for Name: nivel_promociones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nivel_promociones (id_nivel, id_promociones) FROM stdin;
\.


--
-- Data for Name: niveles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.niveles (id_nivel, nombre) FROM stdin;
2cce0220-f1c3-4f35-9719-caeaebd54a15	Dorada
\.


--
-- Data for Name: permisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permisos (id_permiso, nombre, descripcion) FROM stdin;
\.


--
-- Data for Name: personas_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personas_equipo (id_personas_equipo, id_cp, nombre, apellido_paterno, apellido_materno, foto) FROM stdin;
\.


--
-- Data for Name: productos_extra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos_extra (id_producto, nombre, precio, descripcion, cantidad, imagen_url, estatus, orden) FROM stdin;
1	Aserrín	0	Pendiente de definir	148	/img/products/aserrin.jpg	true	1
5	Fibra de Coco 15lt	110	Fibra de coco Cocopet 15lt	36	/img/products/fibra_coco_15lt.jpg	true	5
2	Composta (en cubeta)	50	Cubetita de 4lt adicional	1	/img/products/composta_cubeta_4lt.jpg	true	2
4	Arena en pellet Cocopet 5kg	225	Arena en pellet Cocopet 5kg	0	/img/products/arena_pellet_cocopet_5kg.jpg	true	4
6	Fibra de Coco 50lt	300	Fibra de coco Cocopet 50lt	26	/img/products/fibra_coco_50lt.jpg	true	6
10	Rascador gato GDE	120	Rascador para gato GDE	3	/img/products/rascador_gato_gde.jpg	true	10
3	Hojas Poopis	55	Paquete de hojas Poopis (50 pzas)	-3	/img/products/hojas_poopis.jpg	true	3
8	Servilletas de tela 4 pzas	300	Paquete de 4 servilletas de tela	216	/img/products/servilletas_tela_4pzas.jpg	true	8
7	Servilleta de tela 1 pza	80	1 servilleta de tela	497	/img/products/servilleta_tela_1pza.jpg	true	7
9	Rascador gato CH	80	Rascador para gato CH	38	/img/products/rascador_gato_ch.jpg	true	9
\.


--
-- Data for Name: productos_solicitud; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos_solicitud (id_solicitud, id_producto, fecha, cantidad) FROM stdin;
\.


--
-- Data for Name: promociones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promociones (id_promociones, nombre, descripcion, valor_descuento) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id_rol, nombre) FROM stdin;
22222222-2222-2222-2222-222222222222	administrador
33333333-3333-3333-3333-333333333333	cliente
\.


--
-- Data for Name: roles_permisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles_permisos (id_rol, id_permiso) FROM stdin;
\.


--
-- Data for Name: ruta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ruta (id_ruta, dia_ruta, id_zona, turno_ruta) FROM stdin;
\.


--
-- Data for Name: solicitud_registro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitud_registro (id_solicitud_registro, id_usuario, nombre, apellido, telefono, correo, direccion, zona, mascotas, cantidad_familia, notas, fecha, estatus) FROM stdin;
\.


--
-- Data for Name: solicitudes_recoleccion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudes_recoleccion (id_solicitud, id_cliente, cubetas_entregadas, cubetas_recolectadas, total_a_pagar, total_pagado, fecha, horario, notas, quiere_recoleccion, quiere_productos_extra, id_pago) FROM stdin;
\.


--
-- Data for Name: tarjeta_lealtad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tarjeta_lealtad (id_tarjeta_lealtad, id_cliente, id_nivel, saldo) FROM stdin;
\.


--
-- Data for Name: usuarios_cp; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios_cp (id_usuario, id_cp, id_rol, nombre, apellido, contrasena, estatus, telefono, correo, primer_inicio_sesion, intentos_fallidos, bloqueado_hasta, codigo_expiracion, codigo_verificacion) FROM stdin;
55555555-5555-5555-5555-555555555555	11111111-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	Cliente	Test	$2b$10$WM0Eo59SSna3ZfDBJMHgY.pt81FMgZjHTs7DC1bLqC7EuB3QQ9cDS	t	\N	a01711434@tec.mx	f	0	\N	\N	\N
44444444-4444-4444-4444-444444444444	11111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	Admin	Test	$2b$10$WM0Eo59SSna3ZfDBJMHgY.pt81FMgZjHTs7DC1bLqC7EuB3QQ9cDS	t	\N	a017114342@tec.mx	t	1	\N	\N	\N
\.


--
-- Data for Name: zona; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.zona (id_zona, nombre_zona, municipio, descripcion, estado) FROM stdin;
1	Zona Centro	Querétaro	Zona de prueba	Activa
\.


--
-- Name: bitacora_id_bitacora_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bitacora_id_bitacora_seq', 1, false);


--
-- Name: bitacora_id_bitacora_seq1; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bitacora_id_bitacora_seq1', 1, false);


--
-- Name: administrador administrador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrador
    ADD CONSTRAINT administrador_pkey PRIMARY KEY (id_admin);


--
-- Name: avisos avisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avisos
    ADD CONSTRAINT avisos_pkey PRIMARY KEY (id_aviso);


--
-- Name: bitacora bitacora_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_pkey PRIMARY KEY (id_bitacora);


--
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id_cliente);


--
-- Name: compospet compospet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compospet
    ADD CONSTRAINT compospet_pkey PRIMARY KEY (id_cp);


--
-- Name: faq faq_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faq
    ADD CONSTRAINT faq_pkey PRIMARY KEY (id_faq);


--
-- Name: formas_pago formas_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formas_pago
    ADD CONSTRAINT formas_pago_pkey PRIMARY KEY (id_pago);


--
-- Name: metricas metricas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas
    ADD CONSTRAINT metricas_pkey PRIMARY KEY (id_metrica);


--
-- Name: nivel_promociones nivel_promociones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nivel_promociones
    ADD CONSTRAINT nivel_promociones_pkey PRIMARY KEY (id_nivel, id_promociones);


--
-- Name: niveles niveles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveles
    ADD CONSTRAINT niveles_pkey PRIMARY KEY (id_nivel);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id_permiso);


--
-- Name: personas_equipo personas_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personas_equipo
    ADD CONSTRAINT personas_equipo_pkey PRIMARY KEY (id_personas_equipo);


--
-- Name: productos_extra productos_extra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_extra
    ADD CONSTRAINT productos_extra_pkey PRIMARY KEY (id_producto);


--
-- Name: productos_solicitud productos_solicitud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_solicitud
    ADD CONSTRAINT productos_solicitud_pkey PRIMARY KEY (id_solicitud, id_producto);


--
-- Name: promociones promociones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promociones
    ADD CONSTRAINT promociones_pkey PRIMARY KEY (id_promociones);


--
-- Name: roles_permisos roles_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_pkey PRIMARY KEY (id_rol, id_permiso);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- Name: ruta ruta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ruta
    ADD CONSTRAINT ruta_pkey PRIMARY KEY (id_ruta);


--
-- Name: solicitud_registro solicitud_registro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_registro
    ADD CONSTRAINT solicitud_registro_pkey PRIMARY KEY (id_solicitud_registro);


--
-- Name: solicitudes_recoleccion solicitudes_recoleccion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_recoleccion
    ADD CONSTRAINT solicitudes_recoleccion_pkey PRIMARY KEY (id_solicitud);


--
-- Name: tarjeta_lealtad tarjeta_lealtad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarjeta_lealtad
    ADD CONSTRAINT tarjeta_lealtad_pkey PRIMARY KEY (id_tarjeta_lealtad);


--
-- Name: usuarios_cp usuarios_cp_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_cp
    ADD CONSTRAINT usuarios_cp_pk PRIMARY KEY (id_usuario);


--
-- Name: zona zona_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zona
    ADD CONSTRAINT zona_pkey PRIMARY KEY (id_zona);


--
-- Name: administrador_id_usuario_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX administrador_id_usuario_key ON public.administrador USING btree (id_usuario);


--
-- Name: cliente_id_usuario_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cliente_id_usuario_key ON public.cliente USING btree (id_usuario);


--
-- Name: tarjeta_lealtad_id_cliente_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tarjeta_lealtad_id_cliente_key ON public.tarjeta_lealtad USING btree (id_cliente);


--
-- Name: usuarios_cp_unique_correo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_cp_unique_correo ON public.usuarios_cp USING btree (correo);


--
-- Name: administrador fk_administrador_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrador
    ADD CONSTRAINT fk_administrador_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios_cp(id_usuario);


--
-- Name: avisos fk_avisos_administrador; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avisos
    ADD CONSTRAINT fk_avisos_administrador FOREIGN KEY (id_admin) REFERENCES public.administrador(id_admin);


--
-- Name: bitacora fk_bitacora_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT fk_bitacora_usuario FOREIGN KEY (app_user_id) REFERENCES public.usuarios_cp(id_usuario);


--
-- Name: cliente fk_cliente_ruta; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT fk_cliente_ruta FOREIGN KEY (id_ruta) REFERENCES public.ruta(id_ruta);


--
-- Name: cliente fk_cliente_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios_cp(id_usuario);


--
-- Name: faq fk_faq_compospet; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faq
    ADD CONSTRAINT fk_faq_compospet FOREIGN KEY (id_cp) REFERENCES public.compospet(id_cp);


--
-- Name: metricas fk_metricas_compospet; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas
    ADD CONSTRAINT fk_metricas_compospet FOREIGN KEY (id_cp) REFERENCES public.compospet(id_cp);


--
-- Name: nivel_promociones fk_nivel_promociones_nivel; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nivel_promociones
    ADD CONSTRAINT fk_nivel_promociones_nivel FOREIGN KEY (id_nivel) REFERENCES public.niveles(id_nivel);


--
-- Name: nivel_promociones fk_nivel_promociones_promocion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nivel_promociones
    ADD CONSTRAINT fk_nivel_promociones_promocion FOREIGN KEY (id_promociones) REFERENCES public.promociones(id_promociones);


--
-- Name: personas_equipo fk_personas_equipo_compospet; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personas_equipo
    ADD CONSTRAINT fk_personas_equipo_compospet FOREIGN KEY (id_cp) REFERENCES public.compospet(id_cp);


--
-- Name: productos_solicitud fk_productos_solicitud_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_solicitud
    ADD CONSTRAINT fk_productos_solicitud_producto FOREIGN KEY (id_producto) REFERENCES public.productos_extra(id_producto);


--
-- Name: productos_solicitud fk_productos_solicitud_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_solicitud
    ADD CONSTRAINT fk_productos_solicitud_solicitud FOREIGN KEY (id_solicitud) REFERENCES public.solicitudes_recoleccion(id_solicitud);


--
-- Name: roles_permisos fk_roles_permisos_permiso; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT fk_roles_permisos_permiso FOREIGN KEY (id_permiso) REFERENCES public.permisos(id_permiso);


--
-- Name: roles_permisos fk_roles_permisos_rol; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT fk_roles_permisos_rol FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol);


--
-- Name: solicitud_registro fk_solicitud_registro_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_registro
    ADD CONSTRAINT fk_solicitud_registro_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios_cp(id_usuario);


--
-- Name: solicitudes_recoleccion fk_solicitudes_recoleccion_cliente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_recoleccion
    ADD CONSTRAINT fk_solicitudes_recoleccion_cliente FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente);


--
-- Name: solicitudes_recoleccion fk_solicitudes_recoleccion_pago; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_recoleccion
    ADD CONSTRAINT fk_solicitudes_recoleccion_pago FOREIGN KEY (id_pago) REFERENCES public.formas_pago(id_pago);


--
-- Name: tarjeta_lealtad fk_tarjeta_lealtad_cliente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarjeta_lealtad
    ADD CONSTRAINT fk_tarjeta_lealtad_cliente FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente);


--
-- Name: tarjeta_lealtad fk_tarjeta_lealtad_nivel; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarjeta_lealtad
    ADD CONSTRAINT fk_tarjeta_lealtad_nivel FOREIGN KEY (id_nivel) REFERENCES public.niveles(id_nivel);


--
-- Name: ruta ruta_zona_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ruta
    ADD CONSTRAINT ruta_zona_fk FOREIGN KEY (id_zona) REFERENCES public.zona(id_zona);


--
-- Name: usuarios_cp usuarios_cp_compospet_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_cp
    ADD CONSTRAINT usuarios_cp_compospet_fk FOREIGN KEY (id_cp) REFERENCES public.compospet(id_cp);


--
-- Name: usuarios_cp usuarios_cp_roles_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_cp
    ADD CONSTRAINT usuarios_cp_roles_fk FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol);


--
-- PostgreSQL database dump complete
--

