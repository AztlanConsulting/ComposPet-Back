const request = require('supertest');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const app = require('../../app');
const prisma = require('../../config/prisma');

const { generateRefreshToken } = require('../../utils/jwt.utils');


// ─────────────────────────────────────────────────────────────────
// BLOQUE 2 — CONSTANTES DE PRUEBA
// ─────────────────────────────────────────────────────────────────

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();

const TEST_EMAIL = 'integration.login@compospet.com';
const TEST_PASSWORD = 'TestPass123!';

// ─────────────────────────────────────────────────────────────────
// BLOQUE 3 — HELPERS
// ─────────────────────────────────────────────────────────────────

const createTestUser = async (overrides = {}) => {
    const hashedPwd = await bcrypt.hash(TEST_PASSWORD, 12);
    return prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: 'Usuario',
            apellido: 'Test',
            correo: TEST_EMAIL,
            contrasena: hashedPwd,
            estatus: true,
            intentos_fallidos: 0,
            ...overrides,
        },
    });
};

const generateValidRefreshToken = () => {
    return generateRefreshToken({
        userId: TEST_USER_ID,
        email:  TEST_EMAIL,
        role:   'test-role-integration',
    });
};

const cleanDb = async () => {
    await prisma.bitacora.deleteMany({ where: { app_user_id: TEST_USER_ID } });
    await prisma.usuarios_cp.deleteMany({ where: { correo: TEST_EMAIL } });
};

// ─────────────────────────────────────────────────────────────────
// BLOQUE 4 — HOOKS
// ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
    await cleanDb();
    // Crear dependencias base una sola vez
    await prisma.compospet.upsert({
        where: { id_cp: TEST_CP_ID },
        update: {},
        create: { id_cp: TEST_CP_ID },
    });
    await prisma.roles.upsert({
        where: { id_rol: TEST_ROLE_ID },
        update: {},
        create: { id_rol: TEST_ROLE_ID, nombre: 'test-role-integration' },
    });
});

afterEach(async () => await cleanDb()); // cada prueba empieza limpia

