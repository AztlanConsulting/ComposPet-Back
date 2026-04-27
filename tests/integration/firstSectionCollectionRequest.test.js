const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../../app");
const prisma = require("../../config/prisma");

const { generateAccessToken } = require("../../utils/jwt.utils");

// Constantes
const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();

const TEST_EMAIL = "cliente@compospet.com";

const TEST_ZONA_ID = 2;
const TEST_RUTA_ID = 2;

const GET_CURRENT_COLLECTION_REQUEST_ENDPOINT = "/api/solicitudes-rec/form02/obtener";
const SAVE_FIRST_SECTION_ENDPOINT = "/api/solicitudes-rec/form02/guardar";

//Helpers
const createAuthToken = () => {
    return generateAccessToken({
        id_usuario: TEST_USER_ID,
        correo: TEST_EMAIL,
        id_rol: TEST_ROLE_ID,
        role: "cliente",
    });
};

const createTestUserAndClient = async () => {
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
            nombre: "test-role-form02",
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: "Cliente",
            apellido: "Form02 Test",
            correo: TEST_EMAIL,
            contrasena: "hash-test",
            estatus: true,
            telefono: "77100000",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.zona.create({
        data: {
            id_zona: TEST_ZONA_ID,
            municipio: "Queretaro",
            descripcion: "Zona de prueba",
            estado: "Queretaro",
        },
    });

    await prisma.ruta.create({
        data: {
            id_ruta: TEST_RUTA_ID,
            id_zona: TEST_ZONA_ID,
            dia_ruta: "Lunes",
            turno_ruta: "Matutino",
        },
    });

    await prisma.cliente.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_USER_ID,
            id_ruta: TEST_RUTA_ID,
            mascotas: "1 perro",
            cantidad_familia: 3,
            direccion: "Dirección de prueba",
            orden_horario: 1,
            notas: "Cliente de prueba",
            fecha_entrada: new Date(),
        },
    });
};

const createCollectionRequest = async () => {
    return prisma.solicitudes_recoleccion.create({
        data: {
            cliente: {
                connect: {
                    id_cliente: TEST_CLIENT_ID,
                },
            },
            cubetas_recolectadas: 0,
            cubetas_entregadas: 0,
            total_a_pagar: 0,
            total_pagado: 0,
            fecha: new Date(),
            notas: null,
            quiere_recoleccion: true,
            quiere_productos_extra: true,
        },
    });
};

