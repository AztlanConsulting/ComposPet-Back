const request = require('supertest');
const { randomUUID } = require('crypto');

const app = require('../../app');
const prisma = require('../../config/prisma');

const { generateAccessToken } = require('../../utils/jwt.utils');

// --- Constantes ----
const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();
const TEST_RUTA_ID = 999;

const TEST_EMAIL = 'routesTable@test.com';
const ENDPOINT = '/api/rutas/informacion';

// ======================
// AUTH
// ======================

const createAuthToken = () => {
    return generateAccessToken({
        id_usuario: TEST_USER_ID,
        correo: TEST_EMAIL,
        id_rol: TEST_ROLE_ID,
        role: 'Administrador',
    });
};

// ======================
// HELPERS
// ======================

const createBaseData = async () => {
    await prisma.compospet.upsert({
        where: { id_cp: TEST_CP_ID },
        update: {},
        create: { id_cp: TEST_CP_ID},
    });

    await prisma.roles.upsert({
        where: { id_rol: TEST_ROLE_ID },
        update: {},
        create: {
            id_rol: TEST_ROLE_ID,
            nombre: 'administrador',
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: 'Alejandra',
            apellido: 'Arredondo',
            correo: TEST_EMAIL,
            contrasena: 'hash',
            estatus: true,
            telefono: '4422222222',
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    const getTodayName = () => {
        const diasSemana = [
            'Domingo',
            'Lunes',
            'Martes',
            'Miércoles',
            'Jueves',
            'Viernes',
            'Sábado',
        ];

        return diasSemana[new Date().getDay()];
    };

    await prisma.ruta.create({
        data:{
            id_ruta: TEST_RUTA_ID,
            dia_ruta: getTodayName(),
            turno_ruta: '1',
        },
    });

    await prisma.cliente.create({
        data:{
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_USER_ID,
            id_ruta: TEST_RUTA_ID,
            mascotas: '3 perros',
            familia: '3 adultos y 1 niño',
            direccion: 'Dirección test',
            notas: 'Notas test',
            fecha_entrada: new Date(),
        },
    });

    await prisma.solicitudes_recoleccion.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            cubetas_recolectadas: 2,
            cubetas_entregadas: 3,
            total_a_pagar: 150,
            total_pagado: 100,
            fecha: new Date(),
            notas: 'Tocar timbre',
            quiere_recoleccion: true,
            quiere_productos_extra: false,
        }
    });
};

const cleanDb = async () => {
    await prisma.productos_solicitud.deleteMany({
        where: {
            solicitudes_recoleccion: {
                id_cliente: TEST_CLIENT_ID,
            },
        },
    });

    await prisma.solicitudes_recoleccion.deleteMany({
        where: { id_cliente: TEST_CLIENT_ID },
    });

    await prisma.cliente.deleteMany({
        where : { id_cliente: TEST_CLIENT_ID },
    });

    await prisma.usuarios_cp.deleteMany({
        where: { id_usuario: TEST_USER_ID },
    });

    await prisma.ruta.deleteMany({
        where : { id_ruta: TEST_RUTA_ID },
    });

    await prisma.roles.deleteMany({
        where: { id_rol: TEST_ROLE_ID },
    });

    await prisma.compospet.deleteMany({
        where: { id_cp: TEST_CP_ID },
    });
};

beforeAll(async () => {
    await cleanDb();
});

beforeEach(async () => {
    await cleanDb();
    await createBaseData();
});

afterEach(async () => {
    await cleanDb();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

// ======================
// TESTS
// ======================


describe("Integración - Ruta - getTableInfo",  () => {

    it('debe regresar 200 y la información de rutas del día actual', async () => {
        const token = createAuthToken();

        const res = await request(app)
            .get(ENDPOINT)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        const route = res.body.data.find(
            item => item.nombre === 'Alejandra Arredondo'
        );

        expect(route).toBeDefined();

        expect(route).toMatchObject({
            nombre: 'Alejandra Arredondo',
            recoleccion: 2,
            entrega: 3,
            productos_extra: ' ',
            forma_pago: ' ',
            total_a_pagar: '150',
            total_pagado: '100',
            notas: 'Tocar timbre',
        });
    });

    it('retorna lista vacía si no hay rutas', async () => {
        const token = createAuthToken();

        await prisma.productos_solicitud.deleteMany({
            where: {
                solicitudes_recoleccion: {
                    id_cliente: TEST_CLIENT_ID,
                },
            },
        });

        await prisma.solicitudes_recoleccion.deleteMany({
            where: { id_cliente: TEST_CLIENT_ID },
        });

        await prisma.cliente.deleteMany({
            where: { id_cliente: TEST_CLIENT_ID },
        });

        const res = await request(app)
            .get(ENDPOINT)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
    });

    it('retorna 401 si no se envía token', async () => {
        const res = await request(app)
            .get(ENDPOINT);

        expect(res.status).toBe(401);
    });

    it('retorna 401 si el token es inválido', async () => {
        const res = await request(app)
            .get(ENDPOINT)
            .set('Authorization', 'Bearer token_invalido');

        expect(res.status).toBe(401);
    });
});

describe('Integración - Ruta - getFilteredRoutesInfo', () => {
    it('debe retornar 200 con datos filtrados por semana y día', async () => {
        const token = createAuthToken();

        const weeksRes = await request(app)
            .get('/api/rutas/semanas')
            .set('Authorization', `Bearer ${token}`);

        expect(weeksRes.status).toBe(200);
        const weeks = weeksRes.body.data;

        const lastIndex = weeks.length - 1;
        const todayName = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()];

        const res = await request(app)
            .get(`/api/rutas/filtrar-informacion?weekIndex=${lastIndex}&dayName=${todayName}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('debe retornar 401 sin token', async () => {
        const res = await request(app)
            .get('/api/rutas/filtrar-informacion?weekIndex=0');

        expect(res.status).toBe(401);
    });

    it('debe retornar 500 si weekIndex está fuera de rango', async () => {
        const token = createAuthToken();

        const res = await request(app)
            .get('/api/rutas/filtrar-informacion?weekIndex=9999')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(500);
    });
});