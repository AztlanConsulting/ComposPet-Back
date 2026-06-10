const request = require('supertest');
const { randomUUID } = require('crypto');

const app = require('../../app');
const prisma = require('../../config/prisma');

const { generateAccessToken } = require('../../utils/jwt.utils');

const TEST_CP_ID          = randomUUID();
const TEST_ROLE_ID        = randomUUID();
const TEST_USER_ID        = randomUUID();
const TEST_CLIENT_ID      = randomUUID();
const TEST_REQUEST_ID     = randomUUID();
const TEST_RUTA_ID        = 1;
const TEST_PRODUCTO_EXTRA = 100;

const TEST_EMAIL = 'admin@test.com';

const ENDPOINT_UPDATE = '/api/rutas/informacion-editar';


const createAuthToken = () =>
    generateAccessToken({
        id_usuario: TEST_USER_ID,
        correo:     TEST_EMAIL,
        id_rol:     TEST_ROLE_ID,
        role:       'Administrador',
    });

const createBaseData = async () => {

    await prisma.productos_extra.upsert({
        where: { id_producto: TEST_PRODUCTO_EXTRA },
        update: {},
        create: {
            id_producto: TEST_PRODUCTO_EXTRA,
            nombre: 'Producto Test Extra',
            precio: 50,
            descripcion: 'Producto extra de prueba',
            cantidad: 100,
            imagen_url: 'uploads/products/default-product.png',
            orden: 1,
            estatus: true,
            deleted: false,
            color: '#169B49',
        },
    });

    await prisma.compospet.upsert({
        where:  { id_cp: TEST_CP_ID },
        update: {},
        create: { id_cp: TEST_CP_ID },
    });

    await prisma.roles.upsert({
        where:  { id_rol: TEST_ROLE_ID },
        update: {},
        create: { id_rol: TEST_ROLE_ID, nombre: 'administrador' },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario:            TEST_USER_ID,
            id_cp:                 TEST_CP_ID,
            id_rol:                TEST_ROLE_ID,
            nombre:                'Juan Manuel',
            apellido:              'M',
            correo:                TEST_EMAIL,
            contrasena:            'hash',
            estatus:               true,
            telefono:              '4422222222',
            primer_inicio_sesion:  false,
            intentos_fallidos:     0,
        },
    });

    const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const todayName  = diasSemana[new Date().getDay()];

    await prisma.ruta.create({
        data: { id_ruta: TEST_RUTA_ID, dia_ruta: todayName, turno_ruta: '1' },
    });

    await prisma.cliente.create({
        data: {
            id_cliente:    TEST_CLIENT_ID,
            id_usuario:    TEST_USER_ID,
            id_ruta:       TEST_RUTA_ID,
            mascotas:      '2 perros',
            familia:       '2 adultos',
            direccion:     'Dirección test',
            notas:         'Código: 123',
            fecha_entrada: new Date(),
            tipo_precio: 'normal',
        },
    });

    await prisma.formas_pago.upsert({
        where:  { id_pago: 1 },
        update: {},
        create: { id_pago: 1, tipo: 'Efectivo' },
    });

    await prisma.solicitudes_recoleccion.create({
        data: {
            id_solicitud:           TEST_REQUEST_ID,
            id_cliente:             TEST_CLIENT_ID,
            cubetas_recolectadas:   2,
            cubetas_entregadas:     3,
            total_a_pagar:          150,
            total_pagado:           100,
            fecha:                  new Date(),
            notas:                  'Tocar timbre',
            quiere_recoleccion:     true,
            quiere_productos_extra: false,
            id_pago:                null,
            estatus:                false,
        },
    });

    await prisma.saldo.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            saldo: 500,
        }
    })
};

const cleanDb = async () => {
    await prisma.productos_solicitud.deleteMany({
        where: { solicitudes_recoleccion: { id_cliente: TEST_CLIENT_ID } },
    });

    await prisma.solicitudes_recoleccion.deleteMany({
        where: { id_cliente: TEST_CLIENT_ID },
    });

    await prisma.saldo.deleteMany({
        where: { id_cliente: TEST_CLIENT_ID },
    });

    await prisma.cliente.deleteMany({
        where: { id_cliente: TEST_CLIENT_ID },
    });

    await prisma.usuarios_cp.deleteMany({
        where: { id_usuario: TEST_USER_ID },
    });

    await prisma.ruta.deleteMany({
        where: { id_ruta: TEST_RUTA_ID },
    });

    await prisma.roles.deleteMany({
        where: { id_rol: TEST_ROLE_ID },
    });

    await prisma.compospet.deleteMany({
        where: { id_cp: TEST_CP_ID },
    });

    await prisma.productos_extra.deleteMany({
        where: {
            id_producto: TEST_PRODUCTO_EXTRA,
        },
    });
};

beforeAll(async () => { await cleanDb(); });
beforeEach(async () => { await cleanDb(); await createBaseData(); });
afterEach(async ()  => { await cleanDb(); });
afterAll(async ()   => { await cleanDb(); await prisma.$disconnect(); });


