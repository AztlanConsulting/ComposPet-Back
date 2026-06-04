const CollectionRequest = require('../../../models/collectionRequest.model');
const prisma = require('../../../config/prisma');

jest.mock('../../../config/prisma', () => ({
  productos_solicitud: {
    findMany: jest.fn(),
  },
}));

describe('Model - getInfoAboutExtraProuctsSelected', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener los productos extra previamente seleccionados', async () => {
    // Arrange
    const requestID = 'request-123';
    const mockData = [
      { id_producto: 1, cantidad: 2 },
      { id_producto: 2, cantidad: 1 },
    ];

    prisma.productos_solicitud.findMany.mockResolvedValue(mockData);

    // Act
    const result = await CollectionRequest.getInfoAboutExtraProuctsSelected(requestID);

    // Assert
    expect(prisma.productos_solicitud.findMany).toHaveBeenCalledWith({
      where: {
        id_solicitud: requestID,
      },
      select: {
        id_producto: true,
        cantidad: true,
      },
    });

    expect(result).toEqual(mockData);
  });

  it('debe regresar un arreglo vacío si no hay productos seleccionados', async () => {
    // Arrange
    const requestID = 'request-123';
    prisma.productos_solicitud.findMany.mockResolvedValue([]);

    // Act
    const result = await CollectionRequest.getInfoAboutExtraProuctsSelected(requestID);

    // Assert
    expect(result).toEqual([]);
  });
});