const { requestOTP, verifyOTP, updatePassword } = require('../../../controllers/auth/password.controller');
const PasswordModel = require('../../../models/auth/password.model');
const AuthModel = require('../../../models/auth/auth.model');
const GmailService = require('../../../config/gmail.service');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mocks
jest.mock('../../../models/auth/password.model');
jest.mock('../../../models/auth/auth.model');
jest.mock('../../../config/gmail.service');
jest.mock('../../../utils/logIfAdmin');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return res;
};

describe('Pruebas Unitarias: Primer Inicio de Sesión', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    // ─────────────────────────────────────────────────────────────────
    // 1. SOLICITUD DE OTP (requestOTP)
    // ─────────────────────────────────────────────────────────────────
    describe('requestOTP - Primer Inicio', () => {
        test('debe retornar 400 si el usuario ya está activo', async () => {
            // Simulamos que el usuario ya completó su primer inicio
            AuthModel.findUserByEmail.mockResolvedValue({ 
                id_usuario: 1, 
                primer_inicio_sesion: false 
            });

            const req = { body: { email: 'kamila@compospet.com', isFirstLogin: true } };
            const res = mockResponse();

            await requestOTP(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Esta cuenta ya se encuentra activa.' 
            });
        });

        test('debe enviar correo y retornar seedToken si es usuario nuevo', async () => {
            AuthModel.findUserByEmail.mockResolvedValue({ 
                id_usuario: 1, 
                correo: 'kamila@compospet.com',
                primer_inicio_sesion: true 
            });
            PasswordModel.setVerificationCode.mockResolvedValue(true);
            jwt.sign.mockReturnValue('fake-seed-token');
            GmailService.sendStaticEmail.mockResolvedValue(true);

            const req = { body: { email: 'kamila@compospet.com', isFirstLogin: true } };
            const res = mockResponse();

            await requestOTP(req, res);

            expect(GmailService.sendStaticEmail).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                success: true, 
                seedToken: 'fake-seed-token' 
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────
    // 2. VERIFICACIÓN DE OTP (verifyOTP)
    // ─────────────────────────────────────────────────────────────────
    describe('verifyOTP - Primer Inicio', () => {
        test('debe retornar 401 si el código no coincide', async () => {
            jwt.verify.mockReturnValue({ 
                email: 'kamila@compospet.com', 
                step: 'CAN_VERIFY_FIRST_LOGIN' 
            });
            
            PasswordModel.findUserByStatus.mockResolvedValue({
                id_usuario: 1,
                codigo_verificacion: '999999', // Correcto
                intentos_fallidos: 2
            });

            const req = { body: { 
                email: 'kamila@compospet.com', 
                code: '123456', // Enviado (incorrecto)
                seedToken: 'valid' 
            } };
            const res = mockResponse();

            await verifyOTP(req, res);

            // Debe aumentar el contador de intentos (2 + 1 = 3)
            expect(AuthModel.updateLoginTry).toHaveBeenCalledWith(1, 3);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: 'Código incorrecto.' 
            }));
        });

        test('debe generar flowToken si el código es correcto', async () => {
            jwt.verify.mockReturnValue({ 
                email: 'kamila@compospet.com', 
                step: 'CAN_VERIFY_FIRST_LOGIN' 
            });
            
            PasswordModel.findUserByStatus.mockResolvedValue({
                id_usuario: 1,
                codigo_verificacion: '123456',
                codigo_expiracion: new Date(Date.now() + 50000)
            });
            jwt.sign.mockReturnValue('fake-flow-token');

            const req = { body: { 
                email: 'kamila@compospet.com', 
                code: '123456', 
                seedToken: 'valid' 
            } };
            const res = mockResponse();

            await verifyOTP(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                success: true, 
                flowToken: 'fake-flow-token' 
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────
    // 3. ACTUALIZACIÓN (updatePassword)
    // ─────────────────────────────────────────────────────────────────
    describe('updatePassword - Primer Inicio', () => {
        test('debe completar el registro exitosamente', async () => {
            // El token debe decir que viene de un primer inicio exitoso
            jwt.verify.mockReturnValue({ 
                email: 'kamila@compospet.com', 
                step: 'VERIFIED_STEP', 
                isFirstLogin: true 
            });
            
            PasswordModel.findUserByStatus.mockResolvedValue({ id_usuario: 1 });
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed-pass');
            PasswordModel.completeFirstLogin.mockResolvedValue(true);

            const req = { body: { 
                email: 'kamila@compospet.com', 
                password: 'NewPassword2026', 
                flowToken: 'valid-flow' 
            } };
            const res = mockResponse();

            await updatePassword(req, res);

            // Importante: Verifica que se use el método del modelo correcto
            expect(PasswordModel.completeFirstLogin).toHaveBeenCalledWith(1, 'hashed-pass');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                success: true, 
                message: 'Contraseña actualizada con éxito.' 
            });
        });

        test('debe retornar 500 si falla la base de datos al guardar', async () => {
            jwt.verify.mockReturnValue({ 
                email: 'kamila@compospet.com', 
                step: 'VERIFIED_STEP',
                isFirstLogin: true   // 👈 sin esto entra al else y llama otro método
            });
            PasswordModel.findUserByStatus.mockResolvedValue({ id_usuario: 1 });
            bcrypt.genSalt.mockResolvedValue('salt');  // 👈 el controlador siempre llama genSalt primero
            bcrypt.hash.mockResolvedValue('hashed');
                        
            // Simulamos error en el modelo
            PasswordModel.completeFirstLogin.mockRejectedValue(new Error('DB Error'));

            const req = { body: { email: 'kamila@compospet.com', password: 'new', flowToken: 'valid' } };
            const res = mockResponse();

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Error al guardar la contraseña.' 
            });
        });
    });
});