const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Genera un Access Token de vida corta para autorizar peticiones.
 * @param {Object} payload - Datos del usuario (userId, email, role).
 * @returns {string} Token firmado.
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiration,
    issuer: 'compospet-api', 
    audience: 'compospet-client', 
  });
}

/**
 * Genera un Refresh Token de vida larga para renovar sesiones.
 * @param {Object} payload - Datos del usuario.
 * @returns {string} Token firmado.
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiration,
    issuer: 'compospet-api',
    audience: 'compospet-client',
  });
}

/**
 * Verifica la validez de un Access Token.
 * @param {string} token - El JWT a verificar.
 * @returns {Object} Payload decodificado si es válido.
 * @throws {Error} Errores específicos según el estado del token.
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret, {
      issuer: 'compospet-api',
      audience: 'compospet-client',
    });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('TOKEN_INVALID');
    }
    throw new Error('TOKEN_VERIFICATION_FAILED');
  }
}

/**
 * Verifica la validez de un Refresh Token.
 * @param {string} token - El JWT de refresco a verificar.
 * @returns {Object} Payload decodificado si es válido.
 * @throws {Error} Errores específicos según el estado del token.
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret, {
      issuer: 'compospet-api',
      audience: 'compospet-client',
    });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('REFRESH_TOKEN_INVALID');
    }
    throw new Error('REFRESH_TOKEN_VERIFICATION_FAILED');
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};