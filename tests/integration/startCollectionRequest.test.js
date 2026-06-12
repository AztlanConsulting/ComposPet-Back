const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../../app");
const prisma = require("../../config/prisma");

const { generateAccessToken } = require("../../utils/jwt.utils");

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();
const TEST_EMAIL = "cliente.test@compospet.com";
const ENDPOINT = "/api/cliente/obtener-cliente-y-ruta";
const TEST_RUTA_ID = 2255;

const createAuthToken = () => {
    return generateAccessToken({
        id_usuario: TEST_USER_ID,
        correo: TEST_EMAIL,
        id_rol: TEST_ROLE_ID,
        role: "Cliente",
    });
};

const createTestUserAndClient = async () => {
    await prisma.compospet.upsert({
        where: {
            id_cp: TEST_CP_ID,
        },
        update: {},
        create: {
            id_cp: TEST_CP_ID,
        },
    });

    await prisma.roles.upsert({
        where: {
            id_rol: TEST_ROLE_ID,
        },
        update: {},
        create: {
            id_rol: TEST_ROLE_ID,
            nombre: "test-role-cliente-ruta",
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: "Cliente",
            apellido: "Ruta Test",
            correo: TEST_EMAIL,
            contrasena: "hash-test",
            estatus: true,
            telefono: "77100000",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.ruta.upsert({
        where: {
            id_ruta: TEST_RUTA_ID,
        },
        update: {},
        create: {
            id_ruta: TEST_RUTA_ID,
            dia_ruta: "Miércoles",
            turno_ruta: "Matutino",
        },
    });

    await prisma.cliente.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_USER_ID,
            id_ruta: TEST_RUTA_ID,
            mascotas: "1 perro",
            familia: "3",
            direccion: "Dirección de prueba",
            orden_horario: 1,
            notas: "Cliente de prueba",
            fecha_entrada: new Date(),
        },
    });
};

const cleanDb = async () => {
    await prisma.cliente.deleteMany({
        where: {
            id_cliente: TEST_CLIENT_ID,
        },
    });

    await prisma.usuarios_cp.deleteMany({
        where: {
            id_usuario: TEST_USER_ID,
        },
    });

    await prisma.ruta.deleteMany({
        where: {
            id_ruta: TEST_RUTA_ID,
        },
    });

    await prisma.roles.deleteMany({
        where: {
            id_rol: TEST_ROLE_ID,
        },
    });

    await prisma.compospet.deleteMany({
        where: {
            id_cp: TEST_CP_ID,
        },
    });
};

beforeAll(async () => {
    await cleanDb();
});

beforeEach(async () => {
    await cleanDb();
    await createTestUserAndClient();
});

afterEach(async () => {
    await cleanDb();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

describe("Client Route Integration", () => {
    it("retorna 400 si no se envía userId", async () => {
        // Arrange
        const token = createAuthToken();

        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({});

        // Afirmar
        expect(res.status).toBe(400);

        expect(res.body).toEqual({
            success: false,
            message: "Falta el id del usuario para obtener la información del cliente.",
        });
    });

    it("retorna 200 con el cliente, su nombre y su ruta asignada", async () => {
        // Arrange
        const token = createAuthToken();

        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                userId: TEST_USER_ID,
            });

        // Afirmar
        expect(res.status).toBe(200);

        expect(res.body).toEqual({
            success: true,
            message: "Información del cliente obtenida exitosamente.",
            data: {
                clientId: TEST_CLIENT_ID,
                routeId: TEST_RUTA_ID,
                name: "Cliente",
                routeDay: "Miércoles",
            },
        });
    });

    it("retorna 404 si no existe cliente asociado al usuario", async () => {
        // Arrange
        const token = createAuthToken();
        const nonUserId = randomUUID();

        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                userId: nonUserId,
            });

        // Afirmar
        expect(res.status).toBe(404);

        expect(res.body).toEqual({
            success: false,
            message: "No se encontró la información del cliente asociado a este usuario.",
        });
    });
});