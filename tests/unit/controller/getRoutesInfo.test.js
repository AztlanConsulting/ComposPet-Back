const { getTableInfo } = require('../../../controllers/tableRoutes.controller');
const routesModel = require('../../../models/route.model');

jest.mock('../../../models/route.model');

describe('Controller - getRoutesInfo', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {},
        }

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    })

    it('debe regresar 200 con la información de la ruta', async () => {
        const mockedRoutes = [{
            nombre: 'Alejandra Arredondo',
        }];

        routesModel.getRoutesInfo.mockResolvedValue(mockedRoutes);

        await getTableInfo(req, res);

        expect(routesModel.getRoutesInfo).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            success:true,
            data: mockedRoutes,
        });
    });

    it('debe regresar status 500 en caso de ocurrir error', async() => {
        routesModel.getRoutesInfo.mockRejectedValue(
            new Error('DB Error')
        );

        await getTableInfo(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success:false,
            message: 'Ocurrió un error obteniendo la información.',
        });
    });
});