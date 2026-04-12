const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../../config/env');
const jwtUtils = require('../../utils/jwt.utils');
const { User, RefreshTokenRecord, AuthTokens } = require('./auth.classes');

// Simulación de base de datos (en memoria)
/** @type {User[]} */
const users = [];
/** @type {RefreshTokenRecord[]} */
const refreshTokens = [];

/**
 * Registra un nuevo usuario en el sistema.
 * @param {Object} input - Datos de registro (RegisterInput).
 */
async function registerUser(input) {
  // Verificar si el email ya existe
  const existingUser = users.find((u) => u.email === input.email);
  if (existingUser) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  // Validar fortaleza de la contraseña
  if (input.password.length < 8) {
    throw new Error('PASSWORD_TOO_SHORT');
  }

  // Hash de la contraseña con bcrypt
  const passwordHash = await bcrypt.hash(input.password, config.bcryptSaltRounds);

  // Crear usuario usando nuestra clase
  const newUser = new User({
    id: crypto.randomUUID(),
    email: input.email.toLowerCase().trim(),
    passwordHash,
    role: input.role || 'user'
  });

  users.push(newUser);

  // Preparar payload para los tokens
  const tokenPayload = {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  };

  const tokens = createTokenPair(tokenPayload);

  // Guardar refresh token
  storeRefreshToken(tokens.refreshToken, newUser.id);

  // Retornar usuario sin la contraseña sensible
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return { user: userWithoutPassword, tokens };
}

/**
 * Autentica un usuario existente.
 * @param {Object} input - Datos de login (LoginInput).
 */
async function loginUser(input) {
  const user = users.find((u) => u.email === input.email.toLowerCase().trim());
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const tokens = createTokenPair(tokenPayload);
  storeRefreshToken(tokens.refreshToken, user.id);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, tokens };
}

/**
 * Renueva el Access Token usando un Refresh Token válido.
 * @param {string} currentRefreshToken 
 */
async function refreshAccessToken(currentRefreshToken) {
  const payload = jwtUtils.verifyRefreshToken(currentRefreshToken);

  const storedToken = refreshTokens.find(
    (rt) => rt.token === currentRefreshToken && !rt.revoked
  );

  if (!storedToken) {
    // Seguridad: Si el token no existe o fue revocado, invalidamos todo por sospecha de robo
    revokeAllUserTokens(payload.userId);
    throw new Error('REFRESH_TOKEN_REVOKED');
  }

  // Rotación de tokens: el viejo se marca como usado
  storedToken.revoked = true;

  const newTokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  const newTokens = createTokenPair(newTokenPayload);
  storeRefreshToken(newTokens.refreshToken, payload.userId);

  return newTokens;
}

/**
 * Cierra la sesión invalidando el refresh token.
 * @param {string} refreshToken 
 */
function logoutUser(refreshToken) {
  const storedToken = refreshTokens.find((rt) => rt.token === refreshToken);
  if (storedToken) {
    storedToken.revoked = true;
  }
}

// --- Funciones auxiliares internas ---

function createTokenPair(payload) {
  return new AuthTokens(
    jwtUtils.generateAccessToken(payload),
    jwtUtils.generateRefreshToken(payload)
  );
}

function storeRefreshToken(token, userId) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7); // 7 días

  refreshTokens.push(new RefreshTokenRecord({
    id: crypto.randomUUID(),
    token,
    userId,
    expiresAt: expirationDate
  }));
}

function revokeAllUserTokens(userId) {
  refreshTokens
    .filter((rt) => rt.userId === userId)
    .forEach((rt) => { rt.revoked = true; });
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser
};