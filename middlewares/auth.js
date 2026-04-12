const { verifyAccessToken } = require('../utils/jwt.utils');

/**
 * Middleware para autenticar usuarios mediante Bearer Token.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Validamos que el header exista y tenga el formato correcto
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Token de autenticación requerido',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Formato de token inválido',
    });
  }

  // 2. Verificamos el token
  try {
    const payload = verifyAccessToken(token);
    
    // Inyectamos el usuario en la petición para usarlo en controladores o siguientes middlewares
    req.user = payload; 
    next();
  } catch (error) {
    // 3. Manejo específico de errores para mejorar la experiencia de usuario (UX)
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'El token ha expirado. Usa tu refresh token para obtener uno nuevo.',
      });
    }

    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token inválido o manipulado',
    });
  }
}

/**
 * Middleware de autorización por roles.
 * @param {...string} allowedRoles - Lista de roles permitidos (ej: 'admin', 'user').
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Verificamos si authMiddleware ya autenticó al usuario
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Autenticación requerida',
      });
    }

    // Verificamos si el rol del usuario está en la lista permitida
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'No tienes permisos para acceder a este recurso',
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
};