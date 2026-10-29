jest.mock('../../../config/prisma', () => ({
    ruta: { findMany: jest.fn() },
}));

const prisma = require('../../../config/prisma');
const Route = require('../../../models/route.model');

describe('Route.findAllDaysOfRoute (Prisma simulado)', () => {
    it('consulta únicamente el catálogo y lo entrega ordenado', async () => {
        const rows = Object.freeze([
            Object.freeze({ id_ruta: 2, dia_ruta: 'Martes', orden: 1 }),
            Object.freeze({ id_ruta: 1, dia_ruta: 'Lunes - A', orden: 3 }),
            Object.freeze({ id_ruta: 9, dia_ruta: 'Lunes - B', orden: 2 }),
        ]);
        prisma.ruta.findMany.mockResolvedValue(rows);

        const result = await Route.findAllDaysOfRoute();

        expect(prisma.ruta.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.ruta.findMany).toHaveBeenCalledWith({
            select: { id_ruta: true, dia_ruta: true, orden: true },
        });
        expect(result).toEqual([rows[2], rows[1], rows[0]]);
    });

    it('propaga errores de consulta sin realizar escrituras', async () => {
        const error = new Error('consulta fallida');
        prisma.ruta.findMany.mockRejectedValue(error);
        await expect(Route.findAllDaysOfRoute()).rejects.toBe(error);
    });
});
