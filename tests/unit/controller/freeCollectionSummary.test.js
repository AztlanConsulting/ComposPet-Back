jest.mock('../../../config/prisma', () => ({
    cliente: { findUnique: jest.fn() },
    precios_cubetas: { findFirst: jest.fn() },
}));
jest.mock('../../../models/collectionRequest.model', () => ({
    getCurrentCollectionRequest: jest.fn(), getProductsByCollection: jest.fn(),
}));
jest.mock('../../../models/payment.model', () => ({ getPaymentInfo: jest.fn() }));
const prisma = require('../../../config/prisma');
const Client = require('../../../models/client.model');
const CollectionRequest = require('../../../models/collectionRequest.model');
const Payment = require('../../../models/payment.model');
const { getSummary } = require('../../../controllers/collectionSummary.controller');

afterEach(() => jest.restoreAllMocks());

test.each([
    ['normal', 90, [0], [1], 90],
    ['pension', 150, [0, 50], [2, 1], 200],
    ['gratis', 0, [], [], 0],
    ['gratis', 0, [0], [2], 0],
    ['gratis', 0, [50], [1], 50],
    ['gratis', 0, [0, 50], [2, 1], 50],
    ['gratis', 37.5, [0, 50], [2, 1], 87.5],
])('resumen %s, tarifa %s, productos %j', async (priceType, cost, prices, quantities, total) => {
    const collection = { id_solicitud: 'request-1', id_cliente: 'client-1', cubetas_recolectadas: 2 };
    const products = prices.map((precio, i) => ({ cantidad: quantities[i], productos_extra: { precio } }));
    CollectionRequest.getCurrentCollectionRequest.mockResolvedValue(collection);
    CollectionRequest.getProductsByCollection.mockResolvedValue(products);
    prisma.cliente.findUnique.mockResolvedValue({ tipo_precio: priceType });
    prisma.precios_cubetas.findFirst.mockResolvedValue({ [priceType]: cost });
    jest.spyOn(Client, 'getClientBalance').mockResolvedValue({ saldo: 123 });
    Payment.getPaymentInfo.mockResolvedValue([{ id_pago: 1, tipo: 'Efectivo' }]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getSummary({ body: { idClient: 'client-1' } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: {
        collection, products, collectionTotal: total, balance: 123,
        payMethods: [{ id_pago: 1, tipo: 'Efectivo' }], bucketCost: cost, priceType,
    } });
    expect(prisma.precios_cubetas.findFirst).toHaveBeenCalledWith({
        where: { cantidad: 2 }, select: { [priceType]: true },
    });
});
