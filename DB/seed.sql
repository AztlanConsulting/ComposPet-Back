-- =========================
-- 1. Compospet
-- =========================
INSERT INTO public.compospet (id_cp)
VALUES ('11111111-1111-1111-1111-111111111111');

-- =========================
-- 2. Roles
-- =========================
INSERT INTO public.roles (id_rol, nombre)
VALUES 
('22222222-2222-2222-2222-222222222222', 'administrador'),
('33333333-3333-3333-3333-333333333333', 'cliente');

-- =========================
-- 3. Usuarios
-- =========================

-- Admin
INSERT INTO public.usuarios_cp (
    id_usuario,
    id_cp,
    id_rol,
    nombre,
    apellido,
    contrasena,
    correo,
    estatus
)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Admin',
    'Test',
    '$2b$10$LHyTQLIVM7UMZ5LezDO0yexQCve3uwZB4v9gOK0LupYMkuATCFsOK', -- Intento2
    'admin@test.com',
    true
);

-- Usuario Cliente
INSERT INTO public.usuarios_cp (
    id_usuario,
    id_cp,
    id_rol,
    nombre,
    apellido,
    contrasena,
    correo,
    estatus
)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'Cliente',
    'Test',
    '$2b$10$LHyTQLIVM7UMZ5LezDO0yexQCve3uwZB4v9gOK0LupYMkuATCFsOK', -- Intento2
    'cliente@test.com',
    true
);

-- =========================
-- 4. Zona
-- =========================


INSERT INTO public.zona (
    id_zona,
    nombre_zona,
    municipio,
    descripcion,
    estado
    ) VALUES (
    1,
    'Zona Centro',
    'Querétaro',
    'Zona de prueba',
    'Activa'
);

-- =========================
-- 5. Ruta
-- =========================

INSERT INTO public.ruta (
    id_ruta,
    dia_ruta,
    id_zona,
    turno_ruta
    ) VALUES (
    1,
    'Lunes',
    1,
    'Matutino'
);

-- =========================
-- 6. Cliente
-- =========================

INSERT INTO public.cliente (
    id_cliente,
    id_usuario,
    id_ruta,
    mascotas,
    cantidad_familia,
    direccion,
    orden_horario,
    notas,
    fecha_entrada,
    fecha_salida
    ) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    1,
    '2 perros',
    4,
    'Dirección demo',
    1,
    'Sin notas',
    DATE '2026-04-01',
    DATE '2026-12-31'
);

-- =========================
-- 7. Solicitudes de Recolección
-- =========================

INSERT INTO public.solicitudes_recoleccion (
    id_solicitud,
    id_cliente,
    cubetas_entregadas,
    cubetas_recolectadas,
    total_a_pagar,
    total_pagado,
    fecha,
    horario,
    notas,
    quiere_recoleccion,
    quiere_productos_extra,
    id_pago
    ) VALUES
    (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    2,
    1,
    150.50,
    100.00,
    DATE '2026-04-12',
    TIME '09:00:00',
    'Primera solicitud',
    true,
    false,
    NULL
    ),
    (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    3,
    2,
    200.00,
    200.00,
    DATE '2026-04-14',
    TIME '11:30:00',
    'Segunda solicitud',
    true,
    true,
    NULL
    ),
    (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    1,
    1,
    100.00,
    0.00,
    DATE '2026-04-16',
    TIME '15:00:00',
    'Tercera solicitud',
    false,
    true,
    NULL
);

INSERT INTO public.productos_extra
(id_producto, nombre, precio, descripcion, cantidad, imagen_url, estatus, orden)
VALUES
(1, 'Aserrin', 0, 'Pendiente de definir', 0, '/img/products/aserrin.jpg', true, 1),

(2, 'Composta (en cubeta)', 50, 'Cubetita de 4lt adicional', 0, '/img/products/composta_cubeta_4lt.jpg', true, 2),

(3, 'Composta (costal)', 150, 'Cubeta de 19lt adicional', 0, '/img/products/composta_costal_19lt.jpg', true, 3),

(4, 'Hojas Poopis', 55, 'Paquete de hojas Poopis (50 pzas)', 0, '/img/products/hojas_poopis.jpg', true, 4),

(5, 'Arena en pellet Cocopet 5kg', 225, 'Arena en pellet Cocopet 5kg', 0, '/img/products/arena_pellet_cocopet_5kg.jpg', true, 5),

(6, 'Fibra de Coco 15lt', 110, 'Fibra de coco Cocopet 15lt', 0, '/img/products/fibra_coco_15lt.jpg', true, 6),

(7, 'Fibra de Coco 50lt', 300, 'Fibra de coco Cocopet 50lt', 0, '/img/products/fibra_coco_50lt.jpg', true, 7),

(8, 'Servilleta de tela 1 pza', 80, '1 servilleta de tela', 0, '/img/products/servilleta_tela_1pza.jpg', true, 8),

(9, 'Servilletas de tela 4 pzas', 300, 'Paquete de 4 servilletas de tela', 0, '/img/products/servilletas_tela_4pzas.jpg', true, 9),

(10, 'Rascador gato CH', 80, 'Rascador para gato CH', 0, '/img/products/rascador_gato_ch.jpg', true, 10),

(11, 'Rascador gato GDE', 120, 'Rascador para gato GDE', 0, '/img/products/rascador_gato_gde.jpg', true, 11);


-- Paso 1: mover productos_extra a IDs temporales para evitar choques
UPDATE public.productos_extra SET id_producto = 3, orden = 3 WHERE id_producto = -3;
UPDATE public.productos_extra SET id_producto = 4, orden = 4 WHERE id_producto = -4;
UPDATE public.productos_extra SET id_producto = 5, orden = 5 WHERE id_producto = -5;
UPDATE public.productos_extra SET id_producto = 6, orden = 6 WHERE id_producto = -6;
UPDATE public.productos_extra SET id_producto = 7, orden = 7 WHERE id_producto = -7;
UPDATE public.productos_extra SET id_producto = 8, orden = 8 WHERE id_producto = -8;
UPDATE public.productos_extra SET id_producto = 9, orden = 9 WHERE id_producto = -9;
UPDATE public.productos_extra SET id_producto = 10, orden = 10 WHERE id_producto = -10;