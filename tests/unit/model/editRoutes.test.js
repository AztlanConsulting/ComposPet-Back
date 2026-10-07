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
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    prismaMock.$transaction = jest.fn(async (callback) => {
        return callback(prismaMock);
    });

    return prismaMock;
});

jest.mock('../../../models/client.model', () => ({
    getClientBalance: jest.requireActual('../../../models/client.model').getClientBalance,
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

        it.each(['Efectivo', 'Transferencia'])('conserva el pago previo y el cargo para %s sin consultar saldo', async (tipo) => {
            prisma.formas_pago.findUnique.mockResolvedValue({ tipo });

            await CollectionRequest.updateCollectionTotal(15, 500, 2, null);

            const callData = prisma.solicitudes_recoleccion.update.mock.calls[0][0].data;
            expect(callData).not.toHaveProperty('total_pagado');
            expect(prisma.saldo.findUnique).not.toHaveBeenCalled();
            expect(prisma.saldo.update).toHaveBeenCalledWith({
                where: { id_cliente: BASE_REQUEST.id_cliente },
                data: { saldo: { decrement: 300 } },
            });
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
            prisma.saldo.findUnique.mockResolvedValue({ saldo: 500 });
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

        it('debe descontar del saldo la diferencia entre el nuevo costo y el costo ya aplicado', async () => {

            await CollectionRequest.updateCollectionTotal(15, 500, 3, null);

            expect(prisma.saldo.update).toHaveBeenCalledWith({
                where: { id_cliente: BASE_REQUEST.id_cliente },
                data:  {
                    saldo: { decrement: 300 },
                },
            });
        });

        it('conserva el pago previo y suma solo el incremento cubierto por saldo', async () => {
            await CollectionRequest.updateCollectionTotal(15, 500, 3, null);

            const callData = prisma.solicitudes_recoleccion.update.mock.calls[0][0].data;
            expect(callData.total_pagado).toBe(400);
        });

        it('no debe modificar el saldo cuando el costo anterior ya coincide con el nuevo total', async () => {

            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
                ...BASE_REQUEST,
                total_a_pagar: 500,
                total_pagado: 500,
            });

            await CollectionRequest.updateCollectionTotal(15, 500, 3, null);

            expect(prisma.saldo.update).not.toHaveBeenCalled();
        });

        it.each([
            [150, 90, 60],
            [90, 90, 0],
            [30, 30, -60],
            [0, 0, -90],
            [-90, 0, -180],
        ])('con saldo previo %s registra total_pagado %s y deja saldo final %s', async (initialBalance, expectedPaid, expectedBalance) => {
            const { Prisma } = require('../../../generated/prisma');
            let balance = new Prisma.Decimal(initialBalance);
            const request = {
                ...BASE_REQUEST,
                total_pagado: new Prisma.Decimal(0),
                total_a_pagar: new Prisma.Decimal(0),
            };
            // Un cliente distinto permite detectar consultas fuera de la transacción.
            const tx = {
                solicitudes_recoleccion: {
                    findUnique: jest.fn().mockResolvedValue(request),
                    update: jest.fn(async ({ data }) => ({ ...request, ...data })),
                },
                formas_pago: {
                    findUnique: jest.fn().mockResolvedValue({ tipo: 'Saldo' }),
                },
                saldo: {
                    findUnique: jest.fn(async () => ({ saldo: balance })),
                    update: jest.fn(async ({ data }) => {
                        balance = balance.minus(data.saldo.decrement);
                        return { saldo: balance };
                    }),
                },
            };
            prisma.$transaction.mockImplementationOnce(async (callback) => callback(tx));

            const result = await CollectionRequest.updateCollectionTotal(15, '90', 3, null);

            expect(result.total_a_pagar).toBe(90);
            expect(result.total_pagado).toBe(expectedPaid);
            expect(result.estatus).toBe(true);
            expect(Number(balance)).toBe(expectedBalance);
            expect(tx.saldo.findUnique).toHaveBeenCalledTimes(1);
            expect(tx.saldo.findUnique).toHaveBeenCalledWith({
                where: { id_cliente: BASE_REQUEST.id_cliente },
            });
            expect(tx.saldo.update).toHaveBeenCalledTimes(1);
            expect(tx.saldo.update).toHaveBeenCalledWith({
                where: { id_cliente: BASE_REQUEST.id_cliente },
                data: { saldo: { decrement: 90 } },
            });
            expect(tx.saldo.findUnique.mock.invocationCallOrder[0])
                .toBeLessThan(tx.saldo.update.mock.invocationCallOrder[0]);
            expect(prisma.saldo.findUnique).not.toHaveBeenCalled();
            expect(prisma.saldo.update).not.toHaveBeenCalled();
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

describe('Unit - Model - CollectionRequest - pago parcial con Saldo y liquidación administrativa', () => {
    it.each([
        [90, 60, 0],
        [120, 90, 30],
    ])('con pago administrativo %s abona la diferencia %s y deja saldo %s sin duplicarlo', async (adminPaid, paymentDifference, finalBalance) => {
        jest.clearAllMocks();
        const { Prisma } = require('../../../generated/prisma');
        const Client = require('../../../models/client.model');
        let balance = new Prisma.Decimal(30);
        let request = {
            ...BASE_REQUEST,
            cubetas_recolectadas: 1,
            cubetas_entregadas: 0,
            total_a_pagar: new Prisma.Decimal(0),
            total_pagado: new Prisma.Decimal(0),
            quiere_recoleccion: true,
            quiere_productos_extra: false,
        };
        const tx = {
            solicitudes_recoleccion: {
                findUnique: jest.fn(async () => ({ ...request })),
                update: jest.fn(async ({ data }) => {
                    request = {
                        ...request,
                        ...data,
                        total_a_pagar: new Prisma.Decimal(data.total_a_pagar),
                        total_pagado: new Prisma.Decimal(data.total_pagado),
                    };
                    return { ...request };
                }),
            },
            formas_pago: {
                findUnique: jest.fn().mockResolvedValue({ id_pago: 3, tipo: 'Saldo' }),
            },
            saldo: {
                findUnique: jest.fn(async () => ({ saldo: balance })),
                update: jest.fn(async ({ data }) => {
                    balance = balance.minus(data.saldo.decrement ?? 0)
                        .plus(data.saldo.increment ?? 0);
                    return { saldo: balance };
                }),
            },
            productos_extra: {
                findMany: jest.fn().mockResolvedValue([]),
            },
            productos_solicitud: {
                deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
        };
        prisma.$transaction
            .mockImplementationOnce(async (callback) => callback(tx))
            .mockImplementationOnce(async (callback) => callback(tx))
            .mockImplementationOnce(async (callback) => callback(tx))
            .mockImplementationOnce(async (callback) => callback(tx));
        Client.getBucketCost.mockResolvedValueOnce(90).mockResolvedValueOnce(90);

        const completed = await CollectionRequest.updateCollectionTotal(15, 90, 3, null);

        expect(Number(completed.total_a_pagar)).toBe(90);
        expect(Number(completed.total_pagado)).toBe(30);
        expect(completed.estatus).toBe(true);
        expect(Number(balance)).toBe(-60);
        expect(tx.saldo.update).toHaveBeenCalledTimes(1);
        expect(tx.saldo.update).toHaveBeenNthCalledWith(1, {
            where: { id_cliente: BASE_REQUEST.id_cliente },
            data: { saldo: { decrement: 90 } },
        });

        // El pago previo de 30 no permite completar nuevamente mientras estatus sea true.
        await expect(CollectionRequest.updateCollectionTotal(15, 90, 3, null))
            .rejects.toThrow('La solicitud de recolección ya fue enviada y no puede modificarse.');
        expect(tx.saldo.update).toHaveBeenCalledTimes(1);
        expect(tx.solicitudes_recoleccion.update).toHaveBeenCalledTimes(1);
        expect(tx.formas_pago.findUnique).toHaveBeenCalledTimes(1);

        const adminEdit = { ...completed, total_pagado: adminPaid, id_pago: 3, horario: null };
        const paid = await CollectionRequest.updateRequest(adminEdit, []);

        expect(Number(paid.total_a_pagar)).toBe(90);
        expect(Number(paid.total_pagado)).toBe(adminPaid);
        expect(Number(balance)).toBe(finalBalance);
        expect(tx.saldo.update).toHaveBeenCalledTimes(2);
        expect(tx.saldo.update).toHaveBeenNthCalledWith(2, {
            where: { id_cliente: BASE_REQUEST.id_cliente },
            data: { saldo: { increment: paymentDifference } },
        });

        // Guardar otra vez el mismo pago tampoco debe volver a abonarlo.
        const unchanged = await CollectionRequest.updateRequest(adminEdit, []);

        expect(Number(unchanged.total_a_pagar)).toBe(90);
        expect(Number(unchanged.total_pagado)).toBe(adminPaid);
        expect(Number(balance)).toBe(finalBalance);
        expect(tx.saldo.update).toHaveBeenCalledTimes(2);
        expect(prisma.$transaction).toHaveBeenCalledTimes(4);
        expect(prisma.saldo.update).not.toHaveBeenCalled();
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

        prisma.productos_extra.findMany.mockImplementation(({ where }) => {
            const requestedIds = where?.id_producto?.in ?? [];
            const catalog = [PRODUCT_A, PRODUCT_B];
            return Promise.resolve(catalog.filter(p => requestedIds.includes(p.id_producto)));
        });
        prisma.productos_solicitud.deleteMany.mockResolvedValue({ count: 0 });
        prisma.productos_solicitud.createMany.mockResolvedValue({ count: 0 });
        prisma.productos_extra.update.mockResolvedValue({});
    });

    describe('flujo principal', () => {

        it.each([
            [90, -60, 30, 30, -60],
            [120, -60, 30, 30, -90],
            [60, -60, 30, 30, -30],
            [0, -60, 30, 30, 30],
            [120, 20, 30, 50, -10],
            [90, 30, 120, 120, 30],
            [120, 30, 120, 120, 0],
            [140, 30, 120, 120, -20],
            [60, 30, 120, 120, 60],
        ])('al reabrir con costo %s, saldo %s y pago previo %s conserva pago %s y saldo %s', async (newTotal, initialBalance, previousPaid, expectedPaid, expectedBalance) => {
            const { Prisma } = require('../../../generated/prisma');
            let balance = new Prisma.Decimal(initialBalance);
            const completed = {
                ...CURRENT_REQUEST_NO_PRODUCTS,
                cubetas_recolectadas: 1,
                cubetas_entregadas: 0,
                total_a_pagar: new Prisma.Decimal(90),
                total_pagado: new Prisma.Decimal(previousPaid),
                estatus: true,
            };
            prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(completed);
            prisma.solicitudes_recoleccion.update.mockImplementationOnce(async ({ data }) => ({
                ...completed,
                ...data,
            }));
            const Client = require('../../../models/client.model');
            Client.getBucketCost.mockResolvedValueOnce(90);

            const reopened = await CollectionRequest.updateRequest({
                ...completed,
                estatus: false,
                id_pago: 3,
                horario: null,
            }, []);

            expect(reopened.estatus).toBe(false);
            expect(reopened.total_a_pagar).toBe(90);
            expect(reopened.total_pagado).toBe(previousPaid);
            expect(Number(balance)).toBe(initialBalance);
            expect(prisma.saldo.update).not.toHaveBeenCalled();
            prisma.solicitudes_recoleccion.findUnique.mockResolvedValueOnce(reopened);
            if (newTotal > 0) {
                prisma.formas_pago.findUnique.mockResolvedValueOnce({ tipo: 'Saldo' });
            }
            if (newTotal > 90 && newTotal > previousPaid) {
                prisma.saldo.findUnique.mockResolvedValueOnce({ saldo: balance });
            }
            if (newTotal !== 90) {
                prisma.saldo.update.mockImplementationOnce(async ({ data }) => {
                    balance = balance.minus(data.saldo.decrement ?? 0)
                        .plus(data.saldo.increment ?? 0);
                    return { saldo: balance };
                });
            }
            prisma.solicitudes_recoleccion.update.mockImplementationOnce(async ({ data }) => ({
                ...reopened,
                ...data,
            }));

            const recompleted = await CollectionRequest.updateCollectionTotal(15, newTotal, 3, null);

            expect(recompleted.estatus).toBe(true);
            expect(recompleted.total_a_pagar).toBe(newTotal);
            expect(recompleted.total_pagado).toBe(expectedPaid);
            expect(Number(balance)).toBe(expectedBalance);
            if (newTotal === 90) {
                expect(prisma.saldo.update).not.toHaveBeenCalled();
            } else {
                expect(prisma.saldo.update).toHaveBeenCalledTimes(1);
                expect(prisma.saldo.update).toHaveBeenCalledWith({
                    where: { id_cliente: BASE_REQUEST.id_cliente },
                    data: { saldo: newTotal > 90
                        ? { decrement: newTotal - 90 }
                        : { increment: 90 - newTotal } },
                });
            }
            expect(prisma.solicitudes_recoleccion.update).toHaveBeenCalledTimes(2);
        });

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
