const CollectionRequest = require("../../../models/collectionRequest.model")

// Mock de prisma: $transaction recibe (callback, options) y el callback
// se invoca con un objeto `tx` que expone los mismos métodos del modelo
// usados dentro de la transacción.
jest.mock("../../../config/prisma", () => ({
    $transaction: jest.fn((callback) => callback({
        solicitudes_recoleccion: {
            create: jest.fn(),
            findFirst: jest.fn(),
        },
    })),
}));

const prisma = require("../../../config/prisma");

describe("Model - createInitialCollectionRequest", () => {

    let txMock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Issue 5: congela la fecha para que el rango calculado sea
        // determinista y no dependa del día en que corren las pruebas.
        // Miércoles 23-sep-2026, dentro de la semana de recolección
        // Sábado 19-sep a Viernes 25-sep (UTC).
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-09-23T12:00:00Z'));

        // Captura el objeto `tx` que se le pasa al callback de $transaction
        // en cada test, para poder configurar sus mocks individualmente.
        txMock = {
            solicitudes_recoleccion: {
                create: jest.fn(),
                findFirst: jest.fn(),
            },
        };

        prisma.$transaction.mockImplementation((callback) => callback(txMock));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("Debe crear una solicitud inicial para el cliente", async () => {

        const clientId = "11111111-1111-1111-1111-111111111111";

        const mockNewRequest = {
            id_solicitud: "req-new",
            id_cliente: clientId,
            cubetas_recolectadas: 0,
            cubetas_entregadas: 0,
            total_a_pagar: 0,
            total_pagado: 0,
            fecha: new Date("2026-09-23T12:00:00.000Z"),
            notas: null,
            quiere_recoleccion: true,
            quiere_productos_extra: true,
            estatus: false,
        };

        txMock.solicitudes_recoleccion.findFirst.mockResolvedValue(null);
        txMock.solicitudes_recoleccion.create.mockResolvedValue(mockNewRequest);

        const result = await CollectionRequest.createInitialCollectionRequest(clientId);

        expect(result).toEqual(mockNewRequest);
        expect(txMock.solicitudes_recoleccion.create).toHaveBeenCalledWith({
            data: {
                cliente: {
                    connect: {
                        id_cliente: clientId,
                    },
                },
                cubetas_recolectadas: 0,
                cubetas_entregadas: 0,
                total_a_pagar: 0,
                total_pagado: 0,
                fecha: expect.any(Date),
                notas: null,
                quiere_recoleccion: true,
                quiere_productos_extra: true,
                estatus: false,
            },
        });

        // Issue 3: la transacción debe usar aislamiento Serializable.
        expect(prisma.$transaction).toHaveBeenCalledWith(
            expect.any(Function),
            expect.objectContaining({ isolation: "Serializable" })
        );
    });

    it("Debe retornar la solicitud existente sin crear una nueva si ya hay una incompleta para esa semana", async () => {

        const clientId = "11111111-1111-1111-1111-111111111111";

        const mockExistingRequest = {
            id_solicitud: "req-existing",
            id_cliente: clientId,
            estatus: false,
        };

        txMock.solicitudes_recoleccion.findFirst.mockResolvedValue(mockExistingRequest);

        const result = await CollectionRequest.createInitialCollectionRequest(clientId);

        expect(result).toEqual(mockExistingRequest);
        expect(txMock.solicitudes_recoleccion.create).not.toHaveBeenCalled();
    });

    // Issue 4: debe lanzar error si la solicitud existente ya está completada.
    it("Debe lanzar error si ya existe una solicitud completada para esta semana", async () => {

        const clientId = "11111111-1111-1111-1111-111111111111";

        const mockCompletedRequest = {
            id_solicitud: "req-completed",
            id_cliente: clientId,
            estatus: true,
        };

        txMock.solicitudes_recoleccion.findFirst.mockResolvedValue(mockCompletedRequest);

        await expect(
            CollectionRequest.createInitialCollectionRequest(clientId),
        ).rejects.toThrow("Ya existe una solicitud completada para esta semana de recolección.");

        expect(txMock.solicitudes_recoleccion.create).not.toHaveBeenCalled();
    });

    it("Debe lanzar error si Prisma no puede crear la solicitud", async () => {

        const clientId = "11111111-1111-1111-1111-111111111111";

        txMock.solicitudes_recoleccion.findFirst.mockResolvedValue(null);
        txMock.solicitudes_recoleccion.create.mockRejectedValue(
            new Error("DB Error"),
        );

        await expect(
            CollectionRequest.createInitialCollectionRequest(clientId),
        ).rejects.toThrow("DB Error");
    });

    // Issue 3: reintento ante conflicto de serialización (P2034).
    it("Debe reintentar la operación si Postgres detecta un conflicto de serialización (P2034)", async () => {

        const clientId = "11111111-1111-1111-1111-111111111111";

        const mockNewRequest = {
            id_solicitud: "req-new",
            id_cliente: clientId,
            estatus: false,
        };

        const serializationError = new Error("could not serialize access");
        serializationError.code = 'P2034';

        // Primer intento: falla por conflicto de serialización.
        // Segundo intento: ya no hay conflicto, se crea exitosamente.
        prisma.$transaction
            .mockImplementationOnce(() => { throw serializationError; })
            .mockImplementationOnce((callback) => callback(txMock));

        txMock.solicitudes_recoleccion.findFirst.mockResolvedValue(null);
        txMock.solicitudes_recoleccion.create.mockResolvedValue(mockNewRequest);

        const result = await CollectionRequest.createInitialCollectionRequest(clientId);

        expect(result).toEqual(mockNewRequest);
        expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });

    // --- Issue 6: validar que el rango calculado sea exactamente el esperado ---

    it("Debe calcular el rango como Sábado 00:00 a Sábado siguiente 00:00 (UTC) cuando hoy es miércoles", async () => {

        const clientId = "11111111-1111-1111-1111-111111111111";

        txMock.solicitudes_recoleccion.findFirst.mockResolvedValue(null);
        txMock.solicitudes_recoleccion.create.mockResolvedValue({});

        await CollectionRequest.createInitialCollectionRequest(clientId);

        expect(txMock.solicitudes_recoleccion.findFirst).toHaveBeenCalledWith({
            where: {
                id_cliente: clientId,
                fecha: {
                    gte: new Date('2026-09-19T00:00:00.000Z'), // Sábado
                    lt: new Date('2026-09-26T00:00:00.000Z'),  // Sábado siguiente (exclusivo)
                },
            },
        });
    });

    it("Si hoy es sábado, el rango inicia ese mismo sábado", async () => {

        jest.setSystemTime(new Date('2026-09-19T12:00:00Z')); // Sábado

        const clientId = "11111111-1111-1111-1111-111111111111";

        txMock.solicitudes_recoleccion.findFirst.mockResolvedValue(null);
        txMock.solicitudes_recoleccion.create.mockResolvedValue({});

        await CollectionRequest.createInitialCollectionRequest(clientId);

        expect(txMock.solicitudes_recoleccion.findFirst).toHaveBeenCalledWith({
            where: {
                id_cliente: clientId,
                fecha: {
                    gte: new Date('2026-09-19T00:00:00.000Z'),
                    lt: new Date('2026-09-26T00:00:00.000Z'),
                },
            },
        });
    });

    it("Si hoy es domingo, agrupa con el sábado anterior (misma semana que el sábado)", async () => {

        jest.setSystemTime(new Date('2026-09-20T12:00:00Z')); // Domingo

        const clientId = "11111111-1111-1111-1111-111111111111";

        txMock.solicitudes_recoleccion.findFirst.mockResolvedValue(null);
        txMock.solicitudes_recoleccion.create.mockResolvedValue({});

        await CollectionRequest.createInitialCollectionRequest(clientId);

        expect(txMock.solicitudes_recoleccion.findFirst).toHaveBeenCalledWith({
            where: {
                id_cliente: clientId,
                fecha: {
                    gte: new Date('2026-09-19T00:00:00.000Z'),
                    lt: new Date('2026-09-26T00:00:00.000Z'),
                },
            },
        });
    });

    it("Si hoy es viernes, el rango termina ese mismo sábado siguiente (exclusivo)", async () => {

        jest.setSystemTime(new Date('2026-09-25T12:00:00Z')); // Viernes

        const clientId = "11111111-1111-1111-1111-111111111111";

        txMock.solicitudes_recoleccion.findFirst.mockResolvedValue(null);
        txMock.solicitudes_recoleccion.create.mockResolvedValue({});

        await CollectionRequest.createInitialCollectionRequest(clientId);

        expect(txMock.solicitudes_recoleccion.findFirst).toHaveBeenCalledWith({
            where: {
                id_cliente: clientId,
                fecha: {
                    gte: new Date('2026-09-19T00:00:00.000Z'),
                    lt: new Date('2026-09-26T00:00:00.000Z'),
                },
            },
        });
    });
});