const collectionRequestController = require('../../../controllers/collectionRequest.controller');
const CollectionRequest = require('../../../models/collectionRequest.model');

jest.mock('../../../models/collectionRequest.model');

describe('Controller - getLastRequestPerClient', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('debe devolver 400 si no se envía idClient', async () => {
    // Act
    await collectionRequestController.getLastRequestPerClient(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El id del cliente es requerido.',
    });
  });

  it('debe devolver 200 con la última solicitud del cliente', async () => {
    // Arrange
    req.body.idClient = 'client-123';

    const mockRequest = {
      id_solicitud: 'request-999',
    };

    CollectionRequest.getLastRequestPerClient.mockResolvedValue(mockRequest);

    // Act
    await collectionRequestController.getLastRequestPerClient(req, res);

    // Assert
    expect(CollectionRequest.getLastRequestPerClient).toHaveBeenCalledWith('client-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: mockRequest,
    });
  });

  it('debe devolver 500 si ocurre un error del servidor', async () => {
    // Arrange
    req.body.idClient = 'client-123';

    CollectionRequest.getLastRequestPerClient.mockRejectedValue(
      new Error('Error interno')
    );

    // Act
    await collectionRequestController.getLastRequestPerClient(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error servidor al obtener la última solicitud.',
      error: expect.any(Error),
    });
  });
});