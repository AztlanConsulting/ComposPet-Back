const {
    getCompostStatus,
    updateCompostStatus,
} = require('../../../controllers/client.controller');

const Client = require('../../../models/client.model');

jest.mock('../../../models/client.model', () => ({
    getCompostStatus: jest.fn(),
    updateCompostStatus: jest.fn(),
}));

describe('Unit - Controller - Compost Status', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('getCompostStatus', () => {
        it('debe responder 200 con el estatus de composta', async () => {
            Client.getCompostStatus.mockResolvedValue(true);

            await getCompostStatus(req, res);

            expect(Client.getCompostStatus).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: true,
            });
        });

        it('debe responder 500 si ocurre un error al obtener el estatus', async () => {
            Client.getCompostStatus.mockRejectedValue(new Error('DB_ERROR'));

            await getCompostStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error al obtener el estatus de la composta.',
            });
        });
    });

    describe('updateCompostStatus', () => {
        it('debe responder 200 si actualiza el estatus correctamente a true', async () => {
            req.body = {
                status: true,
            };

            Client.updateCompostStatus.mockResolvedValue({ count: 2 });

            await updateCompostStatus(req, res);

            expect(Client.updateCompostStatus).toHaveBeenCalledWith(true);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Estatus de composta actualizado exitosamente.',
            });
        });

        it('debe responder 200 si actualiza el estatus correctamente a false', async () => {
            req.body = {
                status: false,
            };

            Client.updateCompostStatus.mockResolvedValue({ count: 2 });

            await updateCompostStatus(req, res);

            expect(Client.updateCompostStatus).toHaveBeenCalledWith(false);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Estatus de composta actualizado exitosamente.',
            });
        });

        it('debe responder 500 si el status no es booleano', async () => {
            req.body = {
                status: 'true',
            };

            await updateCompostStatus(req, res);

            expect(Client.updateCompostStatus).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error al actualizar el estatus de la composta.',
            });
        });

        it('debe responder 500 si ocurre un error al actualizar el estatus', async () => {
            req.body = {
                status: true,
            };

            Client.updateCompostStatus.mockRejectedValue(new Error('DB_ERROR'));

            await updateCompostStatus(req, res);

            expect(Client.updateCompostStatus).toHaveBeenCalledWith(true);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error al actualizar el estatus de la composta.',
            });
        });
    });
});