afterAll(async () => {
    await prisma.roles.deleteMany({ where: { id_rol: TEST_ROLE_ID } });
    await prisma.compospet.deleteMany({ where: { id_cp: TEST_CP_ID } });
    await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────
// BLOQUE 5 — CASOS DE PRUEBA
// ─────────────────────────────────────────────────────────────────

describe('POST /api/inicio-sesion', () => {

    it('retorna 200 y accessToken con credenciales válidas', async () => {
        // Arrange — preparar el estado inicial
        await createTestUser();

        // Act — ejecutar la acción que queremos probar
        const res = await request(app)
        .post('/api/inicio-sesion')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

        // Assert — verificar el resultado
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.correo).toBe(TEST_EMAIL);
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('retorna 401 con contraseña incorrecta', async () => {
        // Arrange
        await createTestUser();

        // Act
        const res = await request(app)
        .post('/api/inicio-sesion')
        .send({ email: TEST_EMAIL, password: 'wrongpass' }); // Enviamos la contraseña incorrecta a propósito.

        // Assert
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Credenciales incorrectas.');
        // Verificamos el mensaje exacto que devuelve el controlador.
    });

    it('retorna 401 si el usuario no existe', async () => {

        // Arrange — intencionalmente NO creamos usuario

        // Act
        const res = await request(app)
        .post('/api/inicio-sesion')
        .send({ email: 'noexiste@compospet.com', password: TEST_PASSWORD });

        // Assert
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Credenciales incorrectas.');
    });

    it('incrementa intentos_fallidos en BD al fallar', async () => {
        // Este test va más allá del status HTTP

        // Arrange
        await createTestUser();

        // Act
        await request(app)
        .post('/api/inicio-sesion')
        .send({ email: TEST_EMAIL, password: 'wrongpass' });
        // Un solo intento fallido.

        // Assert — consultamos directamente la BD
        const user = await prisma.usuarios_cp.findUnique({
        where: { id_usuario: TEST_USER_ID },
        });

        expect(user.intentos_fallidos).toBe(1);
        // Verificamos que el contador aumentó de 0 a 1 en BD.
    });

    it('bloquea la cuenta tras 5 intentos fallidos', async () => {
        // Arrange
        await createTestUser();

        // Act — 5 intentos fallidos consecutivos
        for (let i = 0; i < 5; i++) {
        await request(app)
            .post('/api/inicio-sesion')
            .send({ email: TEST_EMAIL, password: 'wrong' });
        }

        // Assert
        const user = await prisma.usuarios_cp.findUnique({
        where: { id_usuario: TEST_USER_ID },
        });

        expect(user.bloqueado_hasta).not.toBeNull();
        // Verificamos que bloqueado_hasta tiene una fecha.
    });

    it('retorna 401 cuando la cuenta está bloqueada', async () => {
        // Arrange — creamos el usuario ya bloqueado directamente en BD
        await createTestUser({
        bloqueado_hasta: new Date(Date.now() + 15 * 60 * 1000),
        // Seteamos bloqueado_hasta 15 minutos en el futuro.
        });

        // Act
        const res = await request(app)
        .post('/api/inicio-sesion')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
        // Enviamos la contraseña CORRECTA para confirmar que el bloqueo

        // Assert
        expect(res.status).toBe(401);
        expect(res.body.message).toContain('Cuenta bloqueda');
        /* Usamos toContain en lugar de toBe porque el mensaje incluye
        el tiempo dinámico: "Cuenta bloqueda. Intente en 15 minutos."*/
    });

    it('limpia intentos_fallidos en BD tras login exitoso', async () => {
        // Arrange — usuario con intentos previos acumulados
        await createTestUser({ intentos_fallidos: 2 });

        // Act
        await request(app)
        .post('/api/inicio-sesion')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

        // Assert
        const user = await prisma.usuarios_cp.findUnique({
        where: { id_usuario: TEST_USER_ID },
        });

        expect(user.intentos_fallidos).toBe(0);
        expect(user.bloqueado_hasta).toBeNull();
    });

});

describe('POST /api/auth/refresh', () => {

    it('retorna 200 y nuevo accessToken con refreshToken válido', async () => {
        // Arrange
        await createTestUser();
        const validRefreshToken = generateValidRefreshToken();
        /* No hacemos login primero porque eso acoplaría este test
        al comportamiento de login. Cada test debe ser independiente.*/

        // Act
        const res = await request(app)
        .post('/api/refresh')
        .set('Cookie', `refreshToken=${validRefreshToken}`);

        // Assert
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        // Verificamos que devolvió un nuevo accessToken.
    });

    it('la respuesta setea una nueva cookie refreshToken', async () => {
        // Arrange
        await createTestUser();
        const validRefreshToken = generateValidRefreshToken();

        // Act
        const res = await request(app)
        .post('/api/refresh')
        .set('Cookie', `refreshToken=${validRefreshToken}`);

        // Assert
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
    });

    it('retorna 403 si no hay cookie refreshToken', async () => {
        // Arrange — no seteamos ninguna cookie

        // Act
        const res = await request(app)
        .post('/api/refresh');

        // Assert
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('No hay token de refresco.');
    });

    it('retorna 403 si el refreshToken está manipulado', async () => {
        // Arrange
        const tokenManipulado = 'esto.no.esuntoken';

        // Act
        const res = await request(app)
        .post('/api/refresh')
        .set('Cookie', `refreshToken=${tokenManipulado}`);

        // Assert
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Token de refresco inválido o expirado.');
    });

    it('retorna 403 si el refreshToken está expirado', async () => {
        // Arrange
        const jwt = require('jsonwebtoken');
        const tokenExpirado = jwt.sign(
        { userId: TEST_USER_ID, email: TEST_EMAIL, role: 'test-role-integration' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '1ms' }
        /*Expira en 1 milisegundo — para cuando llegue al controlador
        ya estará vencido.*/
        );

        await new Promise(r => setTimeout(r, 10));

        // Act
        const res = await request(app)
        .post('/api/refresh')
        .set('Cookie', `refreshToken=${tokenExpirado}`);

        // Assert
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Token de refresco inválido o expirado.');
    });

});