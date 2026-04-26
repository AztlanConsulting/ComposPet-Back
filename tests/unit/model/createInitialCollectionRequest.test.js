const CollectionRequest = require("../../../models/collectionRequest.model")

jest.mock("../../../config/prisma", () => ({

    solicitudes_recoleccion: {
        create: jest.fn(),
    },
}));

const prisma = require("../../../config/prisma");

describe("Model - createInitialCollectionRequest", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it ("Debe crear una solicitud inicial para el cliente", async () => {

        //Arrange (Preparar)
        const clientId = "11111111-1111-1111-1111-111111111111";

        const mockNewRequest = {
            id_solicitud: "req-new",
            id_cliente: clientId,
            cubetas_recolectadas: 0,
            cubetas_entregadas: 0,
            total_a_pagar: 0,
            total_pagado: 0,
            fecha: new Date("2026-04-28T12:00:00.000Z"),
            notas: null,
            quiere_recoleccion: true,
            quiere_productos_extra: true,
        };

        prisma.solicitudes_recoleccion.create.mockResolvedValue(mockNewRequest);

        //Actuar
        const result = await CollectionRequest.createInitialCollectionRequest(clientId);

        //Afirmar
        expect(result).toEqual(mockNewRequest);
        expect(prisma.solicitudes_recoleccion.create).toHaveBeenCalledWith({
            data: {
                cliente: {
                    connect: {
                        id_cliente: clientId,
                    },
                },
                cubetas_recolectadas: 0,
                cubetas_entregadas: 0,
                total_a_pagar: 0,
                total_pagado: 0,
                fecha: expect.any(Date),
                notas: null,
                quiere_recoleccion: true,
                quiere_productos_extra: true,
            },
        });
    });

    it ("Debe lanzar error si Prisma no puede crear la solicitud", async () => {
    
        //Arrange (Preparar)
        const clientId = "11111111-1111-1111-1111-111111111111";

        prisma.solicitudes_recoleccion.create.mockRejectedValue(
            new Error("DB Error"),
        );

        //Actuar y afirmar
        await expect(
            CollectionRequest.createInitialCollectionRequest(clientId),
        ).rejects.toThrow("DB Error");
    });
});