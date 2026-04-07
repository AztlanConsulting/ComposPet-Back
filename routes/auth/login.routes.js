const express = require('express');
const router = express.Router();

const authController = require('../../controllers/auth/auth.controller');
const firstLoginController = require('../../controllers/auth/password.controller');

/**
 * Rutas del módulo de autenticación.
 * Todas las rutas definidas aquí son montadas bajo el prefijo `/auth`
 * o el equivalente configurado en el archivo principal de rutas.
 *
 * @see authController.login
 */

/**
 * @route POST /login
 * @description Autentica al usuario con correo y contraseña.
 * Aplica protección contra fuerza bruta mediante bloqueo temporal por intentos fallidos.
 * @access Público
 */

router.post('/login', authController.login);

/**
 * @route POST /auth/google
 * @description Autentica al usuario mediante Google OAuth 2.0.
 * Valida el token externo, verifica el registro en ComposPet y genera sesión local.
 * @access Público
 */
router.post('/auth/google', authController.googleAuth);

router.post('/request-otp', firstLoginController.requestOTP);

router.post('/verify-otp', firstLoginController.verifyOTP);

router.post('/update-password', firstLoginController.updatePassword);

module.exports = router;