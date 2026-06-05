const request = require('supertest');
const { randomUUID } = require('crypto');

const app = require('../../app');
const prisma = require('../../config/prisma');

const { generateAccessToken } = require('../../utils/jwt.utils');

// ======================
// CONSTANTES
// ======================

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();

const TEST_EMAIL = 'inventory@test.com';

const TEST_PRODUCT_ID_1 = 9001;
const TEST_PRODUCT_ID_2 = 9002;

const ENDPOINT = '/api/inventario/obtener-inventario';

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
        create: { id_cp: TEST_CP_ID },
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
            nombre: 'Usuario',
            apellido: 'Inventario',
            correo: TEST_EMAIL,
            contrasena: 'hash',
            estatus: true,
            telefono: '4422222222',
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.productos_extra.createMany({
        data: [
            {
                id_producto: TEST_PRODUCT_ID_1,
                nombre: 'Croquetas',
                precio: 250,
                descripcion: 'Alimento para perro',
                cantidad: 10,
                imagen_url: 'croquetas.png',
                color: 'verde',
                estatus: true,
                deleted: false,
                orden: 1,
            },
            {
                id_producto: TEST_PRODUCT_ID_2,
                nombre: 'Juguete',
                precio: 80,
                descripcion: 'Juguete para mascota',
                cantidad: 5,
                imagen_url: 'juguete.png',
                color: 'azul',
                estatus: false,
                deleted: false,
                orden: 2,
            },
        ],
    });
};

const cleanDb = async () => {
    await prisma.productos_extra.deleteMany({
        where: {
            id_producto: {
                in: [TEST_PRODUCT_ID_1, TEST_PRODUCT_ID_2],
            },
        },
    });

    await prisma.usuarios_cp.deleteMany({
        where: { id_usuario: TEST_USER_ID },
    });

    await prisma.roles.deleteMany({
        where: { id_rol: TEST_ROLE_ID },
    });

    await prisma.compospet.deleteMany({
        where: { id_cp: TEST_CP_ID },
    });
};

// ======================
// SETUP
// ======================

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

describe('Integración - Inventario - getInventory', () => {
    it('debe regresar 200 y la lista de productos del inventario', async () => {
        const token = createAuthToken();

        const res = await request(app)
            .get(ENDPOINT)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Inventario obtenido exitosamente.');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(2);

        expect(res.body.data[0]).toMatchObject({
            productId: TEST_PRODUCT_ID_1,
            name: 'Croquetas',
            price: 250,
            description: 'Alimento para perro',
            quantity: 10,
            color: 'verde',
            status: true,
            imageUrl: 'croquetas.png',
        });
    });

    it('debe regresar productos ordenados por el campo orden ascendente', async () => {
        const token = createAuthToken();

        const res = await request(app)
            .get(ENDPOINT)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data[0].productId).toBe(TEST_PRODUCT_ID_1);
        expect(res.body.data[1].productId).toBe(TEST_PRODUCT_ID_2);
    });

    it('debe incluir productos inactivos si no están eliminados', async () => {
        const token = createAuthToken();

        const res = await request(app)
            .get(ENDPOINT)
            .set('Authorization', `Bearer ${token}`);

        const inactiveProduct = res.body.data.find(
            product => product.productId === TEST_PRODUCT_ID_2
        );

        expect(inactiveProduct).toBeDefined();
        expect(inactiveProduct.status).toBe(false);
    });

    it('retorna lista vacía si no existen productos activos/no eliminados', async () => {
        const token = createAuthToken();

        await prisma.productos_extra.deleteMany({
            where: {
                id_producto: {
                    in: [TEST_PRODUCT_ID_1, TEST_PRODUCT_ID_2],
                },
            },
        });

        const res = await request(app)
            .get(ENDPOINT)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
    });

    it('no debe regresar productos eliminados lógicamente', async () => {
        const token = createAuthToken();

        await prisma.productos_extra.update({
            where: { id_producto: TEST_PRODUCT_ID_1 },
            data: { deleted: true },
        });

        const res = await request(app)
            .get(ENDPOINT)
            .set('Authorization', `Bearer ${token}`);

        const deletedProduct = res.body.data.find(
            product => product.productId === TEST_PRODUCT_ID_1
        );

        expect(res.status).toBe(200);
        expect(deletedProduct).toBeUndefined();
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