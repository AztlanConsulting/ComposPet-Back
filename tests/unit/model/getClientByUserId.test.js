const Client = require("../../../models/client.model");

jest.mock("../../../config/prisma", () => ({
    cliente: {
        findUnique: jest.fn(),
    },
}));

const prisma = require("../../../config/prisma");

describe("Unit - Model - Client", () => {
    // Limpia los test de los mocks
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Prueba del metodo getClientByUserId
    describe("getClientByUserId", () => {
        it("debe retornar la información del cliente y su día de ruta si existe", async () => {
            const userId = "11111111-1111-1111-1111-111111111111";

            const mockClient = {
                id_cliente: "22222222-2222-2222-2222-222222222222",
                id_ruta: 3,
                ruta: {
                    dia_ruta: "Miércoles",
                },
            };

            prisma.cliente.findUnique.mockResolvedValue(mockClient);

            const result = await Client.getClientByUserId(userId);

            expect(result).toEqual(mockClient);
            expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
                where: {
                    id_usuario: userId,
                },
                select: {
                    id_cliente: true,
                    id_ruta: true,
                    ruta: {
                        select: {
                            dia_ruta: true,
                        },
                    },
                },
            });
        });

        it("debe retornar null si no existe cliente asociado al usuario", async () => {
            const userId = "11111111-1111-1111-1111-111111111111";

            prisma.cliente.findUnique.mockResolvedValue(null);

            const result = await Client.getClientByUserId(userId);

            expect(result).toBeNull();
            expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
                where: {
                    id_usuario: userId,
                },
                select: {
                    id_cliente: true,
                    id_ruta: true,
                    ruta: {
                        select: {
                            dia_ruta: true,
                        },
                    },
                },
            });
        });

        it("debe lanzar error si Prisma falla al consultar el cliente", async () => {
            const userId = "11111111-1111-1111-1111-111111111111";

            prisma.cliente.findUnique.mockRejectedValue(new Error("DB Error"));

            await expect(Client.getClientByUserId(userId)).rejects.toThrow(
                "DB Error",
            );
        });
    });
});
