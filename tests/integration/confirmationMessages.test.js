const request = require("supertest");
const { randomUUID } = require("crypto");

jest.mock("../../config/googleSheetsMessages.service", () => ({
    sendRouteMessages: jest.fn(),
}));

const app = require("../../app");
const prisma = require("../../config/prisma");
const { generateAccessToken } = require("../../utils/jwt.utils");
const GoogleSheetsMessagesService = require("../../config/googleSheetsMessages.service");
const Routes = require("../../models/route.model");

const ENDPOINT = "/api/rutas/mensajes-de-confirmacion";

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();
const TEST_EMAIL = "yessica@compospet.com";
const TEST_RUTA_ID = 524;

const createAuthToken = () => {
    return generateAccessToken({
        userId: TEST_USER_ID,
        email: TEST_EMAIL,
        id_role: TEST_ROLE_ID,
        role: "Administrador",
    });
};

const createTestData = async () => {
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
            nombre: "test-role",
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: "Alejandra",
            apellido: "Prueba",
            correo: TEST_EMAIL,
            contrasena: "hash-test",
            estatus: true,
            telefono: "77100000",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.ruta.create({
        data: {
            id_ruta: TEST_RUTA_ID,
            dia_ruta: "Jueves",
            turno_ruta: "Vespertino",
        },
    });

    await prisma.cliente.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_USER_ID,
            id_ruta: TEST_RUTA_ID,
            mascotas: "1 perro",
            familia: "3",
            direccion: "Dirección prueba",
            orden_horario: 1,
            notas: "Cliente prueba",
            fecha_entrada: new Date(),
        },
    });
};

const getValidWeek = () => {
    const weeks = Routes.getAvailableWeeks();
    return weeks[weeks.length - 1];
};

const getValidWeekIndex = () => {
    const weeks = Routes.getAvailableWeeks();
    return weeks.length - 1;
};

const createSolicitud = async () => {

    // Aseguramos que el cliente y la ruta existan antes de crear la solicitud
    const { weekStart } = getValidWeek();

    // La solicitud se programa para el jueves de la semana seleccionada
    const solicitudDate = new Date(weekStart);
    solicitudDate.setDate(solicitudDate.getDate() + 1);
    solicitudDate.setHours(12, 0, 0, 0);

    await prisma.solicitudes_recoleccion.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            fecha: solicitudDate,
            horario: new Date("2026-05-21T13:00:00.000Z"),
            estatus: true,
            quiere_recoleccion: true,
            quiere_productos_extra: false,
            cubetas_recolectadas: 1,
            cubetas_entregadas: 1,
            total_a_pagar: 0,
            total_pagado: 0,
            notas: "Solicitud prueba",
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

    await prisma.roles.deleteMany({
        where: { id_rol: TEST_ROLE_ID },
    });

    await prisma.compospet.deleteMany({
        where: { id_cp: TEST_CP_ID },
    });
};

beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDb();
    await createTestData();

    GoogleSheetsMessagesService.sendRouteMessages.mockResolvedValue(
        "https://docs.google.com/spreadsheets/d/test-sheet-id"
    );
});

afterEach(async () => {
    await cleanDb();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

// Caso de prueba de Mensajes de confirmación

describe("RUT-09 Mensajes de confirmación Integration", () => {

    it("retorna 400 si no llegan los datos esperados del front", async () => {
        //Arrange
        const token = createAuthToken();

        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .set("Cookie", ["googleToken=fake-google-token"])
            .send({});

        // Afirmar
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: "Faltan datos para generar los mensajes de confirmación",
        });

        expect(GoogleSheetsMessagesService.sendRouteMessages).not.toHaveBeenCalled();
    });
    

    it("retorna 200 y genera mensajes cuando existen solicitudes", async () => {

        // Arrange
        const token = createAuthToken();
        const weekIndex = getValidWeekIndex();

        await createSolicitud();

        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .set("Cookie", ["googleToken=fake-google-token"])
            .send({
                weekIndex,
                dayName: "Jueves",
            });

        // Afirmar
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.sheetUrl).toBe(
            "https://docs.google.com/spreadsheets/d/test-sheet-id"
        );

        expect(GoogleSheetsMessagesService.sendRouteMessages).toHaveBeenCalled();
    });

    it("retorna 200 success false cuando Revisa que las solicitudes estén completas y agrega un horario a cada una", async () => {

        // Arrange
        const token = createAuthToken();
        const weekIndex = getValidWeekIndex();

        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .set("Cookie", ["googleToken=fake-google-token"])
            .send({
                weekIndex,
                dayName: "Jueves",
            });

        // Afirmar
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Revisa que las solicitudes estén completas y agrega un horario a cada una");

        expect(GoogleSheetsMessagesService.sendRouteMessages).not.toHaveBeenCalled();
    });

    it("retorna 401 si no existe googleToken", async () => {
        // Arrange
        const token = createAuthToken();
        const weekIndex = getValidWeekIndex();

        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                weekIndex,
                dayName: "Jueves",
            });

        // Afirmar
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("No hay token de Google para usar Google Sheets");
    });

    it("retorna 500 si falla el servicio de Google Sheets", async () => {
        // Arrange
        const token = createAuthToken();
        const weekIndex = getValidWeekIndex();

        await createSolicitud();

        GoogleSheetsMessagesService.sendRouteMessages.mockRejectedValue(
            new Error("Error Google Sheets")
        );

        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .set("Cookie", ["googleToken=fake-google-token"])
            .send({
                weekIndex,
                dayName: "Jueves",
            });

        // Afirmar
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe(
            "Ocurrió un error generando los mensajes de confirmación."
        );
    });
});