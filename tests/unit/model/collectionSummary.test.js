const CollectionRequest = require('../../../models/collectionRequest.model');

jest.mock('../../../config/prisma', () => ({
  solicitudes_recoleccion: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  productos_solicitud: {
    deleteMany: jest.fn(),
  },
}));

const prisma = require('../../../config/prisma');

describe('Unit - Model - CollectionRequest', () => {

  describe('getById', () => {

    it('debe retornar la solicitud por id', async () => {
      // Arrange
      prisma.solicitudes_recoleccion.findUnique.mockResolvedValue({
        id_solicitud: 10,
        total_a_pagar: 250,
      });

      // Act
      const result = await CollectionRequest.getById(10);

      // Assert
      expect(result).toEqual({
        id_solicitud: 10,
        total_a_pagar: 250,
      });

      expect(prisma.solicitudes_recoleccion.findUnique).toHaveBeenCalledWith({
        where: {
          id_solicitud: 10,
        },
      });
    });

    it('debe retornar null si no existe la solicitud', async () => {
      prisma.solicitudes_recoleccion.findUnique.mockResolvedValue(null);

      const result = await CollectionRequest.getById(999);

      expect(result).toBeNull();
    });

  });

  describe('deleteProduct', () => {

    it('debe eliminar un producto de la solicitud', async () => {
      // Arrange
      prisma.productos_solicitud.deleteMany.mockResolvedValue({
        count: 1,
      });

      // Act
      const result = await CollectionRequest.deleteProduct(5, 20);

      // Assert
      expect(result).toEqual({ count: 1 });

      expect(prisma.productos_solicitud.deleteMany).toHaveBeenCalledWith({
        where: {
          id_solicitud: 20,
          id_producto: 5,
        },
      });
    });

    it('debe retornar count 0 si no encontró registros', async () => {
      prisma.productos_solicitud.deleteMany.mockResolvedValue({
        count: 0,
      });

      const result = await CollectionRequest.deleteProduct(99, 20);

      expect(result.count).toBe(0);
    });

  });

  describe('updateCollectionTotal', () => {

    it('debe actualizar total, método de pago y notas', async () => {
      // Arrange
      prisma.solicitudes_recoleccion.update.mockResolvedValue({
        id_solicitud: 15,
        total_a_pagar: 500,
        id_pago: 2,
        notas: 'Código de puerta: 1234',
      });

      // Act
      const result = await CollectionRequest.updateCollectionTotal(
        15,
        500,
        2,
        'Código de puerta: 1234'
      );

      // Assert
      expect(result).toEqual({
        id_solicitud: 15,
        total_a_pagar: 500,
        id_pago: 2,
        notas: 'Código de puerta: 1234',
      });

      expect(prisma.solicitudes_recoleccion.update).toHaveBeenCalledWith({
        where: {
          id_solicitud: 15,
        },
        data: {
          total_a_pagar: 500,
          estatus: true,
          notas: 'Código de puerta: 1234',
          formas_pago: {
            connect: {id_pago: 2}
          }
        },
      });
    });

    it('debe actualizar con notas null', async () => {
      prisma.solicitudes_recoleccion.update.mockResolvedValue({
        id_solicitud: 15,
        notas: null,
      });

      const result = await CollectionRequest.updateCollectionTotal(
        15,
        300,
        1,
        null
      );

      expect(result.notas).toBeNull();
    });

  });

    describe('getProductsByCollection', () => {

    it('debe retornar los productos asociados a una solicitud', async () => {
        // Arrange
        prisma.productos_solicitud.findMany = jest.fn().mockResolvedValue([
        {
            id_solicitud: 12,
            id_producto: 1,
            cantidad: 2,
            productos_extra: {
            id_producto: 1,
            nombre: 'Composta',
            precio: 50,
            },
        },
        ]);

        // Act
        const result = await CollectionRequest.getProductsByCollection(12);

        // Assert
        expect(result.length).toBe(1);

        expect(result[0]).toEqual({
        id_solicitud: 12,
        id_producto: 1,
        cantidad: 2,
        productos_extra: {
            id_producto: 1,
            nombre: 'Composta',
            precio: 50,
        },
        });

        expect(prisma.productos_solicitud.findMany).toHaveBeenCalledWith({
        where: {
            id_solicitud: 12,
        },
        include: {
            productos_extra: true,
        },
        });
    });

    it('debe retornar arreglo vacío si no hay productos', async () => {
        // Arrange
        prisma.productos_solicitud.findMany = jest.fn().mockResolvedValue([]);

        // Act
        const result = await CollectionRequest.getProductsByCollection(999);

        // Assert
        expect(result).toEqual([]);
    });

    });

});