const CollectionRequest = require("../../../models/collectionRequest.model")

jest.mock("../../../config/prisma", () => ({

    solicitudes_recoleccion: {
        update: jest.fn(),
    },
}));

const prisma = require("../../../config/prisma");

describe("Model - saveCollectionRequestFirstSection", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it ("Debe guardar los campos capturados en la primera sección del formulario.", async () => {

        //Arrange (Preparar)
        const firstSectionData = {
            requestId: "req-123",
            wantsCollection: true,
            wantsExtraProducts: false,
            collectedBuckets: 3,
            deliveredBuckets: 1,
        };

        const mockSavedRequest = {
            id_solicitud: "req-123",
            quiere_recoleccion: true,
            quiere_productos_extra: false,
            cubetas_recolectadas: 3,
            cubetas_entregadas: 1,
        };

        prisma.solicitudes_recoleccion.update.mockResolvedValue(mockSavedRequest);

        //Actuar
        const result = await CollectionRequest.saveCollectionRequestFirstSection(
            firstSectionData,
        );

        //Afirmar
        expect(result).toEqual(mockSavedRequest);
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

    it ("Debe dar error si Prisma no puede guardar primera sección del formulario.", async () => {
    
        //Arrange
        const firstSectionData = {
            requestId: "req-123",
            wantsCollection: true,
            wantsExtraProducts: true,
            collectedBuckets: 2,
            deliveredBuckets: 1,
        };

        prisma.solicitudes_recoleccion.update.mockRejectedValue(
            new Error("DB Error"),
        );

        //Actuar y afirmar
        await expect(
            CollectionRequest.saveCollectionRequestFirstSection(firstSectionData),
        ).rejects.toThrow("DB Error");
    });

});