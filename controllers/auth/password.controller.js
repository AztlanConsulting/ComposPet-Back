const AuthModel = require('../../models/auth/auth.model');
const PasswordModel = require('../../models/auth/password.model');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcrypt');
const { google } = require('googleapis');
const { callExternalApi } = require('../../middlewares/externalApiClient');
const crypto = require('crypto');
const GmailService = require('../../config/gmail.service');

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

/**
 * Registra un evento en bitácora únicamente si el usuario tiene rol de administrador.
 */
const logIfAdmin = async (user, accion, detalle = null) => {
    if (user && user.roles?.nombre === 'administrador') {
        await AuthModel.addLog(user.id_usuario, accion, detalle);
    }
};

/**
 * Controlador para la Fase 1 del primer inicio de sesión.
 * Verifica que el correo exista y tenga pendiente su primer acceso, genera un OTP
 * y lo guarda en la base de datos con una fecha de expiración.
 * * @param {import('express').Request} req - Body esperado: { email }
 * @param {import('express').Response} res 
 */
const requestOTP = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await PasswordModel.findUserForFirstLogin(email);

        if (!user) {
            return res.status(404).json({ message: 'No se encontró una solicitud de primer inicio para este correo.' });
        }

        const code = crypto.randomInt(100000, 999999).toString();

        const expires = new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000);

        await PasswordModel.setVerificationCode(user.id_usuario, code, expires);
        console.log(process.env.JWT_SECRET)
        const seedToken = jwt.sign(
            { email: user.correo, step: 'CAN_VERIFY' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        
        await logIfAdmin(user, 'SOLICITUD_OTP_PRIMER_LOGIN', `Correo: ${email}`);

        await GmailService.sendStaticEmail(
            email, 
            'Activa tu cuenta de Compospet', 
            `Tu código de verificación es: <b>${code}</b>`
        );

        console.log(`[DEBUG] OTP para ${email}: ${code}`);

        return res.status(200).json({ 
            success: true, 
            seedToken,
        });

    } catch (error) {
        console.error('Error en requestFirstLoginOTP:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


const verifyOTP = async (req, res) => {
    const { email, code, seedToken } = req.body;

    try {
        const decodedSeed = jwt.verify(seedToken, process.env.JWT_SECRET);
        if (decodedSeed.step !== 'CAN_VERIFY' || decodedSeed.email !== email) {
            return res.status(403).json({ message: 'Sesión de solicitud inválida.' });
        }

        const user = await PasswordModel.findUserForFirstLogin(email);
        if (!user) return res.status(401).json({ message: 'No autorizado.' });

        const isCodeValid = user.codigo_verificacion === code;
        const isExpired = user.codigo_expiracion && new Date() > new Date(user.codigo_expiracion);

        if (!isCodeValid || isExpired) {
            const intentos = (user.intentos_fallidos || 0) + 1;
            
            if (intentos >= MAX_INTENTOS) {
                await AuthModel.lockAccount(user.id_usuario);
                return res.status(401).json({ message: 'Cuenta bloqueada.' });
            }

            await AuthModel.updateLoginTry(user.id_usuario, intentos);
            return res.status(401).json({ message: isExpired ? 'Código expirado.' : 'Código incorrecto.' });
        }

        if (isCodeValid && !isExpired) {
            const flowToken = jwt.sign(
                { id: user.id_usuario, email: user.correo, step: 'VERIFIED_STEP' },
                process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );

            await PasswordModel.setVerificationCode(user.id_usuario, null, null);

            return res.status(200).json({ success: true, flowToken });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error interno.' });
    }
};


const updatePassword = async (req, res) => {
    const { email, password, flowToken } = req.body;

    try {
        const decodedFlow = jwt.verify(flowToken, process.env.JWT_SECRET);
        if (decodedFlow.step !== 'VERIFIED_STEP' || decodedFlow.email !== email) {
            return res.status(403).json({ message: 'Sesión de solicitud inválida.' });
        }

        const user = await PasswordModel.findUserForFirstLogin(email);
        
        if (!user) {
            return res.status(401).json({ message: 'Sesión de verificación inválida.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await PasswordModel.completeFirstLogin(user.id_usuario, hashedPassword);
        await logIfAdmin(user, 'PRIMER_LOGIN_EXITOSO');

        return res.status(200).json({ success: true, message: 'Contraseña actualizada con éxito.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al guardar la contraseña.' });
    }
};

module.exports = {
    requestOTP,
    verifyOTP, 
    updatePassword,
};