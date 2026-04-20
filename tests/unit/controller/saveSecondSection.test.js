const collectionRequestController = require('../../../controllers/collectionRequest.controller');
const CollectionRequest = require('../../../models/collectionRequest.model');

jest.mock('../../../models/collectionRequest.model');

describe('Controller - saveSecondSection', () => {
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

  it('debe devolver 400 si faltan datos requeridos', async () => {
    // Arrange
    req.body = {};

    // Act
    await collectionRequestController.saveSecondSection(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Faltan datos requeridos para guardar la segunda sección de la solicitud de recolección.',
    });
  });

  it('debe devolver 400 si algún producto no incluye id_producto y cantidad', async () => {
    // Arrange
    req.body = {
      requestIDReceived: 'request-123',
      products: [{ id_producto: 1 }],
    };

    // Act
    await collectionRequestController.saveSecondSection(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Cada producto debe incluir id_producto y cantidad.',
    });
  });

  it('debe guardar correctamente la segunda sección', async () => {
    // Arrange
    req.body = {
      requestIDReceived: 'request-123',
      products: [
        { id_producto: 1, cantidad: 2 },
        { id_producto: 2, cantidad: 1 },
      ],
    };

    CollectionRequest.getInfoAboutExtraProuctsSelected.mockResolvedValue([
      { id_producto: 3, cantidad: 1 },
    ]);

    CollectionRequest.incrementInventory.mockResolvedValue();
    CollectionRequest.substractInventory.mockResolvedValue();
    CollectionRequest.saveSecondSection.mockResolvedValue({
      message: 'Productos guardados correctamente',
    });

    // Act
    await collectionRequestController.saveSecondSection(req, res);

    // Assert
    expect(CollectionRequest.getInfoAboutExtraProuctsSelected).toHaveBeenCalledWith('request-123');
    expect(CollectionRequest.incrementInventory).toHaveBeenCalledTimes(1);
    expect(CollectionRequest.substractInventory).toHaveBeenCalledTimes(2);
    expect(CollectionRequest.saveSecondSection).toHaveBeenCalledWith('request-123', [
      { id_producto: 1, cantidad: 2 },
      { id_producto: 2, cantidad: 1 },
    ]);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Segunda sección de la solicitud de recolección guardada exitosamente.',
      data: {
        message: 'Productos guardados correctamente',
      },
    });
  });

  it('debe actualizar quiere_productos_extra en false si no se envían productos', async () => {
    // Arrange
    req.body = {
      requestIDReceived: 'request-123',
      products: [],
    };

    CollectionRequest.updateWantsRequestAttribute.mockResolvedValue();
    CollectionRequest.getInfoAboutExtraProuctsSelected.mockResolvedValue([]);
    CollectionRequest.saveSecondSection.mockResolvedValue({
      message: 'Productos guardados correctamente',
    });

    // Act
    await collectionRequestController.saveSecondSection(req, res);

    // Assert
    expect(CollectionRequest.updateWantsRequestAttribute).toHaveBeenCalledWith(
      'request-123',
      false
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('debe devolver 500 si ocurre un error inesperado', async () => {
    // Arrange
    req.body = {
      requestIDReceived: 'request-123',
      products: [{ id_producto: 1, cantidad: 2 }],
    };

    CollectionRequest.getInfoAboutExtraProuctsSelected.mockRejectedValue(
      new Error('Error interno')
    );

    // Act
    await collectionRequestController.saveSecondSection(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error de la aplicacion al guardar la segunda sección de la solicitud de recolección.',
      error: expect.any(Error),
    });
  });
});