describe('Integración - Ruta - getEditTableInfo', () => {

    it('debe retornar 200 con métodos de pago y productos extra', async () => {
        const token = createAuthToken();

        const res = await request(app)
            .get(ENDPOINT_UPDATE)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        expect(Array.isArray(res.body.payMethods)).toBe(true);
        expect(Array.isArray(res.body.extraProducts)).toBe(true);

        if (res.body.payMethods.length > 0) {
            expect(res.body.payMethods[0]).toHaveProperty('id_pago');
            expect(res.body.payMethods[0]).toHaveProperty('tipo');
        }

        if (res.body.extraProducts.length > 0) {
            expect(res.body.extraProducts[0]).toHaveProperty('id_producto');
            expect(res.body.extraProducts[0]).toHaveProperty('nombre');
            expect(res.body.extraProducts[0]).toHaveProperty('precio');
        }
    });

    it('debe retornar 401 sin token', async () => {
        const res = await request(app).get(ENDPOINT_UPDATE);
        expect(res.status).toBe(401);
    });

    it('debe retornar 401 con token inválido', async () => {
        const res = await request(app)
            .get(ENDPOINT_UPDATE)
            .set('Authorization', 'Bearer token_invalido');

        expect(res.status).toBe(401);
    });
});

describe('Integración - Ruta - updateRequest', () => {

    const basePayload = () => ({
        data: {
            requestId:            TEST_REQUEST_ID,
            collectedBuckets:     3,
            deliveredBuckets:     2,
            notes:                'Nueva nota',
            paymentId:            1,
            totalPaid:            '160',
            schedule:             '09:00',
            wantsCollection:      true,
            wantsExtraProducts:   false,
            extraProductsDetails: [],
            extraProductsArray:   {},
        },
    });

    it('debe retornar 200 y actualizar correctamente la solicitud', async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_UPDATE)
            .set('Authorization', `Bearer ${token}`)
            .send(basePayload());

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const updated = await prisma.solicitudes_recoleccion.findUnique({
            where: { id_solicitud: TEST_REQUEST_ID },
        });

        expect(updated.cubetas_recolectadas).toBe(3);
        expect(updated.cubetas_entregadas).toBe(2);
        expect(updated.notas).toBe('Nueva nota');
        expect(updated.id_pago).toBe(1);
    });

    it('debe actualizar quiere_recoleccion a false cuando ambas cubetas son 0', async () => {
        const token = createAuthToken();

        const payload = basePayload();
        payload.data.collectedBuckets   = 0;
        payload.data.deliveredBuckets   = 0;
        payload.data.wantsCollection    = false;

        const res = await request(app)
            .post(ENDPOINT_UPDATE)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(200);

        const updated = await prisma.solicitudes_recoleccion.findUnique({
            where: { id_solicitud: TEST_REQUEST_ID },
        });

        expect(updated.quiere_recoleccion).toBe(false);
    });

    it('debe actualizar quiere_recoleccion a true cuando hay cubetas', async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_UPDATE)
            .set('Authorization', `Bearer ${token}`)
            .send(basePayload());

        expect(res.status).toBe(200);

        const updated = await prisma.solicitudes_recoleccion.findUnique({
            where: { id_solicitud: TEST_REQUEST_ID },
        });

        expect(updated.quiere_recoleccion).toBe(true);
    });

    it('debe guardar los productos extra enviados y ajustar inventario', async () => {
        const token = createAuthToken();

        const product = await prisma.productos_extra.findFirst({
            where: { estatus: true },
        });

        if (!product) {
            console.warn('No hay productos extra activos, omitiendo test de productos.');
            return;
        }

        const inventoryBefore = product.cantidad;

        const payload = basePayload();
        payload.data.extraProductsDetails = [{ id: product.id_producto }];
        payload.data.wantsExtraProducts   = false;
        payload.data.extraProductsArray   = { [product.id_producto]: 1 };

        const res = await request(app)
            .post(ENDPOINT_UPDATE)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(200);

        const savedProducts = await prisma.productos_solicitud.findMany({
            where: { id_solicitud: TEST_REQUEST_ID },
        });

        expect(savedProducts.length).toBe(1);
        expect(savedProducts[0].id_producto).toBe(product.id_producto);
        expect(savedProducts[0].cantidad).toBe(1);

        const productAfter = await prisma.productos_extra.findUnique({
            where: { id_producto: product.id_producto },
        });

        expect(productAfter.cantidad).toBe(inventoryBefore - 1);
    });

    it('debe retornar 401 sin token', async () => {
        const res = await request(app)
            .post(ENDPOINT_UPDATE)
            .send(basePayload());

        expect(res.status).toBe(401);
    });

    it('debe retornar 401 con token inválido', async () => {
        const res = await request(app)
            .post(ENDPOINT_UPDATE)
            .set('Authorization', 'Bearer token_invalido')
            .send(basePayload());

        expect(res.status).toBe(401);
    });

});