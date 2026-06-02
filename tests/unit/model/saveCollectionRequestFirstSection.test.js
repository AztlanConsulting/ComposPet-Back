const CollectionRequest = require("../../../models/collectionRequest.model");

jest.mock("../../../config/prisma", () => ({
    $transaction: jest.fn(),
    solicitudes_recoleccion: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
}));

const prisma = require("../../../config/prisma");

describe("Model - saveCollectionRequestFirstSection", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        prisma.$transaction.mockImplementation(async (callback) => {
            return callback(prisma);
        });
    });

    it("Debe guardar los campos capturados en la primera sección del formulario.", async () => {
        // Arrange
        const firstSectionData = {
            requestId: "req-123",
            wantsCollection: true,
            wantsExtraProducts: false,
            collectedBuckets: 3,
            deliveredBuckets: 1,
        };

        const mockEditableRequest = {
            id_solicitud: "req-123",
            id_cliente: "client-123",
            total_pagado: 0,
            total_a_pagar: 0,
            estatus: false,
            id_pago: null,
        };

        const mockSavedRequest = {
            id_solicitud: "req-123",
            quiere_recoleccion: true,
            quiere_productos_extra: false,
            cubetas_recolectadas: 3,
            cubetas_entregadas: 1,
        };

        prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(
            mockEditableRequest,
        );

        prisma.solicitudes_recoleccion.update.mockResolvedValue(
            mockSavedRequest,
        );

        // Act
        const result = await CollectionRequest.saveCollectionRequestFirstSection(
            firstSectionData,
        );

        // Assert
        expect(result).toEqual(mockSavedRequest);

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);

        expect(prisma.solicitudes_recoleccion.findUnique).toHaveBeenCalledWith({
            where: {
                id_solicitud: firstSectionData.requestId,
            },
            select: {
                id_solicitud: true,
                id_cliente: true,
                total_pagado: true,
                total_a_pagar: true,
                estatus: true,
                id_pago: true,
            },
        });

        expect(prisma.solicitudes_recoleccion.update).toHaveBeenCalledWith({
            where: {
                id_solicitud: firstSectionData.requestId,
            },
            data: {
                quiere_recoleccion: firstSectionData.wantsCollection,
                quiere_productos_extra: firstSectionData.wantsExtraProducts,
                cubetas_recolectadas: firstSectionData.collectedBuckets,
                cubetas_entregadas: firstSectionData.deliveredBuckets,
            },
        });
    });

    it("Debe dar error si Prisma no puede guardar primera sección del formulario.", async () => {
        // Arrange
        const firstSectionData = {
            requestId: "req-123",
            wantsCollection: true,
            wantsExtraProducts: true,
            collectedBuckets: 2,
            deliveredBuckets: 1,
        };

        const mockEditableRequest = {
            id_solicitud: "req-123",
            id_cliente: "client-123",
            total_pagado: 0,
            total_a_pagar: 0,
            estatus: false,
            id_pago: null,
        };

        prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(
            mockEditableRequest,
        );

        prisma.solicitudes_recoleccion.update.mockRejectedValue(
            new Error("DB Error"),
        );

        // Act & Assert
        await expect(
            CollectionRequest.saveCollectionRequestFirstSection(firstSectionData),
        ).rejects.toThrow("DB Error");

        expect(prisma.solicitudes_recoleccion.findUnique).toHaveBeenCalled();
        expect(prisma.solicitudes_recoleccion.update).toHaveBeenCalled();
    });
});