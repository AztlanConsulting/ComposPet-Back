const { getTableInfo, getFilteredRoutesInfo, getAvailableWeeks } = require('../../../controllers/tableRoutes.controller');
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

describe('Controller - getFilteredRoutesInfo', () => {
    let req, res;

    beforeEach(() => {
        req = { query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('debe retornar 200 con los datos filtrados', async () => {
        const mockFiltered = [{ nombre: 'Alejandra Arredondo' }];
        routesModel.getFilteredRoutesInfo.mockResolvedValue(mockFiltered);

        req.query = { weekIndex: '2', dayName: 'Lunes' };

        await getFilteredRoutesInfo(req, res);

        expect(routesModel.getFilteredRoutesInfo).toHaveBeenCalledWith({
            weekIndex: 2,
            dayName: 'Lunes',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockFiltered,
        });
    });

    it('debe usar undefined si dayName no viene', async () => {
        routesModel.getFilteredRoutesInfo.mockResolvedValue([]);

        req.query = { weekIndex: '1' };
        await getFilteredRoutesInfo(req, res);

        expect(routesModel.getFilteredRoutesInfo).toHaveBeenCalledWith({
            weekIndex: 1,
            dayName: undefined,
        });
    });

    it('debe retornar 500 si el modelo falla', async () => {
        routesModel.getFilteredRoutesInfo.mockRejectedValue(new Error('DB Error'));

        req.query = { weekIndex: '0', dayName: 'Martes' };
        await getFilteredRoutesInfo(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('Controller - getAvailableWeeks', () => {
    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('debe retornar 200 con las semanas disponibles', async () => {
        const mockWeeks = [{ weekStart: new Date(), weekEnd: new Date(), label: 'Semana 1 - Mayo' }];
        routesModel.getAvailableWeeks.mockReturnValue(mockWeeks);

        await getAvailableWeeks(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockWeeks,
        });
    });

    it('debe retornar 500 si falla', async () => {
        routesModel.getAvailableWeeks.mockImplementation(() => {
            throw new Error('Error');
        });

        await getAvailableWeeks(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});