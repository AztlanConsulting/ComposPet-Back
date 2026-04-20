const { login } = require('../../../controllers/auth/auth.controller');

const AuthModel = require('../../../models/auth/auth.model');
const bcrypt = require('bcrypt');
const jwtUtils = require('../../../utils/jwt.utils');
const { logIfAdmin } = require('../../../utils/logIfAdmin');

/**
 * Mocks de las dependencias externas del controlador.
 * Se sustituyen para aislar la lógica del controlador de la base de datos,
 * el cifrado y la generación de tokens durante las pruebas.
 */
jest.mock('../../../models/auth/auth.model');
jest.mock('bcrypt');
jest.mock('../../../utils/jwt.utils');
jest.mock('../../../utils/logIfAdmin');

/**
 * Genera un objeto `res` simulado compatible con Express.
 * Implementa los métodos `status`, `json` y `cookie` como espías de Jest,
 * encadenando `status` para permitir el patrón `res.status(X).json(Y)`.
 *
 * @returns {{ status: jest.Mock, json: jest.Mock, cookie: jest.Mock }}
 * Objeto de respuesta HTTP simulado.
 */
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    res.cookie = jest.fn();
    return res;
};

/**
 * @group Autenticación
 * Suite de pruebas del controlador `login`.
 * Verifica el comportamiento del flujo de autenticación ante distintos
 * escenarios: usuario inexistente, contraseña incorrecta, cuenta bloqueada,
 * bloqueo por intentos excedidos y login exitoso.
 */

test('debe regresar 401 si el usuario no existe', async () => {
    // findUserByEmail retorna null cuando el correo no está registrado o el usuario está inactivo
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

    // Con 1 intento fallido no se bloquea la cuenta, solo se incrementa el contador
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

    // El refresh token se envía como cookie HttpOnly; el access token va en el cuerpo
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
        bloqueado_hasta: new Date(Date.now() + 10000), // fecha en el futuro: bloqueo vigente
        roles: { nombre: 'admin' }
    };

    AuthModel.findUserByEmail.mockResolvedValue(fakeUser);

    const req = {
        body: { email: 'test@test.com', password: '1234' }
    };
    const res = mockResponse();

    await login(req, res);

    // No se debe comparar la contraseña si la cuenta ya está bloqueada
    expect(res.status).toHaveBeenCalledWith(401);
});

test('debe bloquear cuenta al superar intentos', async () => {
    const fakeUser = {
        id_usuario: 1,
        contrasena: 'hashed',
        intentos_fallidos: 4, // el siguiente intento fallido alcanza MAX_INTENTOS (5)
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