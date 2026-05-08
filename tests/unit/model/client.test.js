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

        route: 'Lunes',

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

describe('updateClient', () => {

    beforeEach(() => {
        prisma.$transaction = jest.fn(async (cb) => {
            const tx = {
                usuarios_cp: { update: jest.fn() },
                cliente:     { update: jest.fn() },
                saldo:       { update: jest.fn() },
            };
            await cb(tx);
            return tx;
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

    it('no debe llamar update de usuarios_cp si userData está vacío', async () => {

        // Arrange
        let txRef;
        prisma.$transaction = jest.fn(async (cb) => {
            const tx = {
                usuarios_cp: { update: jest.fn() },
                cliente:     { update: jest.fn() },
                saldo:       { update: jest.fn() },
            };
            txRef = tx;
            await cb(tx);
        });

        // Act
        await Client.updateClient('user-123', 'client-456', {}, { notas: 'Nota' }, {});

        // Assert
        expect(txRef.usuarios_cp.update).not.toHaveBeenCalled();
        expect(txRef.cliente.update).toHaveBeenCalledWith({
            where: { id_cliente: 'client-456' },
            data: { notas: 'Nota' },
        });
        expect(txRef.saldo.update).not.toHaveBeenCalled();
    });

    it('no debe llamar update de cliente si clientData está vacío', async () => {

        // Arrange
        let txRef;
        prisma.$transaction = jest.fn(async (cb) => {
            const tx = {
                usuarios_cp: { update: jest.fn() },
                cliente:     { update: jest.fn() },
                saldo:       { update: jest.fn() },
            };
            txRef = tx;
            await cb(tx);
        });

        // Act
        await Client.updateClient('user-123', 'client-456', { telefono: '123' }, {}, { saldo: 100 });

        // Assert
        expect(txRef.cliente.update).not.toHaveBeenCalled();
        expect(txRef.usuarios_cp.update).toHaveBeenCalledWith({
            where: { id_usuario: 'user-123' },
            data: { telefono: '123' },
        });
        expect(txRef.saldo.update).toHaveBeenCalledWith({
            where: { id_cliente: 'client-456' },
            data: { saldo: 100 },
        });
    });

    it('no debe llamar update de saldo si balanceData está vacío', async () => {

        // Arrange
        let txRef;
        prisma.$transaction = jest.fn(async (cb) => {
            const tx = {
                usuarios_cp: { update: jest.fn() },
                cliente:     { update: jest.fn() },
                saldo:       { update: jest.fn() },
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

    it('debe retornar true aunque ocurra un error en la transacción', async () => {

        // Arrange
        prisma.$transaction = jest.fn().mockRejectedValue(new Error('DB error'));

        // Act
        const result = await Client.updateClient('user-123', 'client-456', { telefono: '123' }, {}, {});

        // Assert
        expect(result).toBe(true);
    });
  });
});