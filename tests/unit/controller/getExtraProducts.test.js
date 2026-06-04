const collectionRequestController = require('../../../controllers/collectionRequest.controller');
const CollectionRequest = require('../../../models/collectionRequest.model');

jest.mock('../../../models/collectionRequest.model');

describe('Controller - getExtraProducts', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('debe devolver 200 con los productos extra', async () => {
    // Arrange
    const mockProducts = [
      { id_producto: 1, nombre: 'Composta' },
      { id_producto: 2, nombre: 'Tierra' },
    ];

    CollectionRequest.getExtraProducts.mockResolvedValue(mockProducts);

    // Act
    await collectionRequestController.getExtraProducts(req, res);

    // Assert
    expect(CollectionRequest.getExtraProducts).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Productos extra obtenidos exitosamente.',
      data: mockProducts,
    });
  });

  it('debe devolver 404 si no encuentra productos extra', async () => {
    // Arrange
    CollectionRequest.getExtraProducts.mockRejectedValue(
      new Error('PRODUCTOS_EXTRA_NO_ENCONTRADOS')
    );

    // Act
    await collectionRequestController.getExtraProducts(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No se encontraron productos extra.',
    });
  });
});