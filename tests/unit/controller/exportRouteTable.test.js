const routesController = require("../../../controllers/tableRoutes.controller");
const Routes = require("../../../models/route.model");
const GoogleSheetsRoutesService = require('../../../config/googleSheetsRoutes.service');

jest.mock("../../../models/route.model");
jest.mock("../../../config/googleSheetsRoutes.service");

describe("Controller - exportFilteredRoutes", () => {
    let req;
    let res;

    beforeEach(() => {
        req = { body: {} };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it("retorna 400 si faltan weekIndex o dayName", async () => {
        req.body = { weekIndex: 2 };

        await routesController.exportFilteredRoutes(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Selecciona una semana y un día de ruta para exportar.",
        });
        expect(Routes.getFilteredRoutesInfo).not.toHaveBeenCalled();
    });

    it("retorna 200 y la URL de la hoja cuando la exportación es exitosa", async () => {
        req.body = { weekIndex: 2, dayName: "Miércoles tarde" };

        const mockRouteInfo = [
            { nombre: "Alejandra Prueba", dia_ruta: "Miércoles tarde" },
        ];
        const mockSheetUrl = "https://docs.google.com/spreadsheets/d/test-sheet-id";

        Routes.getFilteredRoutesInfo.mockResolvedValue(mockRouteInfo);
        GoogleSheetsRoutesService.exportDailyRoutes.mockResolvedValue(mockSheetUrl);

        await routesController.exportFilteredRoutes(req, res);

        expect(Routes.getFilteredRoutesInfo).toHaveBeenCalledWith({
            weekIndex: 2,
            dayName: "Miércoles tarde",
        });
        expect(GoogleSheetsRoutesService.exportDailyRoutes).toHaveBeenCalledWith(mockRouteInfo);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Exportación exitosa",
            data: { sheetUrl: mockSheetUrl },
        });
    });

    it("retorna 500 si falla la consulta al modelo", async () => {
        req.body = { weekIndex: 2, dayName: "Miércoles tarde" };

        const mockError = new Error("Error en BD");
        Routes.getFilteredRoutesInfo.mockRejectedValue(mockError);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        await routesController.exportFilteredRoutes(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Ocurrió un error exportando la información.",
            error: "Error en BD",
        });

        consoleSpy.mockRestore();
    });

    it("retorna 500 si falla Google Sheets", async () => {
        req.body = { weekIndex: 2, dayName: "Miércoles tarde" };

        const mockRouteInfo = [{ nombre: "Alejandra Prueba", dia_ruta: "Miércoles tarde" }];
        const mockError = new Error("Error en Google Sheets");

        Routes.getFilteredRoutesInfo.mockResolvedValue(mockRouteInfo);
        GoogleSheetsRoutesService.exportDailyRoutes.mockRejectedValue(mockError);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        await routesController.exportFilteredRoutes(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Ocurrió un error exportando la información.",
            error: "Error en Google Sheets",
        });

        consoleSpy.mockRestore();
    });
});