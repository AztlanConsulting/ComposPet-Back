const RoutesInfo = require('../../../models/routes.model');
const prisma = require('../../../config/prisma');

jest.mock('../../../config/prisma', () => ({
    solicitudes_recoleccion: {
        findMany: jest.fn(),
    }
}));

describe('Model - getRoutesInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe obtener y formatear la información de ruta del mes pasado', async () => {
        const mockRouteInfo = [
            {
                id_solicitud: 'solicitud-123',
                id_cliente: 'client-123',
                cubetas_recolectadas: 2,
                cubetas_entregadas: 3,
                total_a_pagar: 150,
                total_pagado: 150,
                fecha: new Date('2026-04-15T00:00:00.000Z'),
                horario: new Date('1970-01-01T14:30:00.000Z'),
                notas: 'Tocar el timbre',

                formas_pago: {
                    tipo: 'Efectivo',
                },

                productos_solicitud: [
                    {
                        id_producto: 2,
                        cantidad: 1,
                        productos_extra: {
                            nombre: 'Aserrin',
                            orden: 1,
                        },
                    },
                ],

                cliente: {
                    id_ruta: 1,
                    usuarios_cp: {
                        nombre: 'Alejandra',
                        apellido: 'Arredondo',
                    },
                    ruta: {
                        dia_ruta: 'Lunes',
                        turno_ruta: 'Matutino',
                    },
                },
            },
        ];

        prisma.solicitudes_recoleccion.findMany.mockResolvedValue(mockRouteInfo);

        const result = await RoutesInfo.getRoutesInfo();

        expect(prisma.solicitudes_recoleccion.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    fecha: {
                        gte: expect.any(Date),
                        lt: expect.any(Date),
                    },
                },
                select: expect.any(Object),
                orderBy: [
                    { fecha: 'desc' },
                    { horario: 'asc' },
                ],
            })
        );

        expect(result).toEqual([
            {
                nombre: 'Alejandra Arredondo',
                '#Recolección': 2,
                '#Entrega': 3,
                productos_extra: 'Aserrin (1)',
                ruta: 'Lunes Matutino',
                fecha: '2026-04-15',
                horario: '14:30',
                forma_pago: 'Efectivo',
                total_a_pagar: 150,
                total_pagado: 150,
                notas: 'Tocar el timbre',
            },
        ]);
    });

    it('debe regresar mensaje si no hay productos extra', async () => {
        prisma.solicitudes_recoleccion.findMany.mockResolvedValue([
            {
                id_solicitud: 'sol-123',
                id_cliente: 'client-123',
                cubetas_recolectadas: 1,
                cubetas_entregadas: 1,
                total_a_pagar: 100,
                total_pagado: 100,
                fecha: new Date('2026-04-10T00:00:00.000Z'),
                horario: new Date('1970-01-01T10:00:00.000Z'),
                notas: null,

                formas_pago: null,
                productos_solicitud: [],

                cliente: {
                    id_ruta: 1,
                    usuarios_cp: {
                        nombre: 'Leonardo',
                        apellido: 'Alvarado',
                    },
                    ruta: {
                        dia_ruta: 'Martes',
                        turno_ruta: 'Vespertino',
                    },
                },
            },
        ]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result).toEqual([
            {
                nombre: 'Leonardo Alvarado',
                '#Recolección': 1,
                '#Entrega': 1,
                productos_extra: 'No selecciono productos extra',
                ruta: 'Martes Vespertino',
                fecha: '2026-04-10',
                horario: '10:00',
                forma_pago: 'N/A',
                total_a_pagar: 100,
                total_pagado: 100,
                notas: 'N/A',
            },
        ]);
    });

    it('debe regresar arreglo vacío si no hay solicitudes', async () => {
        prisma.solicitudes_recoleccion.findMany.mockResolvedValue([]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result).toEqual([]);
    });
});