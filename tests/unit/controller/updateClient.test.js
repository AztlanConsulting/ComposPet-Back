const clientController = require('../../../controllers/client.controller');
const Client = require('../../../models/client.model');
const Route = require('../../../models/route.model');

jest.mock('../../../models/client.model');
jest.mock('../../../models/route.model');


describe('Controller - getRoutes', () => {

    let req;
    let res;

    beforeEach(() => {
        req = {};

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it('Debe devolver 200 con la lista de rutas', async () => {

        // Arrange
        const mockRoutes = [
            { id_ruta: 1, dia_ruta: 'Lunes' },
            { id_ruta: 2, dia_ruta: 'Martes' },
        ];

        Route.findAllDaysOfRoute.mockResolvedValue(mockRoutes);

        // Act
        await clientController.getRoutes(req, res);

        // Assert
        expect(Route.findAllDaysOfRoute).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            routes: mockRoutes,
        });
    });

    it('Debe devolver 200 con lista vacía', async () => {

        // Arrange
        Route.findAllDaysOfRoute.mockResolvedValue([]);

        // Act
        await clientController.getRoutes(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            routes: [],
        });
    });

    it('Debe devolver 500 si ocurre un error', async () => {

        // Arrange
        Route.findAllDaysOfRoute.mockRejectedValue(new Error('DB error'));

        // Act
        await clientController.getRoutes(req, res);

        // Assert
        expect(Route.findAllDaysOfRoute).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error al obtener las rutas disponibles.',
            error: expect.any(Error),
        });
    });
});


describe('Controller - updateClient', () => {

    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                clientObject: {
                    clientId: '4283819a-e0dc-48b1-9b1f-d4da88a9f7d3',
                    userId: 'a1ffef51-fd77-435b-86b2-285c3f91eda3',
                    cellphone: '1234567890',
                    status: true,
                    notes: 'Nota de prueba',
                    address: 'Calle prueba 123',
                    pets: '2',
                    family: '2 adultos',
                    routeId: 1,
                    balance: 500,
                },
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it('Debe devolver 200 al actualizar correctamente', async () => {

        // Arrange
        Client.updateClient.mockResolvedValue(true);

        // Act
        await clientController.updateClient(req, res);

        // Assert
        expect(Client.updateClient).toHaveBeenCalledWith(
            'a1ffef51-fd77-435b-86b2-285c3f91eda3',
            '4283819a-e0dc-48b1-9b1f-d4da88a9f7d3',
            { telefono: '1234567890', estatus: true },
            { notas: 'Nota de prueba', direccion: 'Calle prueba 123', mascotas: '2', familia: '2 adultos', id_ruta: 1 },
            { saldo: 500 },
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('Debe construir userData solo con los campos presentes', async () => {

        // Arrange
        req.body.clientObject = {
            clientId: '4283819a-e0dc-48b1-9b1f-d4da88a9f7d3',
            userId: 'a1ffef51-fd77-435b-86b2-285c3f91eda3',
            cellphone: '9876543210',
        };

        Client.updateClient.mockResolvedValue(true);

        // Act
        await clientController.updateClient(req, res);

        // Assert
        expect(Client.updateClient).toHaveBeenCalledWith(
            'a1ffef51-fd77-435b-86b2-285c3f91eda3',
            '4283819a-e0dc-48b1-9b1f-d4da88a9f7d3',
            { telefono: '9876543210' },
            {},
            {},
        );

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('Debe devolver 500 si ocurre un error', async () => {

        // Arrange
        Client.updateClient.mockRejectedValue(new Error('DB error'));

        // Act
        await clientController.updateClient(req, res);

        // Assert
        expect(Client.updateClient).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error al actualizar la información del cliente.',
            error: expect.any(Error),
        });
    });
});