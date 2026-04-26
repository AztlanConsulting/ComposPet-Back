const AuthModel = require('../../models/auth/auth.model');
const PasswordModel = require('../../models/auth/password.model');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcrypt');
const crypto = require('crypto');
const GmailService = require('../../config/gmail.service');
const { logIfAdmin } = require('../../utils/logIfAdmin');

const MAX_ATTEMPTS = 5;

/**
 * Fase 1: Solicitud de código de verificación (OTP).
 * * Valida la existencia del usuario y realiza una validación cruzada entre el flujo
 * solicitado (activación o recuperación) y el estado real en la base de datos.
 * Genera un OTP, lo almacena y emite un 'seedToken' que encapsula el flujo permitido.
 * * @async
 * @function requestOTP
 * @param {import('express').Request} req - Body: { email, isFirstLogin }
 * @param {import('express').Response} res - Retorna seedToken para la Fase 2.
 */
const requestOTP = async (req, res) => {
    const { email, isFirstLogin: requestedFirstLogin } = req.body;

    try {

        const user = await AuthModel.findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ 
                message: 'El correo proporcionado no está registrado.' 
            });
        }

        const actuallyIsFirstLogin = user.primer_inicio_sesion;

        if (!requestedFirstLogin && actuallyIsFirstLogin) {
            return res.status(400).json({ 
                message: 'Tu cuenta aún no ha sido activada.' 
            });
        }

        if (requestedFirstLogin && !actuallyIsFirstLogin) {
            return res.status(400).json({ 
                message: 'Esta cuenta ya se encuentra activa.' 
            });
        }


        const code = crypto.randomInt(100000, 999999).toString();

        const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        await PasswordModel.setVerificationCode(user.id_usuario, code, expires);

        const step = actuallyIsFirstLogin ? 'CAN_VERIFY_FIRST_LOGIN' : 'CAN_VERIFY_RECOVERY';
        const seedToken = jwt.sign(
            { email: user.correo, step },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const subject = actuallyIsFirstLogin ? 'Activa tu cuenta de Compospet' : 'Recupera tu contraseña';

        const emailOptions = actuallyIsFirstLogin 
            ? {
                title: '¡Bienvenido!',
                message: 'Gracias por registrarte en <strong>Compospet</strong>. Para activar tu cuenta, por favor ingresa el siguiente código de verificación:'
              }
            : {
                title: 'Recuperar Contraseña',
                message: 'Has solicitado restablecer tu acceso a <strong>Compospet</strong>. Utiliza el siguiente código para continuar con el proceso:'
              };

        await GmailService.sendStaticEmail(email, subject, code, emailOptions);
        const actionLog = actuallyIsFirstLogin ? 'SOLICITUD_OTP_PRIMER_LOGIN' : 'SOLICITUD_OTP_RECOVERY';
        await logIfAdmin(user, actionLog, `Correo: ${email}`);

        return res.status(200).json({ 
            success: true, 
            seedToken,
        });

    } catch (error) {
        console.error('Error en requestFirstLoginOTP:', error);
        return res.status(500).json({ message: 'Error del servidor, inténtalo más tarde.' });
    }
};

/**
 * Fase 2: Verificación del OTP proporcionado.
 * * Valida el código contra la base de datos y la integridad del 'seedToken'.
 * Gestiona el sistema de intentos fallidos y bloqueo de cuenta.
 * Si es exitoso, emite un 'flowToken' que autoriza el cambio final de contraseña.
 * * @async
 * @function verifyOTP
 * @param {import('express').Request} req - Body: { email, code, seedToken }
 * @param {import('express').Response} res - Retorna flowToken para la Fase 3.
 */
const verifyOTP = async (req, res) => {
    const { email, code, seedToken } = req.body;

    try {
        const decodedSeed = jwt.verify(seedToken, process.env.JWT_SECRET);
        const allowedSteps = ['CAN_VERIFY_FIRST_LOGIN', 'CAN_VERIFY_RECOVERY'];
        if (!allowedSteps.includes(decodedSeed.step) || decodedSeed.email !== email) {
            return res.status(401).json({ message: 'Sesión de solicitud inválida.' });
        }

        const isFirstLogin = decodedSeed.step === 'CAN_VERIFY_FIRST_LOGIN';

        const user = await PasswordModel.findUserByStatus(email, isFirstLogin);
        if (!user) return res.status(401).json({ message: 'No autorizado.' });

        const isCodeValid = user.codigo_verificacion === code;
        const isExpired = user.codigo_expiracion && new Date() > new Date(user.codigo_expiracion);

        if (!isCodeValid || isExpired) {
            const attempts = (user.intentos_fallidos || 0) + 1;
            
            if (attempts >= MAX_ATTEMPTS) {
                await AuthModel.lockAccount(user.id_usuario);
                await PasswordModel.setVerificationCode(user.id_usuario, null, null);
                return res.status(401).json({ message: 'Cuenta bloqueada.' });
            }

            await AuthModel.updateLoginTry(user.id_usuario, attempts);
            return res.status(401).json({ message: isExpired ? 'Código expirado.' : 'Código incorrecto.' });
        }

        if (isCodeValid && !isExpired) {
            const flowToken = jwt.sign(
                { 
                    id: user.id_usuario, 
                    email: user.correo, 
                    step: 'VERIFIED_STEP', 
                    isFirstLogin,
                },
                process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );

            await PasswordModel.setVerificationCode(user.id_usuario, null, null);

            return res.status(200).json({ success: true, flowToken });
        }
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Sesión de solicitud inválida.' });
        }
        return res.status(500).json({ message: 'Error interno.' });
    }
};

/**
 * Fase 3: Actualización de contraseña.
 * * Consume el 'flowToken' para validar que el usuario completó la verificación OTP.
 * Hashea la nueva contraseña y actualiza el registro del usuario.
 * Si es primer inicio, marca la cuenta como activa (`primer_inicio_sesion: false`).
 * * @async
 * @function updatePassword
 * @param {import('express').Request} req - Body: { email, password, flowToken }
 * @param {import('express').Response} res - Retorna confirmación de éxito.
 */
const updatePassword = async (req, res) => {
    const { email, password, flowToken } = req.body;

    try {
        const decodedFlow = jwt.verify(flowToken, process.env.JWT_SECRET);
        if (decodedFlow.step !== 'VERIFIED_STEP' || decodedFlow.email !== email) {
            return res.status(403).json({ message: 'Sesión de solicitud inválida.' });
        }

        const isFirstLogin = decodedFlow.isFirstLogin;
        const user = await PasswordModel.findUserByStatus(email, isFirstLogin);
        
        if (!user) {
            return res.status(401).json({ message: 'Sesión de verificación inválida.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (isFirstLogin) {
            await PasswordModel.completeFirstLogin(user.id_usuario, hashedPassword);
            await logIfAdmin(user, 'PRIMER_LOGIN_EXITOSO');
        } else {
            await PasswordModel.updateOnlyPassword(user.id_usuario, hashedPassword);
            await logIfAdmin(user, 'RECUPERACION_PASSWORD_EXITOSA');
        }

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