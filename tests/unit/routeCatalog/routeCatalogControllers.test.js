// Ninguna dependencia de estos controladores puede abrir conexiones reales.
jest.mock('../../../config/prisma', () => ({ ruta: { findMany: jest.fn() } }));
jest.mock('../../../models/client.model', () => ({}));
jest.mock('../../../models/compospet.model', () => ({}));
jest.mock('../../../models/user.model', () => ({}));
jest.mock('../../../models/role.model', () => ({}));
jest.mock('../../../models/credit.model', () => ({}));
jest.mock('../../../models/payment.model', () => ({}));
jest.mock('../../../models/collectionRequest.model', () => ({}));
jest.mock('../../../config/googleSheetsMessages.service', () => ({}));
jest.mock('../../../config/googleSheetsRoutes.service', () => ({}));
jest.mock('bcrypt', () => ({}));

const prisma = require('../../../config/prisma');
const { getDaysOfRoutes } = require('../../../controllers/tableRoutes.controller');
const { getRoutes } = require('../../../controllers/client.controller');
const { getRegisterClient } = require('../../../controllers/admin/createNewClient.controller');

it.each([
    ['filtro de rutas', getDaysOfRoutes, body => body.data],
    ['filtro y editor de clientes', getRoutes, body => body.routes],
    ['registro de clientes', getRegisterClient, body => body.data.daysOfRoutes],
])('%s entrega el mismo catálogo ordenado desde el modelo', async (_, controller, getCatalog) => {
    const rows = [
        { id_ruta: 2, dia_ruta: 'Martes', orden: 1 },
        { id_ruta: 1, dia_ruta: 'Lunes - A', orden: 3 },
        { id_ruta: 9, dia_ruta: 'Lunes - B', orden: 2 },
    ];
    prisma.ruta.findMany.mockResolvedValue(rows);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(getCatalog(body)).toEqual([rows[2], rows[1], rows[0]]);
    expect(prisma.ruta.findMany).toHaveBeenCalledTimes(1);
});
