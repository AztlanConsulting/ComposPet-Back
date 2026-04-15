// src/config/env.js (Versión JavaScript)
const dotenv = require('dotenv');

dotenv.config();

/**
 * Configuración global del sistema Compospet.
 * Centraliza las variables de entorno para un acceso seguro y tipado en toda la aplicación.
 * @typedef {Object} Config
 * @property {number} port - Puerto en el que se ejecuta el servidor.
 * @property {string} jwtAccessSecret - Secreto para la firma de tokens de acceso (JWT).
 * @property {string} jwtRefreshSecret - Secreto para la firma de tokens de refresco (JWT).
 * @property {string} jwtAccessExpiration - Tiempo de vida del token de acceso (ej. '15m').
 * @property {string} jwtRefreshExpiration - Tiempo de vida del token de refresco (ej. '7d').
 * @property {number} bcryptSaltRounds - Número de rondas de hashing para Bcrypt.
 * @property {string} nodeEnv - Entorno de ejecución actual (development, production, test).
 * @property {string} corsOrigin - Origen permitido para las peticiones CORS.
 */
const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

/**
 * Validación de variables críticas.
 * Verifica que los secretos de JWT estén definidos para evitar vulnerabilidades de seguridad.
 * * @throws {Error} Lanza un error fatal y detiene el proceso si faltan los secretos.
 */
if (!config.jwtAccessSecret || !config.jwtRefreshSecret) {
  console.error('FATAL: JWT secrets no configurados. Revisa tu archivo .env');
  process.exit(1);
}

module.exports = config;