const Inventory = require("../../../models/inventory.model");

jest.mock("../../../config/prisma", () => ({
    productos_extra: {
        findMany: jest.fn(),
    },
}));

const prisma = require("../../../config/prisma");

describe("Unit - Model - Consult Inventory", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getInventory", () => {
        it("debe regresar la lista de productos activos del inventario", async () => {
            const mockInventory = [
                {
                    id_producto: 1,
                    nombre: "Croquetas",
                    precio: 250,
                    descripcion: "Alimento para perro",
                    cantidad: 10,
                    imagen_url: "croquetas.png",
                    color: "verde",
                    estatus: true,
                },
                {
                    id_producto: 2,
                    nombre: "Juguete",
                    precio: 80,
                    descripcion: "Juguete para mascota",
                    cantidad: 5,
                    imagen_url: "juguete.png",
                    color: "azul",
                    estatus: true,
                },
            ];

            prisma.productos_extra.findMany.mockResolvedValue(mockInventory);

            const result = await Inventory.getInventory();

            expect(prisma.productos_extra.findMany).toHaveBeenCalledTimes(1);

            expect(prisma.productos_extra.findMany).toHaveBeenCalledWith({
                where: {
                    deleted: false,
                },
                select: {
                    id_producto: true,
                    nombre: true,
                    precio: true,
                    descripcion: true,
                    cantidad: true,
                    imagen_url: true,
                    color: true,
                    estatus: true,
                },
                orderBy: [
                    { orden: "asc" },
                ],
            });

            expect(result).toEqual(mockInventory);
        });

        it("debe regresar un arreglo vacío si no hay productos activos", async () => {
            prisma.productos_extra.findMany.mockResolvedValue([]);

            const result = await Inventory.getInventory();

            expect(prisma.productos_extra.findMany).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
        });

        it("debe lanzar error si Prisma falla", async () => {
            const mockError = new Error("Error de base de datos");

            prisma.productos_extra.findMany.mockRejectedValue(mockError);

            await expect(Inventory.getInventory()).rejects.toThrow("Error de base de datos");

            expect(prisma.productos_extra.findMany).toHaveBeenCalledTimes(1);
        });
    });
});