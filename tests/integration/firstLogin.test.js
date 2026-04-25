const request = require('supertest');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const app = require('../../app');
const prisma = require('../../config/prisma');
const GmailService = require('../../config/gmail.service');
const jwt = require('jsonwebtoken');

jest.mock('../../config/gmail.service');

// ─────────────────────────────────────────────────────────────────
// CONSTANTES Y HELPERS
// ─────────────────────────────────────────────────────────────────
const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_EMAIL = 'otp.password.test@compospet.com';
const TEST_PASSWORD = 'NewSecurePass123!';

const createTestUser = async (overrides = {}) => {
    return prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: 'Kamila',
            apellido: 'Test',
            correo: TEST_EMAIL,
            contrasena: 'temp_hash', 
            estatus: true,
            primer_inicio_sesion: true, 
            intentos_fallidos: 0,
            ...overrides,
        },
    });
};

const cleanDb = async () => {
    await prisma.bitacora.deleteMany({ where: { app_user_id: TEST_USER_ID } });
    await prisma.usuarios_cp.deleteMany({ where: { correo: TEST_EMAIL } });
};

// ─────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
    await cleanDb();
    await prisma.compospet.upsert({ where: { id_cp: TEST_CP_ID }, update: {}, create: { id_cp: TEST_CP_ID } });
    await prisma.roles.upsert({
        where: { id_rol: TEST_ROLE_ID },
        update: {},
        create: { id_rol: TEST_ROLE_ID, nombre: 'test-role' },
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
// CASOS DE PRUEBA: FLUJOS DE ERROR
// ─────────────────────────────────────────────────────────────────
describe('Auth OTP Integration - Error Flows', () => {

    it('retorna 400 si la cuenta ya está activa (primer_inicio_sesion: false)', async () => {
        // --- Arrange (Preparar) ---
        await createTestUser({ primer_inicio_sesion: false });

        // --- Act (Actuar) ---
        const res = await request(app)
            .post('/api/request-otp')
            .send({ email: TEST_EMAIL, isFirstLogin: true });

        // --- Assert (Afirmar) ---
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Esta cuenta ya se encuentra activa.');
    });

    it('retorna 404 si el correo no existe en la base de datos', async () => {
        // --- Arrange ---
        // No creamos usuario para simular que no existe

        // --- Act ---
        const res = await request(app)
            .post('/api/request-otp')
            .send({ email: 'noexiste@compospet.com', isFirstLogin: true });

        // --- Assert ---
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('El correo proporcionado no está registrado.');
    });

    it('retorna 500 si falla el envío de correo (GmailService error)', async () => {
        // --- Arrange ---
        await createTestUser();
        GmailService.sendStaticEmail.mockRejectedValue(new Error('SMTP Error'));

        // --- Act ---
        const res = await request(app)
            .post('/api/request-otp')
            .send({ email: TEST_EMAIL, isFirstLogin: true });

        // --- Assert ---
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Error del servidor, inténtalo más tarde.');
    });

    it('retorna 401 si el código OTP es incorrecto', async () => {
        // --- Arrange ---
        await createTestUser({
            codigo_verificacion: '123456',
            codigo_expiracion: new Date(Date.now() + 10000) 
        });
        const validSeedToken = jwt.sign(
            { email: TEST_EMAIL, step: 'CAN_VERIFY_FIRST_LOGIN' },
            process.env.JWT_SECRET
        );

        // --- Act ---
        const res = await request(app)
            .post('/api/verify-otp')
            .send({ 
                email: TEST_EMAIL, 
                code: '999999', // Código erróneo
                seedToken: validSeedToken 
            });

        // --- Assert ---
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Código incorrecto.');
    });

    it('retorna 401 si el código OTP ya expiró', async () => {
        // --- Arrange ---
        await createTestUser({
            codigo_verificacion: '123456',
            codigo_expiracion: new Date(Date.now() - 5 * 60 * 1000) // Expirado hace 5 min
        });
        const validSeedToken = jwt.sign(
            { email: TEST_EMAIL, step: 'CAN_VERIFY_FIRST_LOGIN' },
            process.env.JWT_SECRET
        );

        // --- Act ---
        const res = await request(app)
            .post('/api/verify-otp')
            .send({ 
                email: TEST_EMAIL, 
                code: '123456',
                seedToken: validSeedToken 
            });

        // --- Assert ---
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Código expirado.');
    });

    it('retorna 403 si el seedtoken no es correcto o está manipulado', async () => {
        // --- Arrange ---
        await createTestUser();
        
        // --- Act ---
        const res = await request(app)
            .post('/api/verify-otp')
            .send({ 
                email: TEST_EMAIL, 
                code: '123456', 
                seedToken: 'token.mal.formado' 
            });

        // --- Assert ---
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Sesión de solicitud inválida.');
    });

    it('retorna 500 si no pudo actualizar la contraseña (Fase 3 - flowToken inválido)', async () => {
        // --- Arrange ---
        await createTestUser();

        // --- Act ---
        const res = await request(app)
            .post('/api/update-password')
            .send({ 
                email: TEST_EMAIL, 
                password: TEST_PASSWORD, 
                flowToken: 'token_invalido' 
            });

        // --- Assert ---
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Error al guardar la contraseña.');
    });
});

describe('Auth OTP Integration - Success Flow', () => {
    it('debe completar el flujo desde OTP hasta cambio de contraseña exitoso', async () => {
        // --- Arrange ---
        await createTestUser();
        let capturedOtp;

        GmailService.sendStaticEmail.mockImplementation((to, subj, code) => {
            capturedOtp = code;
            return Promise.resolve();
        });

        // --- Act (Multi-paso) ---
        
        // Paso 1: Pedir OTP
        const res1 = await request(app)
            .post('/api/request-otp')
            .send({ email: TEST_EMAIL, isFirstLogin: true });
        const { seedToken } = res1.body;

        // Paso 2: Verificar OTP
        const res2 = await request(app)
            .post('/api/verify-otp')
            .send({ email: TEST_EMAIL, code: capturedOtp, seedToken });
        const { flowToken } = res2.body;

        // Paso 3: Cambiar contraseña
        const res3 = await request(app)
            .post('/api/update-password')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD, flowToken });

        // --- Assert ---
        expect(res2.status).toBe(200);
        expect(res3.status).toBe(200);
        expect(res3.body.message).toBe('Contraseña actualizada con éxito.');

        // Verificación final en base de datos
        const updatedUser = await prisma.usuarios_cp.findUnique({ where: { id_usuario: TEST_USER_ID } });
        expect(updatedUser.primer_inicio_sesion).toBe(false);
    });
});