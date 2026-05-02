const clientController = require('../../../controllers/client.controller');
const Client = require('../../../models/client.model');

jest.mock('../../../models/client.model');

describe('Controller - getClientsInfo', () => {

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


    it('Debe devolver 200 con la lista de clientes', async () => {

        // Arrange
        const mockClientList = [
            {
                clientId: '1',
                name: 'Juan M',
                balance: 200,
            },
            {
                clientId: '2',
                name: 'Jesus Corona',
                balance: 0,
            },
        ];

        Client.getClients.mockResolvedValue(mockClientList);

        // Act
        await clientController.getClientsInfo(req, res);

        // Assert
        expect(Client.getClients).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Lista obtenida exitosamente',
            clientList: mockClientList,
        });
    });

    it('Debe devolver 200 con lista vacía', async () => {

        // Arrange
        Client.getClients.mockResolvedValue([]);

        // Act
        await clientController.getClientsInfo(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Lista obtenida exitosamente',
            clientList: [],
        });
    });

    it('Debe devolver 500 si ocurre un error', async () => {

        // Arrange
        Client.getClients.mockRejectedValue(new Error('DB error'));

        // Act
        await clientController.getClientsInfo(req, res);

        // Assert
        expect(Client.getClients).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error del servidor al obtener la lista de clientes.',
            error: expect.any(Error),
        });
    });

});