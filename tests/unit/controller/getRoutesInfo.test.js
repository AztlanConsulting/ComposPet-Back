const routesController = require('../../../controllers/tableRoutes.controller');
const routesModel = require('../../../models/routes.model');

jest.mock('../../../models/routes.model');

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
})