const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../../app");
const prisma = require("../../config/prisma");
const { generateAccessToken } = require("../../utils/jwt.utils");

// ======================
// CONSTANTES
// ======================

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();

const TEST_EMAIL = "cliente_info@test.com";
const TEST_RUTA_ID = 10;

const ENDPOINT = "/api/cliente/informacion";    

const UPDATE_ENDPOINT = "/api/admin/actualizar-cliente";

// ======================
// AUTH
// ======================

const createAuthToken = () => {
    return generateAccessToken({
        id_usuario: TEST_USER_ID,
        correo: TEST_EMAIL,
        id_rol: TEST_ROLE_ID,
        role: "Administrador",
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
            nombre: "cliente",
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: "Juan",
            apellido: "M",
            correo: TEST_EMAIL,
            contrasena: "hash",
            estatus: true,
            telefono: "4423486456",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.ruta.create({
        data: {
            id_ruta: TEST_RUTA_ID,
            dia_ruta: "Lunes",
            turno_ruta: "1",
        },
    });

    await prisma.cliente.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_USER_ID,
            id_ruta: TEST_RUTA_ID,
            mascotas: "1 perro",
            familia: "3 adultos y 1 niño",
            direccion: "Dirección test",
            notas: "Notas test",
            fecha_entrada: new Date(),
            orden_horario: 1,
            tipo_precio: 'normal',
        },
    });

    await prisma.saldo.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            saldo: 150,
        },
    });

    await prisma.solicitudes_recoleccion.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            cubetas_recolectadas: 1,
            cubetas_entregadas: 1,
            total_a_pagar: 0,
            total_pagado: 0,
            fecha: new Date("2026-04-28"),
            quiere_recoleccion: true,
            quiere_productos_extra: false,
        },
    });
};

const cleanDb = async () => {
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
};

// ======================
// CICLO DE VIDA
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

describe("Integración - Client - getClientsInfo", () => {

    it("retorna 200 y lista de clientes correctamente formateada", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .get(ENDPOINT)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Lista obtenida exitosamente");

        expect(Array.isArray(res.body.clientList)).toBe(true);
        expect(res.body.clientList.length).toBeGreaterThan(0);

        const client = res.body.clientList.find(
            c => c.clientId === TEST_CLIENT_ID
        );

        expect(client).toBeDefined();

        expect(client).toMatchObject({
            clientId: TEST_CLIENT_ID,
            pets: "1 perro",
            family: "3 adultos y 1 niño",
            address: "Dirección test",
            notes: "Notas test",
            name: "Juan M",
            cellphone: "4423486456",
            status: true,
            route: "Lunes",
            balance: 150,
            order: 1,
        });

        expect(client.lastRequest).toBe("04-28-2026");
    });

    it("retorna lista vacía si no hay clientes", async () => {
        const token = createAuthToken();

        await prisma.solicitudes_recoleccion.deleteMany({
            where: {id_cliente: TEST_CLIENT_ID},
        });
        await prisma.saldo.deleteMany({
            where: {id_cliente: TEST_CLIENT_ID},
        });
        await prisma.cliente.deleteMany({
            where: {id_cliente: TEST_CLIENT_ID},
        });

        const res = await request(app)
            .get(ENDPOINT)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const client = res.body.clientList.find(
            c => c.clientId === TEST_CLIENT_ID
        );

        expect(client).toBeUndefined();
    });

});

describe("Integración - Admin - updateClient", () => {

    it("retorna 200 al actualizar todos los campos correctamente", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(UPDATE_ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                clientObject: {
                    clientId: TEST_CLIENT_ID,
                    userId: TEST_USER_ID,
                    cellphone: "4421234567",
                    status: true,
                    notes: "Nota actualizada",
                    address: "Dirección actualizada 456",
                    pets: "2 gatos",
                    family: "2 adultos",
                    routeId: TEST_RUTA_ID,
                    balance: 300,
                    order: 1,
                    priceType: 'normal',
                },
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const usuario = await prisma.usuarios_cp.findUnique({
            where: { id_usuario: TEST_USER_ID },
        });
        expect(usuario.telefono).toBe("4421234567");

        const cliente = await prisma.cliente.findUnique({
            where: { id_cliente: TEST_CLIENT_ID },
        });
        expect(cliente.notas).toBe("Nota actualizada");
        expect(cliente.direccion).toBe("Dirección actualizada 456");
        expect(cliente.mascotas).toBe("2 gatos");
        expect(cliente.familia).toBe("2 adultos");
        expect(cliente.tipo_precio).toBe("normal");

        const saldo = await prisma.saldo.findUnique({
            where: { id_cliente: TEST_CLIENT_ID },
        });
        expect(saldo.saldo).toBe(300);
    });

    it("retorna 200 al actualizar solo el saldo", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(UPDATE_ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                clientObject: {
                    clientId: TEST_CLIENT_ID,
                    userId: TEST_USER_ID,
                    balance: 999,
                    priceType: 'normal',
                },
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const saldo = await prisma.saldo.findUnique({
            where: { id_cliente: TEST_CLIENT_ID },
        });
        expect(saldo.saldo).toBe(999);

        const usuario = await prisma.usuarios_cp.findUnique({
            where: { id_usuario: TEST_USER_ID },
        });
        expect(usuario.telefono).toBe("4423486456");
    });

    it("retorna 200 al actualizar solo el teléfono", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(UPDATE_ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                clientObject: {
                    clientId: TEST_CLIENT_ID,
                    userId: TEST_USER_ID,
                    cellphone: "4429999999",
                    priceType: 'normal',
                },
            });

        expect(res.status).toBe(200);

        const usuario = await prisma.usuarios_cp.findUnique({
            where: { id_usuario: TEST_USER_ID },
        });
        expect(usuario.telefono).toBe("4429999999");
    });

    it("retorna 401 sin token de autenticación", async () => {
        const res = await request(app)
            .post(UPDATE_ENDPOINT)
            .send({
                clientObject: {
                    clientId: TEST_CLIENT_ID,
                    userId: TEST_USER_ID,
                    balance: 100,
                    priceType: 'normal',
                },
            });

        expect(res.status).toBe(401);
    });

    it("retorna 401 con token inválido", async () => {
        const res = await request(app)
            .post(UPDATE_ENDPOINT)
            .set("Authorization", "Bearer token_invalido")
            .send({
                clientObject: {
                    clientId: TEST_CLIENT_ID,
                    userId: TEST_USER_ID,
                    balance: 100,
                    priceType: 'normal',
                },
            });

        expect(res.status).toBe(401);
    });

});

describe("Integración - Admin - getRoutes", () => {

    it("retorna 200 con la lista de rutas", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .get(UPDATE_ENDPOINT)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.routes)).toBe(true);

        const ruta = res.body.routes.find(r => r.id_ruta === TEST_RUTA_ID);
        expect(ruta).toBeDefined();
        expect(ruta.dia_ruta).toBe("Lunes");
    });

    it("retorna 401 sin token", async () => {
        const res = await request(app).get(UPDATE_ENDPOINT);

        expect(res.status).toBe(401);
    });

});