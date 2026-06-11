const CollectionRequest = require('../../../models/collectionRequest.model');

jest.mock('../../../config/prisma', () => {

    const prismaMock = {
        solicitudes_recoleccion: {
            findUnique: jest.fn(),
            update:     jest.fn(),
        },

        productos_solicitud: {
            deleteMany:   jest.fn(),
            createMany:   jest.fn(),
            findMany:     jest.fn(),
        },

        productos_extra: {
            findMany: jest.fn(),
            update:   jest.fn(),
        },

        formas_pago: {
            findUnique: jest.fn(),
        },

        saldo: {
            update: jest.fn(),
        },
    };

    prismaMock.$transaction = jest.fn(async (callback) => {
        return callback(prismaMock);
    });

    return prismaMock;
});

jest.mock('../../../models/client.model', () => ({
    getBucketCost: jest.fn().mockResolvedValue(100),
}));

const prisma = require('../../../config/prisma');


const BASE_REQUEST = {
    id_solicitud:          15,
    id_cliente:            42,
    total_a_pagar:         200,
    total_pagado:          100,
    estatus:               false,
    id_pago:               null,
    productos_solicitud:   [],
};

const PRODUCT_A = { id_producto: 1, precio: 50 };
const PRODUCT_B = { id_producto: 2, precio: 80 };


describe('Unit - Model - CollectionRequest - updateCollectionTotal', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('con forma de pago distinta a Saldo', () => {

        beforeEach(() => {
            prisma.formas_pago.findUnique.mockResolvedValue({ tipo: 'Efectivo' });
            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(BASE_REQUEST);
            prisma.solicitudes_recoleccion.update.mockResolvedValue({
                id_solicitud: 15,
                total_a_pagar: 500,
                id_pago: 2,
                notas: 'Puerta azul',
                estatus: true,
            });
        });

        it('debe actualizar total_a_pagar, notas, estatus y conectar forma de pago', async () => {

            const result = await CollectionRequest.updateCollectionTotal(15, 500, 2, 'Puerta azul');

            expect(prisma.solicitudes_recoleccion.update).toHaveBeenCalledWith({
                where: { id_solicitud: 15 },
                data: {
                    total_a_pagar: 500,
                    notas:         'Puerta azul',
                    estatus:       true,
                    formas_pago: {
                        connect: { id_pago: 2 },
                    },
                },
            });

            expect(result.total_a_pagar).toBe(500);
            expect(result.estatus).toBe(true);
        });

        it('NO debe incluir total_pagado en el data cuando la forma de pago no es Saldo', async () => {
            await CollectionRequest.updateCollectionTotal(15, 500, 2, null);

            const callData = prisma.solicitudes_recoleccion.update.mock.calls[0][0].data;
            expect(callData).not.toHaveProperty('total_pagado');
        });

        it('debe admitir notas null', async () => {
            prisma.solicitudes_recoleccion.update.mockResolvedValue({
                id_solicitud: 15,
                notas: null,
            });

            const result = await CollectionRequest.updateCollectionTotal(15, 300, 2, null);

            const callData = prisma.solicitudes_recoleccion.update.mock.calls[0][0].data;
            expect(callData.notas).toBeNull();
            expect(result.notas).toBeNull();
        });

    });

    describe('con forma de pago Saldo', () => {

        beforeEach(() => {
            prisma.formas_pago.findUnique.mockResolvedValue({ tipo: 'Saldo' });
            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
                ...BASE_REQUEST,
                total_pagado: 100,
            });
            prisma.saldo.update.mockResolvedValue({});
            prisma.solicitudes_recoleccion.update.mockResolvedValue({
                id_solicitud:  15,
                total_a_pagar: 500,
                total_pagado:  500,
                estatus:       true,
            });
        });

        it('debe descontar del saldo la diferencia entre el nuevo total y lo ya pagado', async () => {

            await CollectionRequest.updateCollectionTotal(15, 500, 3, null);

            expect(prisma.saldo.update).toHaveBeenCalledWith({
                where: { id_cliente: BASE_REQUEST.id_cliente },
                data:  {
                    saldo: { decrement: 400 },
                },
            });
        });

        it('debe incluir total_pagado igual al nuevo total en el update de la solicitud', async () => {
            await CollectionRequest.updateCollectionTotal(15, 500, 3, null);

            const callData = prisma.solicitudes_recoleccion.update.mock.calls[0][0].data;
            expect(callData.total_pagado).toBe(500);
        });

        it('debe descontar 0 del saldo cuando el total_pagado anterior ya cubre el nuevo total', async () => {

            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
                ...BASE_REQUEST,
                total_pagado: 500,
            });

            await CollectionRequest.updateCollectionTotal(15, 500, 3, null);

            const decrementArg =
                prisma.saldo.update.mock.calls[0][0].data.saldo.decrement;
            expect(decrementArg).toBe(0);
        });

    });


    describe('manejo de errores', () => {

        it('debe propagar el error si prisma.$transaction lanza', async () => {
            prisma.$transaction.mockRejectedValueOnce(new Error('DB connection lost'));

            await expect(
                CollectionRequest.updateCollectionTotal(15, 500, 2, null)
            ).rejects.toThrow('DB connection lost');
        });

    });

});

