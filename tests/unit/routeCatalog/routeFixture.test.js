const { createRouteFixture, upsertRouteFixture } = require('../../helpers/routeFixture');

function mockPrisma(max) {
    const tx = {
        $executeRaw: jest.fn().mockResolvedValue(0),
        ruta: {
            aggregate: jest.fn().mockResolvedValue({ _max: { orden: max } }),
            create: jest.fn().mockImplementation(async ({ data }) => data),
            upsert: jest.fn().mockImplementation(async ({ create }) => create),
        },
    };
    const prisma = { $transaction: jest.fn(async callback => callback(tx)) };
    return { tx, prisma };
}

it.each([[null, 1], [12, 13]])('asigna el siguiente orden con máximo %s', async (max, expected) => {
    const { tx, prisma } = mockPrisma(max);
    const data = Object.freeze({ id_ruta: 101, dia_ruta: 'Lunes', turno_ruta: 'Tarde' });

    const result = await createRouteFixture(prisma, { data });

    expect(result).toEqual({ ...data, orden: expected });
    expect(data).not.toHaveProperty('orden');
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: 'ReadCommitted',
    });
    expect(tx.$executeRaw.mock.calls[0][0][0]).toBe('LOCK TABLE "ruta" IN SHARE ROW EXCLUSIVE MODE');
    expect(tx.$executeRaw.mock.invocationCallOrder[0])
        .toBeLessThan(tx.ruta.aggregate.mock.invocationCallOrder[0]);
    expect(tx.ruta.aggregate.mock.invocationCallOrder[0])
        .toBeLessThan(tx.ruta.create.mock.invocationCallOrder[0]);
});

it('conserva el ID, la condición y la actualización del upsert', async () => {
    const { tx, prisma } = mockPrisma(4);
    const args = {
        where: { id_ruta: 9999 }, update: {},
        create: { id_ruta: 9999, dia_ruta: 'Ruta de prueba', turno_ruta: 'Mañana' },
    };
    await upsertRouteFixture(prisma, args);
    expect(tx.ruta.upsert).toHaveBeenCalledWith({
        ...args, create: { ...args.create, orden: 5 },
    });
    expect(tx.ruta.create).not.toHaveBeenCalled();
});

it('propaga el fallo del bloqueo sin leer ni insertar fuera de la transacción', async () => {
    const { tx, prisma } = mockPrisma(1);
    tx.$executeRaw.mockRejectedValue(new Error('bloqueo fallido'));
    await expect(createRouteFixture(prisma, { data: {} })).rejects.toThrow('bloqueo fallido');
    expect(tx.ruta.aggregate).not.toHaveBeenCalled();
    expect(tx.ruta.create).not.toHaveBeenCalled();
});

it('impide exceder el rango de Int', async () => {
    const { tx, prisma } = mockPrisma(2147483647);
    await expect(createRouteFixture(prisma, { data: {} })).rejects.toThrow('orden Int válido');
    expect(tx.ruta.create).not.toHaveBeenCalled();
});