const cleanDb = async () => {
    await prisma.solicitudes_recoleccion.deleteMany({
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

    await prisma.zona.deleteMany({
        where: { id_zona: TEST_ZONA_ID },
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
    await createTestUserAndClient();
});

afterEach(async () => {
    await cleanDb();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

describe("Formulario Primera sección Prueba de Integración", () => {
    describe("POST /api/solicitudes-rec/form02/obtener", () => {
        it("retorna 400 si faltan datos requeridos", async () => {
            // Arrange (Preparar)
            const token = createAuthToken();

            //Actuar 
            const res = await request(app)
                .post(GET_CURRENT_COLLECTION_REQUEST_ENDPOINT)
                .set("Authorization", `Bearer ${token}`)
                .send({});

            //Afirmar
            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: "Faltan datos requeridos para obtener la solicitud de recolección.",
            });
        });

        it("retorna 200 si encuentra una solicitud existente", async () => {
            //Arrange (Prepara)
            const token = createAuthToken();

            const requestCreated = await createCollectionRequest();
            const weekStartDate = new Date();
            weekStartDate.setDate(weekStartDate.getDate() - 1);
            const weekEndDate = new Date();
            weekEndDate.setDate(weekEndDate.getDate() + 1);

            //Actuar
            const res = await request(app)
                .post(GET_CURRENT_COLLECTION_REQUEST_ENDPOINT)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    clientId: TEST_CLIENT_ID,
                    weekStartDate: weekStartDate.toISOString(),
                    weekEndDate: weekEndDate.toISOString(),
                });

            //Afirmar
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Solicitud de recolección obtenida exitosamente.");
            expect(res.body.data.id_solicitud).toBe(requestCreated.id_solicitud);
            expect(res.body.data.id_cliente).toBe(TEST_CLIENT_ID);
        });

        it("retorna 200 y crea una solicitud inicial si no existe solicitud previa", async () => {
            //Arrange
            const token = createAuthToken();

            const weekStartDate = new Date();
            weekStartDate.setDate(weekStartDate.getDate() - 1);

            const weekEndDate = new Date();
            weekEndDate.setDate(weekEndDate.getDate() + 1);

            //Actuar
            const res = await request(app)
                .post(GET_CURRENT_COLLECTION_REQUEST_ENDPOINT)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    clientId: TEST_CLIENT_ID,
                    weekStartDate: weekStartDate.toISOString(),
                    weekEndDate: weekEndDate.toISOString(),
                });

            //Afirmar
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Solicitud de recolección obtenida exitosamente.");
            expect(res.body.data.id_cliente).toBe(TEST_CLIENT_ID);
            expect(res.body.data.cubetas_recolectadas).toBe(0);
            expect(res.body.data.cubetas_entregadas).toBe(0);
            expect(Number(res.body.data.total_a_pagar)).toBe(0);
            expect(Number(res.body.data.total_pagado)).toBe(0);

            const newcollectionRequest = await prisma.solicitudes_recoleccion.findFirst({
                where: {
                    id_cliente: TEST_CLIENT_ID,
                },
            });

            expect(newcollectionRequest).not.toBeNull();
        });

        it("retorna 500 si intenta crear solicitud para un cliente inexistente", async () => {
            //Arrange (Preparar)
            const token = createAuthToken();
            const NON_CLIENT = randomUUID();

            const weekStartDate = new Date();
            weekStartDate.setDate(weekStartDate.getDate() - 1);

            const weekEndDate = new Date();
            weekEndDate.setDate(weekEndDate.getDate() + 1);

            //Actuar
            const res = await request(app)
                .post(GET_CURRENT_COLLECTION_REQUEST_ENDPOINT)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    clientId: NON_CLIENT,
                    weekStartDate: weekStartDate.toISOString(),
                    weekEndDate: weekEndDate.toISOString(),
                });

            //Afirmar
            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Error servidor al obtener la solicitud de recolección.");
        });
    });

    describe("POST /api/solicitudes-rec/form02/guardar", () => {
        it("retorna 400 si faltan datos requeridos", async () => {
            // Arrange(Preparar)
            const token = createAuthToken();

            //Actuar
            const res = await request(app)
                .post(SAVE_FIRST_SECTION_ENDPOINT)
                .set("Authorization", `Bearer ${token}`)
                .send({});

            //Afirmar
            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: "Faltan datos requeridos para guardar la primera sección de la solicitud de recolección.",
            });
        });

        it("retorna 200 si guarda correctamente la primera sección", async () => {
            //Arrange (Preparar)
            const token = createAuthToken();
            const requestCreated = await createCollectionRequest();

            //Actuar
            const res = await request(app)
                .post(SAVE_FIRST_SECTION_ENDPOINT)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    requestId: requestCreated.id_solicitud,
                    wantsCollection: true,
                    wantsExtraProducts: false,
                    collectedBuckets: 3,
                    deliveredBuckets: 1,
                });

            //Afirmar
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Primera sección de la solicitud de recolección guardada exitosamente.");
            expect(res.body.data.id_solicitud).toBe(requestCreated.id_solicitud);
            expect(res.body.data.quiere_recoleccion).toBe(true);
            expect(res.body.data.quiere_productos_extra).toBe(false);
            expect(res.body.data.cubetas_recolectadas).toBe(3);
            expect(res.body.data.cubetas_entregadas).toBe(1);

            const solicitudActualizada = await prisma.solicitudes_recoleccion.findUnique({
                where: {
                    id_solicitud: requestCreated.id_solicitud,
                },
            });

            expect(solicitudActualizada.quiere_recoleccion).toBe(true);
            expect(solicitudActualizada.quiere_productos_extra).toBe(false);
            expect(solicitudActualizada.cubetas_recolectadas).toBe(3);
            expect(solicitudActualizada.cubetas_entregadas).toBe(1);
        });

        it("retorna 500 si intenta guardar una solicitud inexistente", async () => {
            //Arrange (Preparar)
            const token = createAuthToken();
            const NON_REQUEST = randomUUID();

            //Actuar
            const res = await request(app)
                .post(SAVE_FIRST_SECTION_ENDPOINT)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    requestId: NON_REQUEST,
                    wantsCollection: true,
                    wantsExtraProducts: true,
                    collectedBuckets: 2,
                    deliveredBuckets: 1,
                });

            //Afirmar
            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Error servidor al guardar la primera sección de la solicitud de recolección.");
        });
    });
});
