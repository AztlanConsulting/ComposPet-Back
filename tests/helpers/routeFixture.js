/**
 * Asigna orden a fixtures sin competir con otras suites sobre el mismo MAX.
 * Solo para pruebas: no carga Prisma ni configura conexiones por su cuenta.
 */
async function insertRouteFixture(prisma, method, args) {
    return prisma.$transaction(async (tx) => {
        // Adquirir antes de leer MAX; serializa también INSERT/UPDATE/DELETE.
        await tx.$executeRaw`LOCK TABLE "ruta" IN SHARE ROW EXCLUSIVE MODE`;
        const { _max } = await tx.ruta.aggregate({ _max: { orden: true } });
        const orden = (_max.orden ?? 0) + 1;
        if (!Number.isInteger(orden) || orden < 1 || orden > 2147483647) {
            throw new Error('No hay un orden Int válido disponible para el fixture de ruta');
        }

        const field = method === 'create' ? 'data' : 'create';
        return tx.ruta[method]({
            ...args,
            [field]: { ...args[field], orden },
        });
    }, { isolationLevel: 'ReadCommitted' });
}

const createRouteFixture = (prisma, args) => insertRouteFixture(prisma, 'create', args);
const upsertRouteFixture = (prisma, args) => insertRouteFixture(prisma, 'upsert', args);

module.exports = { createRouteFixture, upsertRouteFixture };
