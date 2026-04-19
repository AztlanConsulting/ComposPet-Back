const { login } = require('../../../controllers/auth/auth.controller');

const AuthModel = require('../../../models/auth/auth.model');
const bcrypt = require('bcrypt');
const jwtUtils = require('../../../utils/jwt.utils');
const { logIfAdmin } = require('../../../utils/logIfAdmin');

// 🔥 mocks
jest.mock('../../../models/auth/auth.model');
jest.mock('bcrypt');
jest.mock('../../../utils/jwt.utils');
jest.mock('../../../utils/logIfAdmin');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    res.cookie = jest.fn();
    return res;
};

test('debe regresar 401 si el usuario no existe', async () => {
    AuthModel.findUserByEmail.mockResolvedValue(null);

    const req = {
        body: { email: 'test@test.com', password: '1234' }
    };
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
        message: 'Credenciales incorrectas.'
    });
});

test('debe fallar si la contraseña es incorrecta', async () => {
    const fakeUser = {
        id_usuario: 1,
        contrasena: 'hashed',
        intentos_fallidos: 0,
        roles: { nombre: 'cliente' }
    };

    AuthModel.findUserByEmail.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(false);
    AuthModel.updateLoginTry.mockResolvedValue();

    const req = {
        body: { email: 'test@test.com', password: 'wrong' }
    };
    const res = mockResponse();

    await login(req, res);

    expect(bcrypt.compare).toHaveBeenCalled();
    expect(AuthModel.updateLoginTry).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
});

test('debe hacer login correctamente', async () => {
    const fakeUser = {
        id_usuario: 1,
        correo: 'test@test.com',
        contrasena: 'hashed',
        roles: { nombre: 'admin' },
        primer_inicio_sesion: false
    };

    AuthModel.findUserByEmail.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    AuthModel.resetLoginTry.mockResolvedValue();

    jwtUtils.generateAccessToken.mockReturnValue('access-token');
    jwtUtils.generateRefreshToken.mockReturnValue('refresh-token');

    const req = {
        body: { email: 'test@test.com', password: '1234' }
    };
    const res = mockResponse();

    await login(req, res);

    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
        accessToken: 'access-token'
        })
    );
});

test('debe bloquear acceso si la cuenta está bloqueada', async () => {
    const fakeUser = {
        id_usuario: 1,
        bloqueado_hasta: new Date(Date.now() + 10000), // futuro
        roles: { nombre: 'admin' }
    };

    AuthModel.findUserByEmail.mockResolvedValue(fakeUser);

    const req = {
        body: { email: 'test@test.com', password: '1234' }
    };
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
});

test('debe bloquear cuenta al superar intentos', async () => {
    const fakeUser = {
        id_usuario: 1,
        contrasena: 'hashed',
        intentos_fallidos: 4,
        roles: { nombre: 'admin' }
    };

    AuthModel.findUserByEmail.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(false);

    const req = {
        body: { email: 'test@test.com', password: 'wrong' }
    };
    const res = mockResponse();

    await login(req, res);

    expect(AuthModel.lockAccount).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
});