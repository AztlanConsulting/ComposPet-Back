const Client = require('../../../models/client.model');

jest.mock('../../../config/prisma', () => ({
  cliente: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  saldo: {
    findUnique: jest.fn(),
  },
  usuarios_cp: {
    findMany: jest.fn(),
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

        firstName: 'Juan',
        lastName: 'M',
        cellphone: '4429384765',
        status: true,

        route: 'Lunes',

        balance: 250,

        lastRequest: '01-05-2026',
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

describe('updateClient', () => {

    beforeEach(() => {
        prisma.$transaction = jest.fn(async (cb) => {
          const tx = {
              usuarios_cp: { 
                  update: jest.fn(),
                  findMany: jest.fn().mockResolvedValue([]),
              },

              cliente: {
                  findUnique: jest.fn().mockResolvedValue({
                      id_ruta: 1,
                      orden_horario: 1,
                      usuarios_cp: {
                          estatus: true,
                      },
                  }),

                  update: jest.fn(),

                  updateMany: jest.fn(),
              },

              saldo: {
                  update: jest.fn(),
              },
          };
            return await cb(tx);
        });

        jest.clearAllMocks();
    });

    it('debe actualizar los tres objetos cuando todos tienen datos', async () => {

        // Arrange
        const userId     = 'user-123';
        const clientId   = 'client-456';
        const userData   = { telefono: '1234567890', estatus: true };
        const clientData = { notas: 'Nota', direccion: 'Calle 1', mascotas: '2', familia: '4', id_ruta: 1 };
        const balanceData = { saldo: 500 };

        // Act
        const result = await Client.updateClient(userId, clientId, userData, clientData, balanceData);

        // Assert
        expect(prisma.$transaction).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('no debe llamar update de saldo si balanceData está vacío', async () => {

        // Arrange
        let txRef;
        prisma.$transaction = jest.fn(async (cb) => {
          const tx = {
              usuarios_cp: { 
                  update: jest.fn(),
                  findMany: jest.fn().mockResolvedValue([]),
              },

              cliente: {
                  findUnique: jest.fn().mockResolvedValue({
                      id_ruta: 1,
                      orden_horario: 1,
                      usuarios_cp: {
                          estatus: true,
                      },
                  }),

                  findFirst: jest.fn().mockResolvedValue({ orden_horario: 5 }),
                  
                  update: jest.fn(),

                  updateMany: jest.fn(),
              },

              saldo: {
                  update: jest.fn(),
              },
          };
            txRef = tx;
            await cb(tx);
        });

        // Act
        await Client.updateClient('user-123', 'client-456', {}, {}, {});

        // Assert
        expect(txRef.usuarios_cp.update).not.toHaveBeenCalled();
        expect(txRef.cliente.update).not.toHaveBeenCalled();
        expect(txRef.saldo.update).not.toHaveBeenCalled();
    });

  });
});