const CollectionRequest = require('../../../models/collectionRequest.model');

jest.mock('../../../config/prisma', () => ({
  productos_extra: {
    findMany: jest.fn(),
  },
}));

const prisma = require('../../../config/prisma');

describe('Unit - Model - getExtraProducts', () => {

  it('debe retornar productos activos', async () => {
    // Arrange
    prisma.productos_extra.findMany.mockResolvedValue([
      { id_producto: 1, nombre: 'Composta' }
    ]);

    // Act
    const result = await CollectionRequest.getExtraProducts();

    // Assert
    expect(result.length).toBe(1);
    expect(prisma.productos_extra.findMany).toHaveBeenCalled();
  });

  it('debe lanzar error si no hay productos', async () => {
    prisma.productos_extra.findMany.mockResolvedValue([]);

    await expect(CollectionRequest.getExtraProducts())
      .rejects
      .toThrow('PRODUCTOS_EXTRA_NO_ENCONTRADOS');
  });

});