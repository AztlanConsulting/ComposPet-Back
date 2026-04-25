const { googleAuth } = require('../../../controllers/auth/auth.controller');
const AuthModel = require('../../../models/auth/auth.model');
const { callExternalApi } = require('../../../middlewares/externalApiClient');
const { generateAccessToken, generateRefreshToken } = require('../../../utils/jwt.utils');
const { logIfAdmin } = require('../../../utils/logIfAdmin');

// ─── MOCKS ───────────────────────────────────────────────────────
jest.mock('../../../models/auth/auth.model');
jest.mock('../../../middlewares/externalApiClient');
jest.mock('../../../utils/logIfAdmin');
jest.mock('../../../utils/jwt.utils', () => ({
    generateAccessToken: jest.fn().mockReturnValue('fake-access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('fake-refresh-token'),
    verifyRefreshToken: jest.fn(),
}));

// googleapis necesita un factory manual porque usa clases
jest.mock('googleapis', () => {
    const mockGet = jest.fn();
    const mockUserinfo = { get: mockGet };
    const mockOauth2Instance = { userinfo: mockUserinfo };

    return {
        google: {
            auth: {
                OAuth2: jest.fn().mockImplementation(() => ({
                    setCredentials: jest.fn(),
                })),
            },
            oauth2: jest.fn().mockReturnValue(mockOauth2Instance),
            // Exponemos mockGet para poder controlarlo en cada test
            __mockUserinfoGet: mockGet,
        },
    };
});

// Helper para acceder al mock de userinfo.get
const { google } = require('googleapis');

// ─── HELPERS ──────────────────────────────────────────────────────
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
};

// ─── TESTS ────────────────────────────────────────────────────────
describe('Pruebas Unitarias: Google Auth', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('debe retornar 401 si el correo de Google no está registrado', async () => {
        // Arrange
        callExternalApi.mockResolvedValue({
            data: { email: 'noregistrado@gmail.com', name: 'Test', picture: '' }
        });
        AuthModel.findUserByEmail.mockResolvedValue(null);

        const req = { body: { token: 'google-token-valido' } };
        const res = mockResponse();

        // Act
        await googleAuth(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            msg: expect.stringContaining('no tiene acceso')
        }));
    });

    test('debe retornar 200 y accessToken si el usuario existe', async () => {
        // Arrange
        callExternalApi.mockResolvedValue({
            data: { email: 'kamila@compospet.com', name: 'Kamila', picture: 'http://pic.url' }
        });
        AuthModel.findUserByEmail.mockResolvedValue({
            id_usuario: 1,
            correo: 'kamila@compospet.com',
            primer_inicio_sesion: false,
            roles: { nombre: 'admin' },
        });

        const req = { body: { token: 'google-token-valido' } };
        const res = mockResponse();

        // Act
        await googleAuth(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            accessToken: 'fake-access-token',
            user: expect.objectContaining({
                email: 'kamila@compospet.com',
                rol: 'admin',
            }),
        }));
        // Verifica que se setean las cookies
        expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'fake-refresh-token', expect.any(Object));
        expect(res.cookie).toHaveBeenCalledWith('googleToken', 'google-token-valido', expect.any(Object));
    });

    test('debe retornar 400 si el token de Google es inválido (callExternalApi lanza error)', async () => {
        // Arrange — simulamos que Google rechaza el token
        callExternalApi.mockRejectedValue(new Error('Token inválido'));

        const req = { body: { token: 'token-malo' } };
        const res = mockResponse();

        // Act
        await googleAuth(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            msg: 'Token de Google inválido o expirado'
        }));
    });

    test('debe llamar logIfAdmin con LOGIN_GOOGLE_EXITOSO tras autenticación correcta', async () => {
        // Arrange
        const fakeUser = {
            id_usuario: 1,
            correo: 'kamila@compospet.com',
            primer_inicio_sesion: false,
            roles: { nombre: 'admin' },
        };
        callExternalApi.mockResolvedValue({
            data: { email: 'kamila@compospet.com', name: 'Kamila', picture: '' }
        });
        AuthModel.findUserByEmail.mockResolvedValue(fakeUser);

        const req = { body: { token: 'google-token-valido' } };
        const res = mockResponse();

        // Act
        await googleAuth(req, res);

        // Assert
        expect(logIfAdmin).toHaveBeenCalledWith(fakeUser, 'LOGIN_GOOGLE_EXITOSO', expect.any(String));
    });
});