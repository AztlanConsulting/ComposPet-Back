const collectionSummaryController = require('../../../controllers/collectionSummary.controller');
const CollectionRequest = require('../../../models/collectionRequest.model');
const Client = require('../../../models/client.model');
const Payment = require('../../../models/payment.model');

jest.mock('../../../models/collectionRequest.model');
jest.mock('../../../models/client.model');
jest.mock('../../../models/payment.model');

jest.mock('../../../utils/bucketCostMap', () => ({
  bucketCostMap: {
    0: 0,
    1: 20,
    2: 40,
    3: 60,
    4: 80,
  },
}));

describe('Controller - CollectionRequest', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('getSummary', () => {

    it('debe devolver 200 con el resumen de la solicitud', async () => {
      // Arrange
      req.body = {
        idClient: 1,
        weekStartDate: '2026-04-20',
        weekEndDate: '2026-04-26',
      };

      const mockCollection = {
        id_solicitud: 10,
        cubetas_entregadas: 2,
      };

      const mockProducts = [
        {
          cantidad: 2,
          productos_extra: { precio: 50 },
        },
      ];

      const mockBalance = { saldo: 300 };
      const mockPayments = [{ id_pago: 1, metodo: 'Efectivo' }];

      CollectionRequest.getCurrentCollectionRequest.mockResolvedValue(mockCollection);
      CollectionRequest.getProductsByCollection.mockResolvedValue(mockProducts);
      Client.getClientBalance.mockResolvedValue(mockBalance);
      Payment.getPaymentInfo.mockResolvedValue(mockPayments);

      // Act
      await collectionSummaryController.getSummary(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          collection: mockCollection,
          products: mockProducts,
          collectionTotal: expect.any(Number),
          balance: 300,
          payMethods: mockPayments,
        },
      });
    });

  });

  describe('deleteProduct', () => {

    it('debe eliminar producto y devolver 200', async () => {
      // Arrange
      req.params = {
        idProduct: '5',
        idRequest: '10',
        quantity: '3',
      };

      CollectionRequest.deleteProduct.mockResolvedValue({});
      CollectionRequest.incrementInventory.mockResolvedValue({});

      // Act
      await collectionSummaryController.deleteProduct(req, res);

      // Assert
      expect(CollectionRequest.deleteProduct).toHaveBeenCalledWith(5, '10');

      expect(CollectionRequest.incrementInventory).toHaveBeenCalledWith({
        id_producto: 5,
        cantidad: 3,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Producto eliminado',
      });
    });

    it('debe devolver 400 si faltan datos', async () => {
      // Arrange
      req.params = {
        idProduct: '',
        idRequest: '',
      };

      // Act
      await collectionSummaryController.deleteProduct(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Datos insuficientes para borrar el producto',
      });
    });

    it('debe devolver 500 si ocurre error', async () => {
      // Arrange
      req.params = {
        idProduct: '5',
        idRequest: '10',
        quantity: '1',
      };

      CollectionRequest.deleteProduct.mockRejectedValue(new Error('Error'));

      // Act
      await collectionSummaryController.deleteProduct(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al eliminar producto',
      });
    });

  });

  describe('updateCollectionTotal', () => {

    it('debe actualizar total y devolver 200', async () => {
      // Arrange
      req.body = {
        idRequest: 10,
        collectionTotal: 500,
        idPayment: 2,
        notes: 'Código de puerta: 1234',
      };

      CollectionRequest.updateCollectionTotal.mockResolvedValue({});

      // Act
      await collectionSummaryController.updateCollectionTotal(req, res);

      // Assert
      expect(CollectionRequest.updateCollectionTotal).toHaveBeenCalledWith(
        10,
        500,
        2,
        'Código de puerta: 1234'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Total actualizado',
      });
    });

    it('debe devolver 500 si ocurre error al actualizar', async () => {
      // Arrange
      req.body = {
        idRequest: 10,
      };

      CollectionRequest.updateCollectionTotal.mockRejectedValue(
        new Error('Error')
      );

      // Act
      await collectionSummaryController.updateCollectionTotal(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al actualizar el total',
      });
    });

  });

});