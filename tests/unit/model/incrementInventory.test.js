const CollectionRequest = require('../../../models/collectionRequest.model');
const prisma = require('../../../config/prisma');

jest.mock('../../../config/prisma', () => ({
  productos_extra: {
    update: jest.fn(),
  },
}));

describe('Model - incrementInventory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe incrementar inventario de un producto extra', async () => {
    // Arrange
    const product = {
      id_producto: 1,
      cantidad: 3,
    };

    prisma.productos_extra.update.mockResolvedValue({});

    // Act
    await CollectionRequest.incrementInventory(product);

    // Assert
    expect(prisma.productos_extra.update).toHaveBeenCalledWith({
      where: {
        id_producto: product.id_producto,
      },
      data: {
        cantidad: {
          increment: product.cantidad,
        },
      },
    });
  });
});