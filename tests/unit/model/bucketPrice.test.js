jest.mock('../../../config/prisma', () => ({}));
const Client = require('../../../models/client.model');
const { Prisma } = require('../../../generated/prisma');

test('el cliente Prisma generado conoce gratis', () => {
    const fields = Prisma.dmmf.datamodel.models.find(m => m.name === 'precios_cubetas').fields;
    expect(fields.map(f => f.name)).toContain('gratis');
});

test.each(['normal', 'normal_iva', 'pension', 'pension_iva', 'gratis'])(
    '%s selecciona la columna y cantidad exactas, incluyendo cantidad cero', async (priceType) => {
        for (let quantity = 0; quantity <= 20; quantity++) {
            const cost = quantity * 7.5;
            const tx = {
                cliente: { findUnique: jest.fn().mockResolvedValue({ tipo_precio: priceType }) },
                precios_cubetas: { findFirst: jest.fn().mockResolvedValue({ [priceType]: cost }) },
            };
            expect(await Client.getBucketPrice('client-1', quantity, tx)).toEqual({ cost, priceType });
            expect(await Client.getBucketCost('client-1', quantity, tx)).toBe(cost);
            expect(tx.precios_cubetas.findFirst).toHaveBeenCalledWith({
                where: { cantidad: quantity }, select: { [priceType]: true },
            });
        }
    }
);

test.each([0, 37.5])('gratis devuelve la tarifa %s de la BD sin sustituirla', async (cost) => {
    const tx = {
        cliente: { findUnique: jest.fn().mockResolvedValue({ tipo_precio: 'gratis' }) },
        precios_cubetas: { findFirst: jest.fn().mockResolvedValue({ gratis: cost }) },
    };
    expect(await Client.getBucketCost('client-1', 2, tx)).toBe(cost);
});

test.each([null, undefined])('una tarifa ausente (%s) no se convierte en cero', async (cost) => {
    const tx = {
        cliente: { findUnique: jest.fn().mockResolvedValue({ tipo_precio: 'gratis' }) },
        precios_cubetas: { findFirst: jest.fn().mockResolvedValue({ gratis: cost }) },
    };
    await expect(Client.getBucketCost('client-1', 2, tx)).rejects.toThrow('El tipo de precio no está definido');
});
