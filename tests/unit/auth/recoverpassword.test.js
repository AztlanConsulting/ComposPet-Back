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

describe('Pruebas de Flujo OTP (Primer Inicio)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('requestOTP', () => {
        test('debe retornar 404 si el usuario no tiene pendiente primer inicio', async () => {
            // Simulamos que el usuario no existe
            AuthModel.findUserByEmail.mockResolvedValue(null);
            const req = { body: { email: 'test@test.com', isFirstLogin: true } };
            const res = mockResponse();

            await requestOTP(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'El correo proporcionado no está registrado.' 
            });
        });

        test('debe generar OTP y seedToken exitosamente', async () => {
            const fakeUser = { id_usuario: 1, correo: 'test@test.com', primer_inicio_sesion: true };
            AuthModel.findUserByEmail.mockResolvedValue(fakeUser);
            jwt.sign.mockReturnValue('fake-seed-token');
            PasswordModel.setVerificationCode.mockResolvedValue(true);

            const req = { body: { email: 'test@test.com', isFirstLogin: true } };
            const res = mockResponse();

            await requestOTP(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, seedToken: 'fake-seed-token' });
        });
    });

    describe('verifyOTP', () => {
        test('debe generar flowToken si el OTP es correcto', async () => {
            jwt.verify.mockReturnValue({ step: 'CAN_VERIFY_FIRST_LOGIN', email: 'test@test.com' });
            
            PasswordModel.findUserByStatus.mockResolvedValue({
                id_usuario: 1,
                correo: 'test@test.com',
                codigo_verificacion: '123456',
                codigo_expiracion: new Date(Date.now() + 100000)
            });
            
            jwt.sign.mockReturnValue('fake-flow-token');

            const req = { body: { email: 'test@test.com', code: '123456', seedToken: 'valid-token' } };
            const res = mockResponse();

            await verifyOTP(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, flowToken: 'fake-flow-token' });
        });
        test('debe retornar 401 si el código es incorrecto', async () => {
            jwt.verify.mockReturnValue({ step: 'CAN_VERIFY_FIRST_LOGIN', email: 'test@test.com' });
            
            PasswordModel.findUserByStatus.mockResolvedValue({
                id_usuario: 1,
                correo: 'test@test.com',
                codigo_verificacion: '654321', 
                intentos_fallidos: 0
            });

            const req = { body: { email: 'test@test.com', code: '123456', seedToken: 'valid' } };
            const res = mockResponse();

            await verifyOTP(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Código incorrecto.' }));
            // Verificamos que se aumentó el contador de intentos
            expect(AuthModel.updateLoginTry).toHaveBeenCalledWith(1, 1);
        });

        test('debe bloquear la cuenta si supera el máximo de intentos', async () => {
            jwt.verify.mockReturnValue({ step: 'CAN_VERIFY_FIRST_LOGIN', email: 'test@test.com' });
            
            PasswordModel.findUserByStatus.mockResolvedValue({
                id_usuario: 1,
                codigo_verificacion: '654321',
                intentos_fallidos: 4 
            });

            const req = { body: { email: 'test@test.com', code: 'WRONG', seedToken: 'valid' } };
            const res = mockResponse();

            await verifyOTP(req, res);

            expect(AuthModel.lockAccount).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Cuenta bloqueada.' });
        });
    });

    describe('updatePassword', () => {
        test('debe actualizar la contraseña con un flowToken válido', async () => {
            jwt.verify.mockReturnValue({ step: 'VERIFIED_STEP', email: 'test@test.com', isFirstLogin: true });
            
            PasswordModel.findUserByStatus.mockResolvedValue({ id_usuario: 1, correo: 'test@test.com' });
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed');
            PasswordModel.completeFirstLogin.mockResolvedValue(true);

            const req = { body: { email: 'test@test.com', password: 'newPassword123', flowToken: 'valid-flow' } };
            const res = mockResponse();

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(PasswordModel.completeFirstLogin).toHaveBeenCalledWith(1, 'hashed');
        });
        test('debe retornar 403 si el flowToken no coincide con el email', async () => {
            jwt.verify.mockReturnValue({ step: 'VERIFIED_STEP', email: 'otro@test.com' });
            
            const req = { body: { email: 'test@test.com', password: 'new', flowToken: 'valid' } };
            const res = mockResponse();

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Sesión de solicitud inválida.' });
        });

        test('debe retornar 500 si hay un error en el hash o base de datos', async () => {
            jwt.verify.mockReturnValue({ step: 'VERIFIED_STEP', email: 'test@test.com' });
            PasswordModel.findUserByStatus.mockResolvedValue({ id_usuario: 1 });
            
            bcrypt.genSalt.mockRejectedValue(new Error('Bcrypt failed'));

            const req = { body: { email: 'test@test.com', password: 'new', flowToken: 'valid' } };
            const res = mockResponse();

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error al guardar la contraseña.' });
        });
    });
});