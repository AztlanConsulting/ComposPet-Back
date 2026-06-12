const clientController = require('../../../controllers/client.controller');
const Client = require('../../../models/client.model');

jest.mock('../../../models/client.model');

describe('Controller - getClientByUserId', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it('Debe devolver 400 si no manda el id del usuario', async () => {
        // Actuar
        await clientController.getClientByUserId(req, res);

        // Afirmar
        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Falta el id del usuario para obtener la información del cliente.',
        });

        expect(Client.getClientByUserId).not.toHaveBeenCalled();
    });

    it('Debe devolver 200 si recupera la información del cliente y su ruta', async () => {
        // Preparar
        req.body.userId = '11111111-1111-1111-1111-111111111111';

        const mockClient = {
            id_cliente: '22222222-2222-2222-2222-222222222222',
            id_ruta: 3,
            usuarios_cp: {
                nombre: 'Luis Alberto',
            },
            ruta: {
                dia_ruta: 'Miércoles',
            },
        };

        Client.getClientByUserId.mockResolvedValue(mockClient);

        // Actuar
        await clientController.getClientByUserId(req, res);

        // Afirmar
        expect(Client.getClientByUserId).toHaveBeenCalledTimes(1);

        expect(Client.getClientByUserId).toHaveBeenCalledWith(
            '11111111-1111-1111-1111-111111111111',
        );

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Información del cliente obtenida exitosamente.',
            data: {
                clientId: '22222222-2222-2222-2222-222222222222',
                routeId: 3,
                name: 'Luis',
                routeDay: 'Miércoles',
            },
        });
    });

    it('Debe devolver 404 si no existe cliente asociado al usuario', async () => {
        // Preparar
        req.body.userId = '11111111-1111-1111-1111-111111111111';

        Client.getClientByUserId.mockResolvedValue(null);

        // Actuar
        await clientController.getClientByUserId(req, res);

        // Afirmar
        expect(Client.getClientByUserId).toHaveBeenCalledWith(
            '11111111-1111-1111-1111-111111111111',
        );

        expect(res.status).toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'No se encontró la información del cliente asociado a este usuario.',
        });
    });

    it('Debe devolver 500 si ocurre un error al obtener la información del cliente', async () => {
        // Preparar
        req.body.userId = '11111111-1111-1111-1111-111111111111';

        Client.getClientByUserId.mockRejectedValue(
            new Error('Error interno'),
        );

        // Actuar
        await clientController.getClientByUserId(req, res);

        // Afirmar
        expect(Client.getClientByUserId).toHaveBeenCalledWith(
            '11111111-1111-1111-1111-111111111111',
        );

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error del servidor al obtener la información del cliente.',
            error: expect.any(Error),
        });
    });
});