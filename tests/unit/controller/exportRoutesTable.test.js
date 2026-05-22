const routesController = require("../../../controllers/tableRoutes.controller");
const Routes = require("../../../models/route.model");
const GoogleSheetsRoutesService = require('../../../config/googleSheetsRoutes.service');

jest.mock("../../../models/route.model");
jest.mock("../../../config/googleSheetsRoutes.service");

describe("Controller - exportDailyRoutes ", () => {
    let req;
    let res;

    beforeEach(() => {
        req = {};

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    describe("exportDailyRoutes()", () => {
        it("Debe obtener la información de la ruta y mandarlo al google sheets", async () => {
            const mockRouteInfo = [
                { 
                    nombre: "Alejandra Prueba", 
                    dia_ruta: "Jueves" 
                },
            ];

            const mockSheetUrl = "https://docs.google.com/spreadsheets/d/test-sheet-id";

            Routes.getRoutesInfo.mockResolvedValue(mockRouteInfo);
            GoogleSheetsRoutesService.exportDailyRoutes.mockResolvedValue(mockSheetUrl);

            const result = await routesController.exportDailyRoutes();

            expect(Routes.getRoutesInfo).toHaveBeenCalledTimes(1);
            expect(GoogleSheetsRoutesService.exportDailyRoutes).toHaveBeenCalledWith(mockRouteInfo);
            
            expect(result).toBe(mockSheetUrl);
        });

        it("Debe lanzar el error si falla la consulta al modelo", async () => {
            const mockError = new Error("Error en BD");
            Routes.getRoutesInfo.mockRejectedValue(mockError);

            await expect(routesController.exportDailyRoutes()).rejects.toThrow("Error en BD");

            expect(Routes.getRoutesInfo).toHaveBeenCalledTimes(1);
            expect(GoogleSheetsRoutesService.exportDailyRoutes).not.toHaveBeenCalled(); 
        });

        it("Debe lanzar el error si falla Google Sheets", async () => {
            const mockRouteInfo = [{ nombre: "Alejandra Prueba", dia_ruta: "Jueves" }];
            const mockError = new Error("Error en Google Sheets");

            Routes.getRoutesInfo.mockResolvedValue(mockRouteInfo);
            GoogleSheetsRoutesService.exportDailyRoutes.mockRejectedValue(mockError);

            await expect(routesController.exportDailyRoutes()).rejects.toThrow("Error en Google Sheets");
        });

    });

    describe("exportDailyRoutesInfo()", () => {
        it("Debe devolver 200 y mensaje de éxito con la URL generada", async () => {
            const mockRouteInfo = [{ nombre: "Alejandra Prueba", dia_ruta: "Jueves" }];
            const mockSheetUrl = "https://docs.google.com/spreadsheets/d/test-sheet-id";

            Routes.getRoutesInfo.mockResolvedValue(mockRouteInfo);
            GoogleSheetsRoutesService.exportDailyRoutes.mockResolvedValue(mockSheetUrl);

            await routesController.exportDailyRoutesInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Exportación exitosa",
                data: { routeInfo: mockSheetUrl }, 
            });
        });

        it("Debe devolver 500 y el mensaje de error si ocurre un fallo al exportar", async () => {
            const mockError = new Error("Error obteniendo rutas");
            Routes.getRoutesInfo.mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            await routesController.exportDailyRoutesInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Ocurrió un error obteniendo la información.",
                error: mockError.message,
            });

            consoleSpy.mockRestore();
        });
    });

})