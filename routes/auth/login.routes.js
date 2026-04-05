const express = require('express');
const router = express.Router();

const authController = require('../../controllers/auth/auth.controller');

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

router.post('/auth/google', authController.googleAuth);

module.exports = router;