const Client = require('../../../models/client.model');

jest.mock('../../../config/prisma', () => ({
  cliente: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  saldo: {
    findUnique: jest.fn(),
  },
}));

const prisma = require('../../../config/prisma');

describe('Unit - Model - Client', () => {

  describe('getClients', () => {

    it('debe retornar la lista transformada de clientes', async () => {
      prisma.cliente.findMany.mockResolvedValue([
        {
          id_cliente: '1',
          mascotas: 2,
          familia: 4,
          direccion: 'Calle 1',
          notas: 'Código de acceso: 123',

          usuarios_cp: {
            nombre: 'Juan',
            apellido: 'M',
            telefono: '4429384765',
            estatus: true,
          },

          saldo: {
            saldo: 250,
          },

          ruta: {
            dia_ruta: 'Lunes',
            turno_ruta: '1',
          },

          solicitudes_recoleccion: [
            {
              fecha: new Date('2026-05-01'),
            },
          ],
        },
      ]);

      const result = await Client.getClients();

      expect(result.length).toBe(1);

      expect(result[0]).toEqual({
        clientId: '1',
        pets: 2,
        family: 4,
        address: 'Calle 1',
        notes: 'Código de acceso: 123',

        name: 'Juan M',
        cellphone: '4429384765',
        status: true,

        route: 'Lunes 1',

        balance: 250,

        lastRequest: '2026-05-01',
      });

      expect(prisma.cliente.findMany).toHaveBeenCalled();
    });

    it('debe manejar cuando no hay solicitudes (lastRequest null)', async () => {
      prisma.cliente.findMany.mockResolvedValue([
        {
          id_cliente: '2',
          mascotas: 1,
          familia: 2,
          direccion: 'Calle 2',
          notas: null,

          usuarios_cp: {
            nombre: 'Jesus',
            apellido: 'Corona',
            telefono: '4429384766',
            estatus: false,
          },

          saldo: {
            saldo: 0,
          },

          ruta: {
            dia_ruta: 'Martes',
            turno_ruta: '2',
          },

          solicitudes_recoleccion: [],
        },
      ]);

      const result = await Client.getClients();

      expect(result[0].lastRequest).toBeNull();
    });

    it('debe retornar arreglo vacío si no hay clientes', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);

      const result = await Client.getClients();

      expect(result).toEqual([]);
    });

  });

});