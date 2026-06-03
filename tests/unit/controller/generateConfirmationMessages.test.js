const routesController = require("../../../controllers/tableRoutes.controller");
const Routes = require("../../../models/route.model");
const GoogleSheetsMessagesService = require("../../../config/googleSheetsMessages.service");

jest.mock("../../../models/route.model");
jest.mock("../../../config/googleSheetsMessages.service");

describe("Controller - generateConfirmationMessages", () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {},
            cookies: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it("Debe devolver 400 si no llegan los datos esperados del front", async () => {

        req.cookies.googleToken = "fake-google-token";

        await routesController.generateConfirmationMessages(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Faltan datos para generar los mensajes de confirmación",
        });

        expect(Routes.generateConfirmationMessages).not.toHaveBeenCalled();
        expect(GoogleSheetsMessagesService.sendRouteMessages).not.toHaveBeenCalled();
    });

    it("Debe devolver 401 si no existe googleToken", async () => {
        req.body = {
            weekIndex: 10,
            dayName: "Jueves",
        };

        await routesController.generateConfirmationMessages(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "No hay token de Google para usar Google Sheets",
        });

        expect(Routes.generateConfirmationMessages).not.toHaveBeenCalled();
        expect(GoogleSheetsMessagesService.sendRouteMessages).not.toHaveBeenCalled();
    });

    it("Debe devolver 200 success false si Revisa que las solicitudes estén completas y agrega un horario a cada una", async () => {
        req.body = {
            weekIndex: 10,
            dayName: "Jueves",
        };

        req.cookies.googleToken = "fake-google-token";

        Routes.generateConfirmationMessages.mockResolvedValue([]);

        await routesController.generateConfirmationMessages(req, res);

        expect(Routes.generateConfirmationMessages).toHaveBeenCalledWith({
            weekIndex: 10,
            dayName: "Jueves",
        });

        expect(GoogleSheetsMessagesService.sendRouteMessages).not.toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Revisa que las solicitudes estén completas y agrega un horario a cada una",
        });
    });

    it("Debe devolver 200 y URL del Google Sheets si genera mensajes correctamente", async () => {
        req.body = {
            weekIndex: 10,
            dayName: "Jueves",
        };

        req.cookies.googleToken = "fake-google-token";

        const mockRouteInfo = [
            {
                nombre: "Alejandra Prueba",
                horario: "13:00",
            },
        ];

        const mockSheetUrl = "https://docs.google.com/spreadsheets/d/test-sheet-id";

        Routes.generateConfirmationMessages.mockResolvedValue(mockRouteInfo);
        GoogleSheetsMessagesService.sendRouteMessages.mockResolvedValue(mockSheetUrl);

        await routesController.generateConfirmationMessages(req, res);

        expect(Routes.generateConfirmationMessages).toHaveBeenCalledWith({
            weekIndex: 10,
            dayName: "Jueves",
        });

        expect(GoogleSheetsMessagesService.sendRouteMessages).toHaveBeenCalledWith(
            "fake-google-token",
            "Mensajes de Confirmación para Rutas - Semana 10 - Jueves",
            [
                [
                    expect.stringContaining("¡Linda Tarde! Alejandra"),
                    "Alejandra Prueba",
                ],
            ]
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            messages: "Mensajes de confirmación generados exitosamente.",
            data: {
                sheetUrl: mockSheetUrl,
            },
        });
    });

    it("Debe devolver 500 si ocurre un error al generar mensajes", async () => {
        req.body = {
            weekIndex: 10,
            dayName: "Jueves",
        };

        req.cookies.googleToken = "fake-google-token";

        Routes.generateConfirmationMessages.mockRejectedValue(
            new Error("Error interno")
        );

        await routesController.generateConfirmationMessages(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Ocurrió un error generando los mensajes de confirmación.",
            error: "Error interno",
        });
    });

    it("Debe devolver 500 si falla el servicio de Google Sheets", async () => {
        req.body = {
            weekIndex: 10,
            dayName: "Jueves",
        };

        req.cookies.googleToken = "fake-google-token";

        Routes.generateConfirmationMessages.mockResolvedValue([
            {
                nombre: "Alejandra Prueba",
                horario: "13:00",
            },
        ]);

        GoogleSheetsMessagesService.sendRouteMessages.mockRejectedValue(
            new Error("Error Google Sheets")
        );

        await routesController.generateConfirmationMessages(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Ocurrió un error generando los mensajes de confirmación.",
            error: "Error Google Sheets",
        });
    });
});