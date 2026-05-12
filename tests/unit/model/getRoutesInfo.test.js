const RoutesInfo = require('../../../models/route.model');
const prisma = require('../../../config/prisma');

jest.mock('../../../config/prisma', () => ({
    cliente: {
        findMany: jest.fn(),
    },
}));

describe('Model - getRoutesInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-05-06T12:00:00.000Z')); // Miércoles
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('debe obtener y formatear la información de rutas del día actual', async () => {
        const mockRouteInfo = [
            {
                id_cliente: 'client-123',
                id_ruta: 1,
                orden_horario: 4,

                usuarios_cp: {
                    nombre: 'Alejandra',
                    apellido: 'Arredondo',
                },

                ruta: {
                    id_ruta: 3,
                    dia_ruta: 'Miércoles',
                },

                solicitudes_recoleccion: [
                    {
                        id_solicitud: '333-333-333',
                        cubetas_recolectadas: 4,
                        cubetas_entregadas: 2,
                        total_a_pagar: 1500,
                        total_pagado: 300,
                        fecha: new Date('2026-05-06T00:00:00.000Z'),
                        horario: new Date('1970-01-01T08:00:00.000Z'),
                        notas: 'Solicito más aserrín',

                        formas_pago: {
                            tipo: 'Efectivo',
                        },

                        productos_solicitud: [
                            {
                                id_producto: 2,
                                cantidad: 12,
                                productos_extra: {
                                    nombre: 'Composta',
                                    orden: 3,
                                },
                            },
                        ],
                    },
                ],
            },
        ];

        prisma.cliente.findMany.mockResolvedValue(mockRouteInfo);

        const result = await RoutesInfo.getRoutesInfo();

        expect(prisma.cliente.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    usuarios_cp:{
                        is:{
                            estatus: true,
                        }
                    },
                    ruta: {
                        dia_ruta: {
                            startsWith: 'Miércoles',
                        },
                    },

                },
                select: expect.any(Object),
                orderBy: [
                    {
                        ruta: {
                            id_ruta: 'asc',
                        },
                    },
                    {
                        orden_horario: 'asc',
                    },
                ],
            })
        );

        expect(result).toEqual([
            {
                nombre: 'Alejandra Arredondo',
                recoleccion: '4',
                entrega: '2',
                productos_extra: 'Composta (12)',
                horario: '08:00',
                forma_pago: 'Efectivo',
                total_a_pagar: '1500',
                total_pagado: '300',
                notas: 'Solicito más aserrín',
            },
        ]);
    });

    it('debe regresar espacios vacíos si el cliente no tiene solicitud esta semana', async () => {
        prisma.cliente.findMany.mockResolvedValue([
            {
                id_cliente: 'client-456',
                id_ruta: 2,
                orden_horario: 1,

                usuarios_cp: {
                    nombre: 'Leonardo',
                    apellido: 'Alvarado',
                },

                ruta: {
                    dia_ruta: 'Miércoles',
                    turno_ruta: 1,
                },

                solicitudes_recoleccion: [],
            },
        ]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result).toEqual([
            {
                nombre: 'Leonardo Alvarado',
                recoleccion: ' ',
                entrega: ' ',
                productos_extra: ' ',
                horario: ' ',
                forma_pago: ' ',
                total_a_pagar: ' ',
                total_pagado: ' ',
                notas: ' ',
            },
        ]);
    });

    it('debe regresar arreglo vacío si no hay clientes en la ruta del día', async () => {
        prisma.cliente.findMany.mockResolvedValue([]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result).toEqual([]);
    });

    it('debe regresar error si prisma falla', async () => {
        prisma.cliente.findMany.mockRejectedValue(
            new Error('Error obteniendo rutas')
        );

        await expect(RoutesInfo.getRoutesInfo())
            .rejects
            .toThrow('Error obteniendo rutas');
    })

    it('debe regresar espacio vacío si horario es null', async () => {

        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp: {
                    nombre: 'Alejandra',
                    apellido: 'Arredondo',
                },

                solicitudes_recoleccion: [
                    {
                        cubetas_recolectadas: 4,
                        cubetas_entregadas: 2,
                        total_a_pagar: 1500,
                        total_pagado: 300,

                        horario: null,

                        notas: 'Solicito más aserrín',

                        formas_pago: {
                            tipo: 'Efectivo',
                        },

                        productos_solicitud: [],
                    },
                ],
            },
        ]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0].horario).toBe(' ');
    });

    it('debe regresar el horario si viene como string', async () => {
        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp:{
                    nombre: "Alejandra",
                    apellido: "Arredondo",
                },

                solicitudes_recoleccion: [
                    {
                        cubetas_recolectadas: 4,
                        cubetas_entregadas: 2,
                        total_a_pagar: 1500,
                        total_pagado: 300,
                        horario: '08:00:00',
                        notas: 'Solicito más aserrín',
                        formas_pago: {
                            tipo: 'Efectivo',
                        },
                        productos_solicitud: [],
                    },
                ],
            },
        ])

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0].horario).toBe('08:00');
    });

    it('debe devolver string vació en caso de que algún valor númerico venga en null', async () => {
        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp: {
                    nombre: 'Alejandra',
                    apellido: 'Arredondo',
                },

                ruta:{
                    dia_ruta: null,
                    turno_ruta: null,
                },

                solicitudes_recoleccion:[{
                    id_solicitud: null,
                    cubetas_recolectadas: null,
                    cubetas_entregadas: null,
                    total_a_pagar: null,
                    total_pagado: null,
                    horario:'08:00',
                    notas:'Nota de recolecta',

                    productos_solicitud:[{
                        id_producto:null,
                        cantidad:null,
                        productos_extra:{
                            nombre:'Aserrin',
                            orden:null,
                        },
                    }],
                }],
            },
        ])

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0]).toEqual({
            nombre: 'Alejandra Arredondo',
            recoleccion: ' ',
            entrega: ' ',
            productos_extra: 'Aserrin',
            horario: '08:00',
            forma_pago: ' ',
            total_a_pagar: ' ',
            total_pagado: ' ',
            notas: 'Nota de recolecta',
        });
    });

    it('caso en que usuario venga null', async () => {
        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp:{
                    nombre: null,
                    apellido: null,
                },
                solicitudes_recoleccion: [],
            }
        ])

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0].nombre).toBe(' ');
    });

    it('debe devolver espacio vacío si usuarios_cp viene null', async () => {
        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp: null,
                solicitudes_recoleccion: [],
            },
        ]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0].nombre).toBe(' ');
    });

    it('debe ignorar productos sin información de productos_extra', async () => {
        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp: {
                    nombre: 'Alejandra',
                    apellido: 'Arredondo',
                },
                solicitudes_recoleccion: [
                    {
                        cubetas_recolectadas: 1,
                        cubetas_entregadas: 1,
                        total_a_pagar: 100,
                        total_pagado: 100,
                        horario: '08:00',
                        notas: null,
                        formas_pago: null,
                        productos_solicitud: [
                            {
                                id_producto: 1,
                                cantidad: 2,
                                productos_extra: null,
                            },
                        ],
                    },
                ],
            },
        ]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0].productos_extra).toBe(' ');
    });

    it('debe manejar solicitudes_recoleccion null como sin solicitud', async () => {
        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp: {
                    nombre: 'Alejandra',
                    apellido: 'Arredondo',
                },
                solicitudes_recoleccion: null,
            },
        ]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0].recoleccion).toBe(' ');
    });

    it('debe ordenar productos_extra por orden ascendente', async () => {
        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp: {
                    nombre: 'Alejandra',
                    apellido: 'Arredondo',
                },

                solicitudes_recoleccion: [
                    {
                        cubetas_recolectadas: 1,
                        cubetas_entregadas: 1,
                        total_a_pagar: 100,
                        total_pagado: 100,
                        horario: '08:00',
                        notas: 'Productos desordenados',

                        formas_pago: {
                            tipo: 'Efectivo',
                        },

                        productos_solicitud: [
                            {
                                cantidad: 1,
                                productos_extra: {
                                    nombre: 'Composta',
                                    orden: 3,
                                },
                            },
                            {
                                cantidad: 2,
                                productos_extra: {
                                    nombre: 'Aserrin',
                                    orden: 1,
                                },
                            },
                            {
                                cantidad: 5,
                                productos_extra: {
                                    nombre: 'Tierra',
                                    orden: 2,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0].productos_extra).toBe(
            'Aserrin (2)\nTierra (5)\nComposta (1)'
        );
    });

    it('debe regresar espacio vacío si horario tiene tipo inválido', async () => {

        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp: {
                    nombre: 'Alejandra',
                    apellido: 'Arredondo',
                },

                solicitudes_recoleccion: [
                    {
                        cubetas_recolectadas: 1,
                        cubetas_entregadas: 1,
                        total_a_pagar: 100,
                        total_pagado: 100,

                        horario: {},

                        notas: 'Horario inválido',

                        formas_pago: {
                            tipo: 'Efectivo',
                        },

                        productos_solicitud: [],
                    },
                ],
            },
        ]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0].horario).toBe(' ');
    });

    it('debe usar 0 como orden por defecto cuando orden viene null', async () => {
        prisma.cliente.findMany.mockResolvedValue([
            {
                usuarios_cp: {
                    nombre: 'Alejandra',
                    apellido: 'Arredondo',
                },

                solicitudes_recoleccion: [
                    {
                        cubetas_recolectadas: 1,
                        cubetas_entregadas: 1,
                        total_a_pagar: 100,
                        total_pagado: 100,
                        horario: '08:00',
                        notas: null,
                        formas_pago: null,

                        productos_solicitud: [
                            {
                                cantidad: 1,
                                productos_extra: {
                                    nombre: 'Producto orden 2',
                                    orden: 2,
                                },
                            },
                            {
                                cantidad: 1,
                                productos_extra: {
                                    nombre: 'Producto orden null',
                                    orden: null,
                                },
                            },
                            {
                                cantidad: 1,
                                productos_extra: {
                                    nombre: 'Producto orden 1',
                                    orden: 1,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        const result = await RoutesInfo.getRoutesInfo();

        expect(result[0].productos_extra).toBe(
            'Producto orden null (1)\nProducto orden 1 (1)\nProducto orden 2 (1)'
        );
    });
});