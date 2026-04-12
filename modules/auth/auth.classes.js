3/**
 * Representa la entidad de Usuario completa.
 */
class User {
  constructor({ id, email, passwordHash, role = 'user', createdAt, updatedAt }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role; // 'admin' | 'user' | 'editor'
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}

/**
 * Estructura de los datos dentro de un JWT.
 */
class TokenPayload {
  constructor({ userId, email, role }) {
    this.userId = userId;
    this.email = email;
    this.role = role;
  }
}

/**
 * Par de tokens para la respuesta al cliente.
 */
class AuthTokens {
  constructor(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

/**
 * Datos requeridos para el registro de nuevos usuarios.
 */
class RegisterInput {
  constructor({ email, password, role = 'user' }) {
    this.email = email;
    this.password = password;
    this.role = role;
  }
}

/**
 * Datos requeridos para el inicio de sesión.
 */
class LoginInput {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
}

/**
 * Registro de persistencia para tokens de refresco en la base de datos.
 */
class RefreshTokenRecord {
  constructor({ id, token, userId, expiresAt, createdAt, revoked = false }) {
    this.id = id;
    this.token = token;
    this.userId = userId;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt || new Date();
    this.revoked = revoked;
  }
}

module.exports = {
  User,
  TokenPayload,
  AuthTokens,
  RegisterInput,
  LoginInput,
  RefreshTokenRecord
};