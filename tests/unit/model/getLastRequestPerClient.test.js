const CollectionRequest = require('../../../models/collectionRequest.model');
const prisma = require('../../../config/prisma');

jest.mock('../../../config/prisma', () => ({
  solicitudes_recoleccion: {
    findFirst: jest.fn(),
  },
}));

describe('Model - getLastRequestPerClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener el id de la última solicitud del cliente', async () => {
    // Arrange
    const idClient = 'client-123';
    const mockRequest = { id_solicitud: 'request-999' };

    prisma.solicitudes_recoleccion.findFirst.mockResolvedValue(mockRequest);

    // Act
    const result = await CollectionRequest.getLastRequestPerClient(idClient);

    // Assert
    expect(prisma.solicitudes_recoleccion.findFirst).toHaveBeenCalledWith({
      where: {
        id_cliente: idClient,
      },
      orderBy: {
        fecha: 'desc',
      },
      select: {
        id_solicitud: true,
      },
    });

    expect(result).toEqual(mockRequest);
  });

  it('debe regresar null si el cliente no tiene solicitudes', async () => {
    // Arrange
    const idClient = 'client-123';
    prisma.solicitudes_recoleccion.findFirst.mockResolvedValue(null);

    // Act
    const result = await CollectionRequest.getLastRequestPerClient(idClient);

    // Assert
    expect(result).toBeNull();
  });
});