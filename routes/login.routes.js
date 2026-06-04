const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/auth/auth.controller');
const passwordController = require('../controllers/auth/password.controller');
const { requireRole } = require('../middlewares/roleAccess');
const { authMiddleware } = require('../middlewares/auth');

console.log('NODE_ENV al cargar rutas:', process.env.NODE_ENV);

const requestOtpLimiter = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { message: 'Demasiados intentos, espera un momento.' }
    });

const verifyOtpLimiter = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { message: 'Demasiados intentos, espera un momento.' }
    });

const updatePasswordLimiter = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { message: 'Demasiados intentos, espera un momento.' }
    });
/**
 * Rutas del módulo de autenticación.xº
 * Todas las rutas definidas aquí son montadas bajo el prefijo `/auth`
 * o el equivalente configurado en el archivo principal de rutas.
 *
 * @see authController.login
 */

/**
 * @route POST /inicio-sesion
 * @description Autentica al usuario con correo y contraseña.
 * Aplica protección contra fuerza bruta mediante bloqueo temporal por intentos fallidos.
 * @access Público
 */

router.post('/inicio-sesion', authController.login);

/**
 * @route POST /auth/google
 * @description Autentica al usuario mediante Google OAuth 2.0.
 * Valida el token externo, verifica el registro en ComposPet y genera sesión local.
 * @access Público
 */
router.post('/auth/google', authController.googleAuth);

/**
 * @route POST /api/auth/request-otp
 * @description Valida el correo y dispara el envío del código vía GmailService.
 * @returns {Object} 200 - seedToken (JWT temporal) para el siguiente paso.
 */
router.post('/request-otp', requestOtpLimiter, passwordController.requestOTP);

/**
 * @route POST /api/auth/verify-otp
 * @description Compara el OTP ingresado con el de la BD y valida expiración.
 * @returns {Object} 200 - flowToken para permitir el cambio de contraseña.
 */
router.post('/verify-otp', verifyOtpLimiter, passwordController.verifyOTP);

/**
 * @route POST /api/auth/update-password
 * @description Paso final: Hashea la nueva contraseña y activa formalmente la cuenta.
 * @returns {Object} 200 - Confirmación de actualización exitosa.
 */
router.post('/update-password',updatePasswordLimiter, passwordController.updatePassword);

/**
 * @route POST /refresh
 * @description Renueva el Access Token de la aplicación utilizando un Refresh Token válido.
 * Implementa rotación de tokens para mejorar la seguridad de la sesión.
 * @access Público (Requiere cookie refreshToken)
 * @see authController.refreshToken
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /cerrar-sesion
 * @description Elimina el refresh token de las cookies y base de datos. 
 * @access Privado (Requiere cookie refreshToken)
 * @see authController.logout
 */
router.post('/cerrar-sesion', authMiddleware, requireRole("Administrador", "Cliente"), authController.logout);

module.exports = router;