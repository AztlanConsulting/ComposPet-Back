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