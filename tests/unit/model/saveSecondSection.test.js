const CollectionRequest = require('../../../models/collectionRequest.model');
const prisma = require('../../../config/prisma');

jest.mock('../../../config/prisma', () => ({
    $transaction: jest.fn(),
    solicitudes_recoleccion: {
        findUnique: jest.fn(),
    },
    productos_solicitud: {
        deleteMany: jest.fn(),
        create: jest.fn(),
    },
}));

describe('Model - saveSecondSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        prisma.$transaction.mockImplementation(async (callback) => {
            return callback(prisma);
        });
    });

    it('debe guardar correctamente los productos de la segunda sección', async () => {
        // Arrange
        const requestID = 'request-123';
        const products = [
            { id_producto: 1, cantidad: 2 },
            { id_producto: 2, cantidad: 1 },
        ];

        prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
            id_solicitud: requestID,
            id_cliente: 'client-123',
            total_pagado: 0,
            total_a_pagar: 0,
            estatus: false,
            id_pago: null,
        });

        prisma.productos_solicitud.deleteMany.mockResolvedValue({
            count: 1,
        });

        prisma.productos_solicitud.create.mockResolvedValue({});

        // Act
        const result = await CollectionRequest.saveSecondSection(
            requestID,
            products,
        );

        // Assert
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

        expect(prisma.productos_solicitud.deleteMany).toHaveBeenCalledWith({
            where: {
                id_solicitud: requestID,
            },
        });

        expect(prisma.productos_solicitud.create).toHaveBeenCalledTimes(2);

        expect(prisma.productos_solicitud.create).toHaveBeenNthCalledWith(1, {
            data: expect.objectContaining({
                id_solicitud: requestID,
                id_producto: 1,
                cantidad: 2,
            }),
        });

        expect(prisma.productos_solicitud.create).toHaveBeenNthCalledWith(2, {
            data: expect.objectContaining({
                id_solicitud: requestID,
                id_producto: 2,
                cantidad: 1,
            }),
        });

        expect(result).toEqual({
            message: 'Productos guardados correctamente',
        });
    });

    it('debe lanzar error si la solicitud no existe', async () => {
        // Arrange
        const requestID = 'request-123';
        const products = [
            { id_producto: 1, cantidad: 2 },
        ];

        prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
            CollectionRequest.saveSecondSection(requestID, products),
        ).rejects.toThrow('Solicitud no encontrada');

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

        expect(prisma.productos_solicitud.deleteMany).not.toHaveBeenCalled();
        expect(prisma.productos_solicitud.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la solicitud ya fue enviada', async () => {
        // Arrange
        const requestID = 'request-123';
        const products = [
            { id_producto: 1, cantidad: 2 },
        ];

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
            CollectionRequest.saveSecondSection(requestID, products),
        ).rejects.toThrow(
            'La solicitud de recolección ya fue enviada y no puede modificarse.',
        );

        expect(prisma.productos_solicitud.deleteMany).not.toHaveBeenCalled();
        expect(prisma.productos_solicitud.create).not.toHaveBeenCalled();
    });
});