const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../../app");
const prisma = require("../../config/prisma");

const { generateAccessToken } = require("../../utils/jwt.utils");

// ======================
// CONSTANTES
// ======================

const TEST_CP_ID = randomUUID();
const TEST_ADMIN_ROLE_ID = randomUUID();
const TEST_CLIENT_ROLE_ID = randomUUID();
const TEST_ADMIN_USER_ID = randomUUID();
const TEST_ADMIN_EMAIL = "admin.test@compospet.com";
const TEST_CLIENT_EMAIL = "newclient.test@compospet.com";
const TEST_ROUTE_ID = 101;

const ENDPOINT_GET = "/api/admin/registrar-cliente";
const ENDPOINT_POST = "/api/admin/registrar-cliente"; 

// ======================
// AUTH
// ======================

const createAuthToken = () => {
    return generateAccessToken({
        id_usuario: TEST_ADMIN_USER_ID,
        correo: TEST_ADMIN_EMAIL,
        id_rol: TEST_ADMIN_ROLE_ID,
        role: "admin",
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
        where: { id_rol: TEST_ADMIN_ROLE_ID },
        update: {},
        create: {
            id_rol: TEST_ADMIN_ROLE_ID,
            nombre: "admin",
        },
    });

    await prisma.roles.upsert({
        where: { id_rol: TEST_CLIENT_ROLE_ID },
        update: {},
        create: {
            id_rol: TEST_CLIENT_ROLE_ID,
            nombre: "Cliente",
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_ADMIN_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ADMIN_ROLE_ID,
            nombre: "Admin",
            apellido: "Test",
            correo: TEST_ADMIN_EMAIL,
            contrasena: "hash",
            estatus: true,
            telefono: "4420000000",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.ruta.upsert({
        where: { id_ruta: TEST_ROUTE_ID },
        update: {},
        create: {
            id_ruta: TEST_ROUTE_ID,
            dia_ruta: "Lunes",
            turno_ruta: "Mañana",
        },
    });
};

const cleanDb = async () => {
    const usersToDelete = await prisma.usuarios_cp.findMany({
        where: { correo: TEST_CLIENT_EMAIL },
        select: { id_usuario: true },
    });

    for (const user of usersToDelete) {
        const client = await prisma.cliente.findUnique({
            where: { id_usuario: user.id_usuario },
        });

        if (client) {
            await prisma.saldo.deleteMany({
                where: { id_cliente: client.id_cliente },
            });
            await prisma.cliente.delete({
                where: { id_cliente: client.id_cliente },
            });
        }

        await prisma.usuarios_cp.delete({
            where: { id_usuario: user.id_usuario },
        });
    }

    await prisma.usuarios_cp.deleteMany({
        where: { id_usuario: TEST_ADMIN_USER_ID },
    });

    await prisma.ruta.deleteMany({
        where: { id_ruta: TEST_ROUTE_ID },
    });

    await prisma.roles.deleteMany({
        where: { id_rol: { in: [TEST_ADMIN_ROLE_ID, TEST_CLIENT_ROLE_ID] } },
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

describe("GET /registrar-cliente", () => {

    it("retorna los días de ruta correctamente", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .get(ENDPOINT_GET)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.daysOfRoutes)).toBe(true);
        expect(res.body.data.daysOfRoutes.length).toBeGreaterThan(0);
    });
});

describe("POST /registrar-cliente", () => {

    it("registra un cliente exitosamente", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Juan",
                lastName: "Pérez García",
                phone: "4421234567",
                email: TEST_CLIENT_EMAIL,
                address: "Calle Independencia 123",
                id_ruta: TEST_ROUTE_ID,
                pets: "Firulais",
                family: "Familia Pérez",
                notes: "Cliente de prueba",
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.userId).toBeDefined();
        expect(res.body.data.clientId).toBeDefined();
        expect(res.body.data.email).toBe(TEST_CLIENT_EMAIL);
        expect(res.body.data.credit).toBe(0);
    });

    it("retorna 409 si el correo ya está registrado", async () => {
        const token = createAuthToken();

        await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Juan",
                lastName: "Pérez",
                phone: "4421234567",
                email: TEST_CLIENT_EMAIL,
                address: "Calle Test 123",
                id_ruta: TEST_ROUTE_ID,
            });

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Pedro",
                lastName: "López",
                phone: "4429876543",
                email: TEST_CLIENT_EMAIL,
                address: "Calle Otra 456",
                id_ruta: TEST_ROUTE_ID,
            });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Ya existe un usuario registrado con este correo.");
    });

    it("retorna 400 si faltan datos requeridos", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Juan",
                phone: "4421234567",
                email: TEST_CLIENT_EMAIL,
                address: "Calle Test 123",
                id_ruta: TEST_ROUTE_ID,
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Faltan datos requeridos para registrar al cliente.");
    });

    it("registra cliente sin campos opcionales", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Ana",
                lastName: "García",
                phone: "4421234567",
                email: TEST_CLIENT_EMAIL,
                address: "Calle Sin Opcionales 1",
                id_ruta: TEST_ROUTE_ID,
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.userId).toBeDefined();
    });
});