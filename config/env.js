// src/config/env.js (Versión JavaScript)
const dotenv = require('dotenv');

dotenv.config();

/**
 * Configuración global del sistema Compospet.
 * Centraliza las variables de entorno para un acceso seguro.
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

if (!config.jwtAccessSecret || !config.jwtRefreshSecret) {
  console.error('FATAL: JWT secrets no configurados. Revisa tu archivo .env');
  process.exit(1);
}

module.exports = config;