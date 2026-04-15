3/**
 * Representa la entidad de Usuario completa.
 */
class User {
  /**
   * @param {Object} params - Propiedades del usuario.
   * @param {number|string} params.id - Identificador único del usuario.
   * @param {string} params.email - Correo electrónico institucional o personal.
   * @param {string} params.passwordHash - Contraseña cifrada (Bcrypt).
   * @param {string} [params.role='user'] - Rol asignado ('admin' | 'user' | 'editor').
   * @param {Date} [params.createdAt] - Fecha de creación del registro.
   * @param {Date} [params.updatedAt] - Fecha de la última actualización.
   */
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
  /**
   * @param {Object} params - Datos a codificar en el token.
   * @param {number|string} params.userId - ID del usuario propietario del token.
   * @param {string} params.email - Correo electrónico del usuario.
   * @param {string} params.role - Rol del usuario para validación de permisos.
   */
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
  /**
   * @param {string} accessToken - Token de corta duración para acceso a recursos.
   * @param {string} refreshToken - Token de larga duración para renovación de sesiones.
   */
  constructor(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

/**
 * Datos requeridos para el registro de nuevos usuarios.
 */
class RegisterInput {
  /**
   * @param {Object} params - Datos de registro.
   * @param {string} params.email - Correo electrónico proporcionado por el usuario.
   * @param {string} params.password - Contraseña en texto plano antes de ser procesada.
   * @param {string} [params.role='user'] - Rol inicial solicitado.
   */
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
  /**
   * @param {Object} params - Credenciales de acceso.
   * @param {string} params.email - Correo electrónico del usuario.
   * @param {string} params.password - Contraseña enviada para verificación.
   */
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
}

/**
 * Registro de persistencia para tokens de refresco en la base de datos.
 */
class RefreshTokenRecord {
  /**
   * @param {Object} params - Datos del registro de persistencia.
   * @param {number|string} params.id - ID único del registro del token.
   * @param {string} params.token - El string del Refresh Token almacenado.
   * @param {number|string} params.userId - Referencia al usuario dueño del token.
   * @param {Date} params.expiresAt - Fecha de expiración del token.
   * @param {Date} [params.createdAt] - Fecha de emisión.
   * @param {boolean} [params.revoked=false] - Indica si el token ha sido invalidado manualmente.
   */
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