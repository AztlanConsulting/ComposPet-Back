const CollectionRequest = require('../../../models/collectionRequest.model');
const prisma = require('../../../config/prisma');

jest.mock('../../../config/prisma', () => ({
  solicitudes_recoleccion: {
    update: jest.fn(),
  },
}));

describe('Model - updateWantsRequestAttribute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe actualizar el atributo quiere_productos_extra', async () => {
    // Arrange
    const requestID = 'request-123';
    const value = true;

    prisma.solicitudes_recoleccion.update.mockResolvedValue({});

    // Act
    await CollectionRequest.updateWantsRequestAttribute(requestID, value);

    // Assert
    expect(prisma.solicitudes_recoleccion.update).toHaveBeenCalledWith({
      where: {
        id_solicitud: requestID,
      },
      data: {
        quiere_productos_extra: value,
      },
    });
  });
});