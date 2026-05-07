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

// ======================
// AUTH
// ======================

const createAuthToken = () => {
    return generateAccessToken({
        id_usuario: TEST_USER_ID,
        correo: TEST_EMAIL,
        id_rol: TEST_ROLE_ID,
        role: "cliente",
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
            route: "Lunes 1",
            balance: 150,
        });

        expect(client.lastRequest).toBe("2026-04-28");
    });

    it("retorna lista vacía si no hay clientes", async () => {
        const token = createAuthToken();

        await prisma.solicitudes_recoleccion.deleteMany({});
        await prisma.saldo.deleteMany({});
        await prisma.cliente.deleteMany({});

        const res = await request(app)
            .get(ENDPOINT)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.clientList).toEqual([]);
    });

});