const {
    updateRequest,
    getEditTableInfo,
} = require('../../../controllers/tableRoutes.controller');

const CollectionRequest = require('../../../models/collectionRequest.model');
const Payment = require('../../../models/payment.model');

jest.mock('../../../models/collectionRequest.model');
jest.mock('../../../models/payment.model');


describe('Controller - getEditTableInfo', () => {
    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('debe retornar 200 con métodos de pago y productos extra', async () => {
        const mockPayMethods = [{ id: 1, nombre: 'Efectivo' }];
        const mockExtraProducts = [{ id: 1, nombre: 'Composta' }];

        Payment.getPaymentInfo.mockResolvedValue(mockPayMethods);
        CollectionRequest.getExtraProducts.mockResolvedValue(mockExtraProducts);

        await getEditTableInfo(req, res);

        expect(Payment.getPaymentInfo).toHaveBeenCalled();
        expect(CollectionRequest.getExtraProducts).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            payMethods: mockPayMethods,
            extraProducts: mockExtraProducts,
        });
    });

    it('debe retornar 500 si Payment.getPaymentInfo falla', async () => {
        Payment.getPaymentInfo.mockRejectedValue(new Error('DB Error'));

        await getEditTableInfo(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Ocurrió un error obteniendo la información.',
        });
    });

    it('debe retornar 500 si CollectionRequest.getExtraProducts falla', async () => {
        Payment.getPaymentInfo.mockResolvedValue([]);
        CollectionRequest.getExtraProducts.mockRejectedValue(new Error('DB Error'));

        await getEditTableInfo(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Ocurrió un error obteniendo la información.',
        });
    });
});

describe('Controller - updateRequest', () => {
    let req, res;

    const baseData = {
        requestId: '11-11-11',
        collectedBuckets: 3,
        deliveredBuckets: 2,
        notes: 'Puerta azul',
        paymentId: 1,
        totalPaid: '160',
        schedule: '10:00',
        wantsCollection: true,
        wantsExtraProducts: false,
        extraProductsDetails: [],
        extraProductsArray: { 5: 2 },
    };

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        CollectionRequest.updateRequest.mockResolvedValue();
    });

    it('debe retornar 200 cuando la actualización es exitosa', async () => {
        req = { body: { data: baseData } };

        await updateRequest(req, res);

        expect(CollectionRequest.updateRequest).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('debe llamar a updateRequest con requestData y productsData correctos', async () => {
        req = { body: { data: baseData } };

        await updateRequest(req, res);

        const [requestData, productsData] = CollectionRequest.updateRequest.mock.calls[0];

        expect(requestData.id_solicitud).toBe('11-11-11');
        expect(requestData.cubetas_recolectadas).toBe(3);
        expect(requestData.cubetas_entregadas).toBe(2);
        expect(requestData.notas).toBe('Puerta azul');
        expect(requestData.id_pago).toBe(1);
        expect(requestData.total_pagado).toBe('160');
        expect(requestData.horario).toBe('10:00');

        expect(productsData).toEqual([
            { id_solicitud: '11-11-11', id_producto: 5, cantidad: 2 },
        ]);
    });

    it('debe retornar 500 si CollectionRequest.updateRequest falla', async () => {
        CollectionRequest.updateRequest.mockRejectedValue(new Error('DB Error'));
        req = { body: { data: baseData } };

        await updateRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'DB Error',
        });
    });

    it('debe usar mensaje genérico si el error no tiene message', async () => {
        CollectionRequest.updateRequest.mockRejectedValue({});
        req = { body: { data: baseData } };

        await updateRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Ocurrió un error actualizando la información',
        });
    });
});

describe('structureRequestData - lógica de negocio vía updateRequest', () => {
    let res;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        CollectionRequest.updateRequest.mockResolvedValue();
    });

    it('quiere_recoleccion = false si collectedBuckets y deliveredBuckets son 0', async () => {
        const req = {
            body: {
                data: {
                    requestId: '22-22-22',
                    collectedBuckets: 0,
                    deliveredBuckets: 0,
                    extraProductsDetails: [],
                    extraProductsArray: {},
                },
            },
        };

        await updateRequest(req, res);

        const [requestData] = CollectionRequest.updateRequest.mock.calls[0];
        expect(requestData.quiere_recoleccion).toBe(false);
    });

    it('quiere_recoleccion = true si collectedBuckets y deliveredBuckets son > 0', async () => {
        const req = {
            body: {
                data: {
                    requestId: '33-33-33',
                    collectedBuckets: 2,
                    deliveredBuckets: 1,
                    extraProductsDetails: [],
                    extraProductsArray: {},
                },
            },
        };

        await updateRequest(req, res);

        const [requestData] = CollectionRequest.updateRequest.mock.calls[0];
        expect(requestData.quiere_recoleccion).toBe(true);
    });

    it('quiere_productos_extra = false si extraProductsDetails está vacío', async () => {
        const req = {
            body: {
                data: {
                    requestId: '44-44-44',
                    collectedBuckets: 1,
                    deliveredBuckets: 1,
                    extraProductsDetails: [],
                    wantsExtraProducts: false,
                    extraProductsArray: {},
                },
            },
        };

        await updateRequest(req, res);

        const [requestData] = CollectionRequest.updateRequest.mock.calls[0];
        expect(requestData.quiere_productos_extra).toBe(false);
    });

    it('quiere_productos_extra = true si extraProductsDetails tiene items y wantsExtraProducts es false', async () => {
        const req = {
            body: {
                data: {
                    requestId: '55-55-55',
                    collectedBuckets: 1,
                    deliveredBuckets: 1,
                    extraProductsDetails: [{ id: 1 }],
                    wantsExtraProducts: false,
                    extraProductsArray: { 1: 1 },
                },
            },
        };

        await updateRequest(req, res);

        const [requestData] = CollectionRequest.updateRequest.mock.calls[0];
        expect(requestData.quiere_productos_extra).toBe(true);
    });

    it('productsData es un arreglo vacío si extraProductsArray está vacío', async () => {
        const req = {
            body: {
                data: {
                    requestId: '66-66-66',
                    collectedBuckets: 0,
                    deliveredBuckets: 0,
                    extraProductsDetails: [],
                    extraProductsArray: {},
                },
            },
        };

        await updateRequest(req, res);

        const [, productsData] = CollectionRequest.updateRequest.mock.calls[0];
        expect(productsData).toEqual([]);
    });

    it('productsData mapea correctamente múltiples productos', async () => {
        const req = {
            body: {
                data: {
                    requestId: '77-77-77',
                    collectedBuckets: 1,
                    deliveredBuckets: 1,
                    extraProductsDetails: [{ id: 2 }, { id: 3 }],
                    wantsExtraProducts: false,
                    extraProductsArray: { 2: 3, 3: 1 },
                },
            },
        };

        await updateRequest(req, res);

        const [, productsData] = CollectionRequest.updateRequest.mock.calls[0];
        expect(productsData).toEqual(
            expect.arrayContaining([
                { id_solicitud: '77-77-77', id_producto: 2, cantidad: 3 },
                { id_solicitud: '77-77-77', id_producto: 3, cantidad: 1 },
            ])
        );
    });
});