const { logout } = require('../../../controllers/auth/auth.controller');
const AuthModel = require('../../../models/auth/auth.model');
const jwtUtils = require('../../../utils/jwt.utils');
const { logIfAdmin } = require('../../../utils/logIfAdmin');
const bcrypt = require('bcrypt');

jest.mock('../../../models/auth/auth.model');
jest.mock('../../../utils/jwt.utils');
jest.mock('../../../utils/logIfAdmin');
jest.mock('bcrypt');

describe('Controlador Logout', () => {
    let req, res;

    beforeEach(() => {
        req = { cookies: {} };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            clearCookie: jest.fn(),
        };

        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    describe('Cerrar sesión', () => {

        test('Debe cerrar sesión exitosamente y limpiar la cookie', async () => {
            // Arrange
            req.cookies.refreshToken = 'fake.refresh.token';
            AuthModel.closeSession.mockResolvedValue({ activa: false });

            // Act
            await logout(req, res);

            // Assert
            expect(AuthModel.closeSession).toHaveBeenCalledWith('fake.refresh.token');
            expect(res.clearCookie).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Session closed successfully.'
            });
        });

        test('Debe limpiar la cookie aunque no haya token en la cookie', async () => {
            // Arrange
            // req.cookies vacío — sin refreshToken

            // Act
            await logout(req, res);

            // Assert
            expect(AuthModel.closeSession).not.toHaveBeenCalled();
            expect(res.clearCookie).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Session closed successfully.'
            });
        });

        test('Debe retornar 500 y registrar el error si falla la base de datos', async () => {
            // Arrange
            req.cookies.refreshToken = 'fake.refresh.token';
            const dbError = new Error('DB Error');
            AuthModel.closeSession.mockRejectedValue(dbError);

            // Act
            await logout(req, res);

            // Assert
            expect(console.error).toHaveBeenCalledWith('Error closing session:', dbError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Error closing session.'
            });
        });
    });
});