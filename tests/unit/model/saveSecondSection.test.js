const CollectionRequest = require('../../../models/collectionRequest.model');
const prisma = require('../../../config/prisma');

jest.mock('../../../config/prisma', () => ({
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
    });

    prisma.productos_solicitud.deleteMany.mockResolvedValue({});
    prisma.productos_solicitud.create.mockResolvedValue({});

    // Act
    const result = await CollectionRequest.saveSecondSection(requestID, products);

    // Assert
    expect(prisma.solicitudes_recoleccion.findUnique).toHaveBeenCalledWith({
      where: { id_solicitud: requestID },
    });

    expect(prisma.productos_solicitud.deleteMany).toHaveBeenCalledWith({
      where: { id_solicitud: requestID },
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
    const products = [{ id_producto: 1, cantidad: 2 }];

    prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      CollectionRequest.saveSecondSection(requestID, products)
    ).rejects.toThrow('Solicitud no encontrada');

    expect(prisma.productos_solicitud.deleteMany).not.toHaveBeenCalled();
    expect(prisma.productos_solicitud.create).not.toHaveBeenCalled();
  });
});