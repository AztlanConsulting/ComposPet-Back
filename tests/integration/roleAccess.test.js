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
const TEST_CLIENT_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();
const TEST_ROUTE_ID = 131;

const TEST_ADMIN_EMAIL = "admin.rbac@compospet.com";
const TEST_CLIENT_EMAIL = "cliente.rbac@compospet.com";

const ENDPOINT = "/api/cliente/obtener-id-cliente";

// ======================
// AUTH
// ======================

const createAdminToken = () => {
    return generateAccessToken({
        id_usuario: TEST_ADMIN_USER_ID,
        correo: TEST_ADMIN_EMAIL,
        id_rol: TEST_ADMIN_ROLE_ID,
        role: "Administrador",
    });
};

const createClientToken = () => {
    return generateAccessToken({
        id_usuario: TEST_CLIENT_USER_ID,
        correo: TEST_CLIENT_EMAIL,
        id_rol: TEST_CLIENT_ROLE_ID,
        role: "Cliente",
    });
};

const createInvalidToken = () => "Bearer token.invalido.firmado";

const jwt = require("jsonwebtoken");

const createExpiredToken = () => {
    return jwt.sign(
        {
            id_usuario: TEST_ADMIN_USER_ID,
            correo: TEST_ADMIN_EMAIL,
            id_rol: TEST_ADMIN_ROLE_ID,
            role: "Administrador",
        },
        process.env.JWT_SECRET,
        { expiresIn: "0s" }
    );
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
            nombre: "Administrador",
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
            apellido: "RBAC",
            correo: TEST_ADMIN_EMAIL,
            contrasena: "hash",
            estatus: true,
            telefono: "4420000001",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_CLIENT_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_CLIENT_ROLE_ID,
            nombre: "Cliente",
            apellido: "RBAC",
            correo: TEST_CLIENT_EMAIL,
            contrasena: "hash",
            estatus: true,
            telefono: "4420000002",
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

    await prisma.cliente.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_CLIENT_USER_ID,
            id_ruta: TEST_ROUTE_ID,
        },
    });
};

const cleanDb = async () => {
    await prisma.cliente.deleteMany({
        where: { id_cliente: TEST_CLIENT_ID },
    });

    await prisma.ruta.deleteMany({
        where: { id_ruta: TEST_ROUTE_ID },
    });

    await prisma.usuarios_cp.deleteMany({
        where: {
            id_usuario: { in: [TEST_ADMIN_USER_ID, TEST_CLIENT_USER_ID] },
        },
    });

    await prisma.roles.deleteMany({
        where: {
            id_rol: { in: [TEST_ADMIN_ROLE_ID, TEST_CLIENT_ROLE_ID] },
        },
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

describe("RBAC — POST /obtener-id-cliente", () => {

    it("permite acceso a usuario con rol Administrador", async () => {
        const token = createAdminToken();

        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({ userId: TEST_CLIENT_USER_ID });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("permite acceso a usuario con rol Cliente", async () => {
        const token = createClientToken();

        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({ userId: TEST_CLIENT_USER_ID });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("deniega acceso cuando no se envía token", async () => {
        const res = await request(app)
            .post(ENDPOINT)
            .send({ userId: TEST_CLIENT_USER_ID });

        expect(res.status).toBe(401);
    });

    it("deniega acceso cuando el token es inválido", async () => {
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", createInvalidToken())
            .send({ userId: TEST_CLIENT_USER_ID });

        expect(res.status).toBe(401);
    });

    it("deniega acceso cuando el token está expirado", async () => {
        const token = createExpiredToken();

        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({ userId: TEST_CLIENT_USER_ID });

        expect(res.status).toBe(401);
    });
});