const request = require('supertest');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const prisma = require('../../config/prisma');

// ─────────────────────────────────────────────────────────────────
// CONSTANTES Y HELPERS
// ─────────────────────────────────────────────────────────────────
const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_EMAIL = 'logout.test@compospet.com';

const generateTestAccessToken = () => {
    return jwt.sign(
        { userId: TEST_USER_ID, email: TEST_EMAIL, role: 'Cliente' },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: '15m',
            issuer: 'compospet-api',
            audience: 'compospet-client',
        }
    );
};

const createTestUser = async () => {
    return prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: 'Logout',
            apellido: 'Test',
            correo: TEST_EMAIL,
            contrasena: 'hashed_pass',
            estatus: true,
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });
};

const createTestSession = async (refresh_token) => {
    return prisma.sesiones.create({
        data: {
            id_usuario: TEST_USER_ID,
            refresh_token,
            expira_en: new Date(Date.now() + 5 * 60 * 60 * 1000),
            activa: true,
        }
    });
};

const cleanDb = async () => {
    await prisma.sesiones.deleteMany({ where: { id_usuario: TEST_USER_ID } });
    await prisma.usuarios_cp.deleteMany({ where: { correo: TEST_EMAIL } });
};

// ─────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
    await cleanDb();
    await prisma.compospet.upsert({
        where: { id_cp: TEST_CP_ID },
        update: {},
        create: { id_cp: TEST_CP_ID }
    });
    await prisma.roles.upsert({
        where: { id_rol: TEST_ROLE_ID },
        update: {},
        create: { id_rol: TEST_ROLE_ID, nombre: 'cliente' }
    });
});

afterEach(async () => {
    await cleanDb();
    jest.clearAllMocks();
});

afterAll(async () => {
    await cleanDb();
    await prisma.roles.deleteMany({ where: { id_rol: TEST_ROLE_ID } });
    await prisma.compospet.deleteMany({ where: { id_cp: TEST_CP_ID } });
    await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────
// CASOS DE PRUEBA
// ─────────────────────────────────────────────────────────────────
describe('Auth Logout Integration', () => {

    it('debe cerrar sesión exitosamente y marcar sesión como inactiva en DB', async () => {
        // --- Arrange ---
        await createTestUser();
        const accessToken = generateTestAccessToken();
        const fakeRefreshToken = jwt.sign(
            { userId: TEST_USER_ID, email: TEST_EMAIL, role: 'cliente' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
        await createTestSession(fakeRefreshToken);

        // --- Act ---
        const res = await request(app)
            .post('/api/cerrar-sesion')
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', [`refreshToken=${fakeRefreshToken}`]);

        // --- Assert ---
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Session closed successfully.');

        const session = await prisma.sesiones.findFirst({
            where: { refresh_token: fakeRefreshToken }
        });
        expect(session.activa).toBe(false);

        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
    });

    it('debe retornar 401 si no se envía Access Token', async () => {
        // --- Act ---
        const res = await request(app)
            .post('/api/cerrar-sesion');

        // --- Assert ---
        expect(res.status).toBe(401);
    });

    it('debe retornar 200 aunque no haya cookie de refreshToken', async () => {
        // --- Arrange ---
        await createTestUser();
        const accessToken = generateTestAccessToken();

        // --- Act ---
        const res = await request(app)
            .post('/api/cerrar-sesion')
            .set('Authorization', `Bearer ${accessToken}`);

        // --- Assert ---
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Session closed successfully.');
    });

    it('debe retornar 200 aunque el token no exista en DB (sesión ya cerrada)', async () => {
        // --- Arrange ---
        await createTestUser();
        const accessToken = generateTestAccessToken();
        const fakeRefreshToken = jwt.sign(
            { userId: TEST_USER_ID, email: TEST_EMAIL, role: 'cliente' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // --- Act ---
        const res = await request(app)
            .post('/api/cerrar-sesion')
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', [`refreshToken=${fakeRefreshToken}`]);

        // --- Assert ---
        expect(res.status).toBe(200);
    });
});