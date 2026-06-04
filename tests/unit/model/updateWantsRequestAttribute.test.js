const CollectionRequest = require('../../../models/collectionRequest.model');
const prisma = require('../../../config/prisma');

jest.mock('../../../config/prisma', () => ({
    $transaction: jest.fn(),
    solicitudes_recoleccion: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
}));

describe('Model - updateWantsRequestAttribute', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        prisma.$transaction.mockImplementation(async (callback) => {
            return callback(prisma);
        });
    });

    it('debe actualizar el atributo quiere_productos_extra', async () => {
        // Arrange
        const requestID = 'request-123';
        const value = true;

        const mockEditableRequest = {
            id_solicitud: requestID,
            id_cliente: 'client-123',
            total_pagado: 0,
            total_a_pagar: 0,
            estatus: false,
            id_pago: null,
        };

        const mockUpdatedRequest = {
            id_solicitud: requestID,
            quiere_productos_extra: value,
        };

        prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(
            mockEditableRequest,
        );

        prisma.solicitudes_recoleccion.update.mockResolvedValue(
            mockUpdatedRequest,
        );

        // Act
        const result = await CollectionRequest.updateWantsRequestAttribute(
            requestID,
            value,
        );

        // Assert
        expect(result).toEqual(mockUpdatedRequest);

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);

        expect(prisma.solicitudes_recoleccion.findUnique).toHaveBeenCalledWith({
            where: {
                id_solicitud: requestID,
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
                id_solicitud: requestID,
            },
            data: {
                quiere_productos_extra: value,
            },
        });
    });

    it('debe lanzar error si la solicitud no existe', async () => {
        // Arrange
        const requestID = 'request-123';
        const value = true;

        prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
            CollectionRequest.updateWantsRequestAttribute(requestID, value),
        ).rejects.toThrow('Solicitud no encontrada');

        expect(prisma.solicitudes_recoleccion.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la solicitud ya fue enviada', async () => {
        // Arrange
        const requestID = 'request-123';
        const value = true;

        prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
            id_solicitud: requestID,
            id_cliente: 'client-123',
            total_pagado: 0,
            total_a_pagar: 0,
            estatus: true,
            id_pago: 1,
        });

        // Act & Assert
        await expect(
            CollectionRequest.updateWantsRequestAttribute(requestID, value),
        ).rejects.toThrow(
            'La solicitud de recolección ya fue enviada y no puede modificarse.',
        );

        expect(prisma.solicitudes_recoleccion.update).not.toHaveBeenCalled();
    });
});