const CollectionRequest = require("../../../models/collectionRequest.model")

jest.mock("../../../config/prisma", () => ({

    solicitudes_recoleccion: {
        findFirst: jest.fn(),
    },
}));

const prisma = require("../../../config/prisma");

describe("Model - getCurrentCollectionRequest", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it ("Debe retornar la solicitud del cliente si existe", async () => {
    
        //Arrange (Preparar)
        const clientId = "11111111-1111-1111-1111-111111111111";
        const weekStartDate = "2026-04-26T00:00:00.000Z";
        const weekEndDate = "2026-05-02T23:59:59.999Z";

        const mockCurrentRequest = {
            id_solicitud: "22-2222-222",
            id_cliente: clientId,
            cubetas_recolectadas: 2,
            cubetas_entregadas: 1,
            total_a_pagar: 100,
            total_pagado: 0,
            fecha: new Date("2026-04-28T12:00:00.000Z"),
            notas: "Solicitud existente",
            quiere_recoleccion: true,
            quiere_productos_extra: false,
        };

        prisma.solicitudes_recoleccion.findFirst.mockResolvedValue(mockCurrentRequest);

        //Actuar
        const result = await CollectionRequest.getCurrentCollectionRequest(
            clientId,
            weekStartDate,
            weekEndDate,
        );

        //Afirmar
        expect(result).toEqual(mockCurrentRequest);
        expect(prisma.solicitudes_recoleccion.findFirst).toHaveBeenCalledWith({
            where: {
                id_cliente: clientId,
                fecha: {
                    gte: new Date(weekStartDate),
                    lte: new Date(weekEndDate),
                },
            },
        });
    });

    it ("Debe retornar null si la solicitud del cliente no existe", async () => {
    
        //Arrange (Preparar)
        const clientId = "11111111-1111-1111-1111-111111111111";
        const weekStartDate = "2026-04-26T00:00:00.000Z";
        const weekEndDate = "2026-05-02T23:59:59.999Z";

        prisma.solicitudes_recoleccion.findFirst.mockResolvedValue(null);

        //Actuar
        const result = await CollectionRequest.getCurrentCollectionRequest(
            clientId,
            weekStartDate,
            weekEndDate,
        );

        //Afirmar
        expect(result).toBeNull();
        expect(prisma.solicitudes_recoleccion.findFirst).toHaveBeenCalledWith({
            where: {
                id_cliente: clientId,
                fecha: {
                    gte: new Date(weekStartDate),
                    lte: new Date(weekEndDate),
                },
            },
        });
    });

    it ("Debe retornar error si prisma falla al consultar la solicitud del cliente", async () => {
        //Arrange
        const clientId = "11111111-1111-1111-1111-111111111111";
        const weekStartDate = "2026-04-26T00:00:00.000Z";
        const weekEndDate = "2026-05-02T23:59:59.999Z";

        prisma.solicitudes_recoleccion.findFirst.mockRejectedValue(
            new Error("DB Error"),
        );

        //Actuar y afirmar
        await expect(
            CollectionRequest.getCurrentCollectionRequest(
                clientId,
                weekStartDate,
                weekEndDate,
            ),
        ).rejects.toThrow("DB Error");
    });
});