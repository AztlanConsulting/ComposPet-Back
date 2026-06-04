const CollectionRequest = require('../../../models/client.model');

jest.mock('../../../config/prisma', () => ({
    productos_extra: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
    },
}));

const prisma = require('../../../config/prisma');

describe('Unit - Model - getCompostStatus', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe retornar true si ambos productos de composta están activos', async () => {
        // Arrange
        prisma.productos_extra.findMany.mockResolvedValue([
            { estatus: true },
            { estatus: true },
        ]);

        // Act
        const result = await CollectionRequest.getCompostStatus();

        // Assert
        expect(prisma.productos_extra.findMany).toHaveBeenCalledWith({
            where: {
                id_producto: {
                    in: [2, 3],
                },
            },
            select: {
                estatus: true,
            },
        });

        expect(result).toBe(true);
    });

    it('debe retornar false si uno de los productos está inactivo', async () => {
        // Arrange
        prisma.productos_extra.findMany.mockResolvedValue([
            { estatus: true },
            { estatus: false },
        ]);

        // Act
        const result = await CollectionRequest.getCompostStatus();

        // Assert
        expect(result).toBe(false);
    });

    it('debe retornar false si no encuentra los dos productos de composta', async () => {
        // Arrange
        prisma.productos_extra.findMany.mockResolvedValue([]);

        // Act
        const result = await CollectionRequest.getCompostStatus();

        // Assert
        expect(result).toBe(false);
    });

    it('debe retornar false si solo encuentra un producto de composta', async () => {
        // Arrange
        prisma.productos_extra.findMany.mockResolvedValue([
            { estatus: true },
        ]);

        // Act
        const result = await CollectionRequest.getCompostStatus();

        // Assert
        expect(result).toBe(false);
    });

    it('debe retornar false si falta uno de los productos de composta', async () => {
        // Arrange
        prisma.productos_extra.findMany.mockResolvedValue([
            { estatus: true },
        ]);

        // Act
        const result = await CollectionRequest.getCompostStatus();

        // Assert
        expect(result).toBe(false);
    });

    it('debe retornar false si ambos productos están inactivos', async () => {
        prisma.productos_extra.findMany.mockResolvedValue([
            { estatus: false },
            { estatus: false },
        ]);

        const result = await CollectionRequest.getCompostStatus();

        expect(result).toBe(false);
    });

    it('debe retornar false si algún estatus viene null o undefined', async () => {
        prisma.productos_extra.findMany.mockResolvedValue([
            { estatus: true },
            { estatus: null },
        ]);

        const result = await CollectionRequest.getCompostStatus();

        expect(result).toBe(false);
    });

    it('debe propagar el error si Prisma falla', async () => {
        prisma.productos_extra.findMany.mockRejectedValue(
            new Error('DB_ERROR')
        );

        await expect(CollectionRequest.getCompostStatus())
            .rejects
            .toThrow('DB_ERROR');
    });

});


describe('Unit - Model - updateCompostStatus', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe actualizar el estatus de los productos de composta a true', async () => {
        // Arrange
        prisma.productos_extra.updateMany.mockResolvedValue({
            count: 2,
        });

        // Act
        const result = await CollectionRequest.updateCompostStatus(true);

        // Assert
        expect(prisma.productos_extra.updateMany).toHaveBeenCalledWith({
            where: {
                id_producto: {
                    in: [2, 3],
                },
            },
            data: {
                estatus: true,
            },
        });

        expect(result).toEqual({
            count: 2,
        });
    });

    it('debe actualizar el estatus de los productos de composta a false', async () => {
        // Arrange
        prisma.productos_extra.updateMany.mockResolvedValue({
            count: 2,
        });

        // Act
        const result = await CollectionRequest.updateCompostStatus(false);

        // Assert
        expect(prisma.productos_extra.updateMany).toHaveBeenCalledWith({
            where: {
                id_producto: {
                    in: [2, 3],
                },
            },
            data: {
                estatus: false,
            },
        });

        expect(result).toEqual({
            count: 2,
        });
    });

    it('debe retornar count 0 si no encuentra productos para actualizar', async () => {
        // Arrange
        prisma.productos_extra.updateMany.mockResolvedValue({
            count: 0,
        });

        // Act
        const result = await CollectionRequest.updateCompostStatus(true);

        // Assert
        expect(result).toEqual({
            count: 0,
        });
    });

    it('debe propagar el error si Prisma falla', async () => {
        prisma.productos_extra.findMany.mockRejectedValue(
            new Error('DB_ERROR')
        );

        await expect(CollectionRequest.getCompostStatus())
            .rejects
            .toThrow('DB_ERROR');
    });
});