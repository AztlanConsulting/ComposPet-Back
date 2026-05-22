const request = require("supertest");
const { randomUUID } = require("crypto");

jest.mock("../../config/googleSheetsRoutes.service", () => ({
    exportDailyRoutes: jest.fn(),
}));

const app = require("../../app");
const prisma = require("../../config/prisma");
const { generateAccessToken } = require("../../utils/jwt.utils");
const GoogleSheetsRoutesService = require("../../config/googleSheetsRoutes.service");

const ENDPOINT = "/api/rutas/exportar-tabla-rutas";

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();
const TEST_EMAIL = "yessica@compospet.com";
const TEST_RUTA_ID = 525;

const WEEK_DAYS = [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado",
];

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
            apellido: "Prueba Exportación",
            correo: TEST_EMAIL,
            contrasena: "hash-test",
            estatus: true,
            telefono: "77100000",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    const currentDayName = WEEK_DAYS[new Date().getDay()];

    await prisma.ruta.create({
        data: {
            id_ruta: TEST_RUTA_ID,
            dia_ruta: currentDayName,
            turno_ruta: "Matutino",
        },
    });

    await prisma.cliente.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_USER_ID,
            id_ruta: TEST_RUTA_ID,
            mascotas: "2 gatos",
            familia: "2",
            direccion: "Dirección exportación",
            orden_horario: 1,
            notas: "Cliente exportación prueba",
            fecha_entrada: new Date(),
        },
    });
};

const createSolicitud = async () => {
    const today = new Date();

    await prisma.solicitudes_recoleccion.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            fecha: today,
            horario: new Date(),
            estatus: true,
            quiere_recoleccion: true,
            quiere_productos_extra: false,
            cubetas_recolectadas: 2,
            cubetas_entregadas: 2,
            total_a_pagar: 150,
            total_pagado: 150,
            notas: "Solicitud de exportación hoy",
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

    GoogleSheetsRoutesService.exportDailyRoutes.mockResolvedValue(
        "https://docs.google.com/spreadsheets/d/mock-export-sheet-id"
    );
});

afterEach(async () => {
    await cleanDb();
});

beforeAll(async () => {
    await cleanDb();
    await createTestData();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

// =====================================================================
// Casos de prueba: Exportación de Rutas Diarias
// =====================================================================

describe("RUT-10 Exportación de Rutas Diarias Integration", () => {
    
    it("retorna 401 si no hay token de autenticación", async () => {
        const res = await request(app)
            .get(ENDPOINT)
            .send();

        expect(res.status).toBe(401);

        expect(res.body).toEqual({
            error: "UNAUTHORIZED",
            message: "Token de autenticación requerido",
        });
        
        expect(GoogleSheetsRoutesService.exportDailyRoutes).not.toHaveBeenCalled();
    });

    it("retorna 200 y exporta la información a Google Sheets correctamente", async () => {
        const token = createAuthToken();
        await createSolicitud();

        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send();

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: true,
            message: "Exportación exitosa",
            data: { 
                routeInfo: "https://docs.google.com/spreadsheets/d/mock-export-sheet-id" 
            },
        });

        expect(GoogleSheetsRoutesService.exportDailyRoutes).toHaveBeenCalledTimes(1);
        const callArgs = GoogleSheetsRoutesService.exportDailyRoutes.mock.calls[0][0];
        expect(Array.isArray(callArgs)).toBe(true);
        expect(callArgs[0]).toHaveProperty("nombre", "Alejandra Prueba Exportación");
    });

    it("retorna 500 si falla el servicio de Google Sheets", async () => {
        const token = createAuthToken();
        await createSolicitud();

        GoogleSheetsRoutesService.exportDailyRoutes.mockRejectedValue(
            new Error("Google Sheets API Timeout")
        );

        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send();

        expect(res.status).toBe(500);
        expect(res.body).toEqual({
            success: false,
            message: "Ocurrió un error obteniendo la información.",
            error: "Google Sheets API Timeout",
        });

        consoleSpy.mockRestore();
    });
});