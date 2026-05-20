const Route = require("../../../models/route.model");

describe("Unit - Model - Route.generateConfirmationMessages", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("debe retornar solo rutas con solicitud válida y horario definido", async () => {
        // Arrange
        const params = {
            weekIndex: 10,
            dayName: "Jueves",
        };

        const mockFilteredRoutes = [
            {
                nombre: "Alejandra Prueba",
                horario: "13:00",
                hasRequest: true,
            },
            {
                nombre: "Cliente Sin Solicitud",
                horario: "14:00",
                hasRequest: false,
            },
            {
                nombre: "Cliente Sin Horario",
                horario: " ",
                hasRequest: true,
            },
            {
                nombre: "Cliente Horario Null",
                horario: null,
                hasRequest: true,
            },
        ];

        jest.spyOn(Route, "getFilteredRoutesInfo")
            .mockResolvedValue(mockFilteredRoutes);

        // Actuar
        const result = await Route.generateConfirmationMessages(params);

        // Afirmar
        expect(Route.getFilteredRoutesInfo).toHaveBeenCalledWith(params);

        expect(result).toEqual([
            {
                nombre: "Alejandra Prueba",
                horario: "13:00",
                hasRequest: true,
            },
        ]);
    });

    it("debe retornar arreglo vacío si no hay rutas con solicitud válida", async () => {
        // Arrange
        const params = {
            weekIndex: 10,
            dayName: "Jueves",
        };

        const mockFilteredRoutes = [
            {
                nombre: "Cliente Sin Solicitud",
                horario: "13:00",
                hasRequest: false,
            },
            {
                nombre: "Cliente Sin Horario",
                horario: "",
                hasRequest: true,
            },
            {
                nombre: "Cliente Solo Espacios",
                horario: "   ",
                hasRequest: true,
            },
        ];

        jest.spyOn(Route, "getFilteredRoutesInfo")
            .mockResolvedValue(mockFilteredRoutes);

        // Actuar
        const result = await Route.generateConfirmationMessages(params);

        // Afirmar
        expect(Route.getFilteredRoutesInfo).toHaveBeenCalledWith(params);
        expect(result).toEqual([]);
    });

    it("debe aceptar dayName undefined y delegarlo al método de rutas filtradas", async () => {
        // Arrange
        const params = {
            weekIndex: 10,
            dayName: undefined,
        };

        const mockFilteredRoutes = [
            {
                nombre: "Alejandra Prueba",
                horario: "13:00",
                hasRequest: true,
            },
        ];

        jest.spyOn(Route, "getFilteredRoutesInfo")
            .mockResolvedValue(mockFilteredRoutes);

        // Actuar
        const result = await Route.generateConfirmationMessages(params);

        // Afirmar
        expect(Route.getFilteredRoutesInfo).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockFilteredRoutes);
    });

    it("debe lanzar error si falla getFilteredRoutesInfo", async () => {
        // Arrange
        const params = {
            weekIndex: 10,
            dayName: "Jueves",
        };

        jest.spyOn(Route, "getFilteredRoutesInfo")
            .mockRejectedValue(new Error("DB Error"));

        // Actuar y afirmar
        await expect(
            Route.generateConfirmationMessages(params)
        ).rejects.toThrow(
            "Error generando mensajes de confirmación: DB Error"
        );

        expect(Route.getFilteredRoutesInfo).toHaveBeenCalledWith(params);
    });
});