describe('Unit - Model - CollectionRequest - updateRequest', () => {

    const REQUEST_DATA = {
        id_solicitud:          15,
        id_cliente:            42,
        cubetas_recolectadas:  3,
        cubetas_entregadas:    2,
        notas:                 'NA',
        total_pagado:          150,
        quiere_productos_extra: true,
        quiere_recoleccion:    true,
        id_pago:               1,
        horario:               '10:30',
    };

    const CURRENT_REQUEST_NO_PRODUCTS = {
        ...BASE_REQUEST,
        productos_solicitud: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();

        prisma.formas_pago.findUnique.mockResolvedValue({
            id_pago: 1,
        });

        prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
            ...CURRENT_REQUEST_NO_PRODUCTS,
        });

        prisma.solicitudes_recoleccion.update.mockResolvedValue({
            id_solicitud: 15,
        });

        prisma.productos_extra.findMany.mockResolvedValue([PRODUCT_A, PRODUCT_B]);
        prisma.productos_solicitud.deleteMany.mockResolvedValue({ count: 0 });
        prisma.productos_solicitud.createMany.mockResolvedValue({ count: 0 });
        prisma.productos_extra.update.mockResolvedValue({});
    });

    describe('flujo principal', () => {

        it('debe llamar a update de solicitud con los campos correctos', async () => {
            await CollectionRequest.updateRequest(REQUEST_DATA, []);

            expect(prisma.solicitudes_recoleccion.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id_solicitud: 15 },
                    data: expect.objectContaining({
                        cubetas_recolectadas:   3,
                        cubetas_entregadas:     2,
                        notas:                  'NA',
                        total_pagado:           150,
                        quiere_productos_extra: true,
                        quiere_recoleccion:     true,
                        id_pago:                1,
                    }),
                })
            );
        });

        it('debe convertir horario a objeto Date con formato ISO', async () => {
            await CollectionRequest.updateRequest(REQUEST_DATA, []);

            const callData = prisma.solicitudes_recoleccion.update.mock.calls[0][0].data;
            expect(callData.horario).toBeInstanceOf(Date);
            expect(callData.horario.toISOString()).toContain('10:30');
        });

        it('debe establecer horario null cuando no se proporciona', async () => {
            const dataWithoutSchedule = { ...REQUEST_DATA, horario: null };

            await CollectionRequest.updateRequest(dataWithoutSchedule, []);

            const callData = prisma.solicitudes_recoleccion.update.mock.calls[0][0].data;

            expect(callData.horario).toBeNull();
        });

        it('debe eliminar los productos previos y crear los nuevos en cada actualización', async () => {
            const products = [{ id_producto: 1, cantidad: 2 }];

            await CollectionRequest.updateRequest(REQUEST_DATA, products);

            expect(prisma.productos_solicitud.deleteMany).toHaveBeenCalledWith({
                where: { id_solicitud: 15 },
            });

            expect(prisma.productos_solicitud.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id_solicitud: 15,
                        id_producto:  1,
                        cantidad:     2,
                    }),
                ]),
            });
        });

        it('NO debe llamar a createMany si no hay productos nuevos', async () => {
            await CollectionRequest.updateRequest(REQUEST_DATA, []);

            expect(prisma.productos_solicitud.createMany).not.toHaveBeenCalled();
        });

        it('debe retornar el resultado del update de la solicitud', async () => {
            const result = await CollectionRequest.updateRequest(REQUEST_DATA, []);

            expect(result).toEqual({ id_solicitud: 15 });
        });

    });

    describe('cálculo de total_a_pagar', () => {

        it('debe calcular total como costo de cubetas más costo de productos', async () => {

            const products = [{ id_producto: 1, cantidad: 2 }];
            prisma.productos_extra.findMany.mockResolvedValue([PRODUCT_A]);

            await CollectionRequest.updateRequest(REQUEST_DATA, products);

            const callData = prisma.solicitudes_recoleccion.update.mock.calls[0][0].data;

            expect(callData.total_a_pagar).toBeGreaterThanOrEqual(100);
        });

        it('debe lanzar error cuando cubetas_entregadas es mayor a 20', async () => {

            const dataInvalid = {
                ...REQUEST_DATA,
                cubetas_entregadas: 9999,
            };

            await expect(
                CollectionRequest.updateRequest(dataInvalid, [])
            ).rejects.toThrow(
                'Error al actualizar la solicitud de recolección'
            );
        });

        it('debe consultar los precios solo de los productos enviados', async () => {
            const products = [
                { id_producto: 1, cantidad: 1 },
                { id_producto: 2, cantidad: 1 },
            ];

            await CollectionRequest.updateRequest(REQUEST_DATA, products);

            expect(prisma.productos_extra.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        id_producto: { in: [1, 2] },
                    },
                })
            );
        });

    });

    describe('reconciliación de inventario', () => {

        it('debe decrementar inventario cuando aumenta la cantidad de un producto', async () => {

            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
                ...CURRENT_REQUEST_NO_PRODUCTS,
                productos_solicitud: [{ id_producto: 1, cantidad: 1 }],
            });

            await CollectionRequest.updateRequest(REQUEST_DATA, [
                { id_producto: 1, cantidad: 3 },
            ]);

            expect(prisma.productos_extra.update).toHaveBeenCalledWith({
                where: { id_producto: 1 },
                data:  { cantidad: { decrement: 2 } },
            });
        });

        it('debe incrementar inventario cuando disminuye la cantidad de un producto', async () => {

            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
                ...CURRENT_REQUEST_NO_PRODUCTS,
                productos_solicitud: [{ id_producto: 1, cantidad: 5 }],
            });

            await CollectionRequest.updateRequest(REQUEST_DATA, [
                { id_producto: 1, cantidad: 2 },
            ]);

            expect(prisma.productos_extra.update).toHaveBeenCalledWith({
                where: { id_producto: 1 },
                data:  { cantidad: { increment: 3 } },
            });
        });

        it('debe incrementar inventario cuando se elimina un producto que antes existía', async () => {
            
            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
                ...CURRENT_REQUEST_NO_PRODUCTS,
                productos_solicitud: [{ id_producto: 2, cantidad: 4 }],
            });

            await CollectionRequest.updateRequest(REQUEST_DATA, []);

            expect(prisma.productos_extra.update).toHaveBeenCalledWith({
                where: { id_producto: 2 },
                data:  { cantidad: { increment: 4 } },
            });
        });

        it('debe decrementar inventario cuando se agrega un producto que antes no existía', async () => {

            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
                ...CURRENT_REQUEST_NO_PRODUCTS,
                productos_solicitud: [],
            });

            await CollectionRequest.updateRequest(REQUEST_DATA, [
                { id_producto: 1, cantidad: 3 },
            ]);

            expect(prisma.productos_extra.update).toHaveBeenCalledWith({
                where: { id_producto: 1 },
                data:  { cantidad: { decrement: 3 } },
            });
        });

        it('NO debe llamar a productos_extra.update si la cantidad no cambió', async () => {
            
            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
                ...CURRENT_REQUEST_NO_PRODUCTS,
                productos_solicitud: [{ id_producto: 1, cantidad: 2 }],
            });

            await CollectionRequest.updateRequest(REQUEST_DATA, [
                { id_producto: 1, cantidad: 2 },
            ]);

            expect(prisma.productos_extra.update).not.toHaveBeenCalled();
        });

    });

    describe('manejo de errores', () => {

        it('debe lanzar error si la solicitud no existe', async () => {
            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(null);

            await expect(
                CollectionRequest.updateRequest(REQUEST_DATA, [])
            ).rejects.toThrow('Error al actualizar la solicitud de recolección');
        });

        it('debe lanzar error si prisma.$transaction falla', async () => {
            prisma.$transaction.mockRejectedValueOnce(new Error('Timeout'));

            await expect(
                CollectionRequest.updateRequest(REQUEST_DATA, [])
            ).rejects.toThrow('Error al actualizar la solicitud de recolección');
        });

    });

});