const Credit = require("../../../models/credit.model");

//Mockea a prisma para poder usar las funciones. 
jest.mock("../../../config/prisma", () => ({
    saldo: {
        findFirst: jest.fn(),
        create: jest.fn(),
    },
}));

//Este no es el prisma real es el mock
const prisma = require("../../../config/prisma");

describe("Unit - Model - Credit", () => {
    // Limpia los test de los mocks
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Prueba del metodo getCreditBalamce
    describe("getCreditBalance", () => {
        it("debe retornar el saldo del cliente si existe", async () => {
            // Arrange
            const clientId = "11111111-1111-1111-1111-111111111111";

            //Respuesta Falsa 
            const mockCreditBalance = {
                id_saldo: 1,
                id_cliente: clientId,
                saldo: 500,
            };

            // Simulamos que prisma encuentra el saldo
            prisma.saldo.findFirst.mockResolvedValue(mockCreditBalance);

            // Actuar
            const result = await Credit.getCreditBalance(clientId);

            // Afirmar
            expect(result).toEqual(mockCreditBalance);
            expect(prisma.saldo.findFirst).toHaveBeenCalledWith({
                where: {
                    id_cliente: clientId,
                },
            });
        });

        it("debe retornar null si el cliente no tiene saldo", async () => {
            // Arrange
            const clientId = "11111111-1111-1111-1111-111111111111";

            prisma.saldo.findFirst.mockResolvedValue(null);

            // Actuar
            const result = await Credit.getCreditBalance(clientId);

            // Afirmar
            expect(result).toBeNull();
            expect(prisma.saldo.findFirst).toHaveBeenCalledWith({
                where: {
                    id_cliente: clientId,
                },
            });
        });

        it("debe lanzar error si Prisma falla al consultar el saldo", async () => {
            // Arrange
            const clientId = "11111111-1111-1111-1111-111111111111";

            prisma.saldo.findFirst.mockRejectedValue(new Error("DB Error"));

            // Actuar
            await expect(Credit.getCreditBalance(clientId)).rejects.toThrow(
                "DB Error",
            );
        });
    });

    describe("createInitialCredit", () => {
        it("debe crear un saldo inicial en 0 para el cliente", async () => {
            // Arrange
            const clientId = "11111111-1111-1111-1111-111111111111";

            const mockNewCredit = {
                id_saldo: 1,
                id_cliente: clientId,
                saldo: 0,
            };

            prisma.saldo.create.mockResolvedValue(mockNewCredit);

            // Actuar
            const result = await Credit.createInitialCredit(clientId);

            // Afirmar
            expect(result).toEqual(mockNewCredit);
            expect(prisma.saldo.create).toHaveBeenCalledWith({
                data: {
                    cliente: {
                        connect: {
                            id_cliente: clientId,
                        },
                    },
                    saldo: 0,
                },
            });
        });

        it("debe lanzar error si Prisma falla al crear el saldo inicial", async () => {
            // Arrange
            const clientId = "11111111-1111-1111-1111-111111111111";

            prisma.saldo.create.mockRejectedValue(new Error("DB Error"));

            // Actuar y afirmar
            await expect(Credit.createInitialCredit(clientId)).rejects.toThrow(
                "DB Error",
            );
        });
    });
});