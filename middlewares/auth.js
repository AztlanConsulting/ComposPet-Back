const jwt = require('jsonwebtoken');

/**
 * Middleware para validar el JWT del servidor en el header Authorization.
 * Extrae el token, lo verifica y añade los datos del usuario al objeto request.
 * * @param {Object} req - Objeto de petición de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para continuar al siguiente middleware.
 * @throws {401} Si el header Authorization no existe o el token es "malformed".
 */
module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: 'Formato de token no válido (usa Bearer)' });
    }

    try {
        // Verifica la autenticidad del token y extrae el payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Adjuntamos el payload decodificado (ej. user id, email) para uso en rutas posteriores
        req.user = decoded; 
        // Token limpio
        req.token = token;
        next(); 
    } catch (error) {
        console.error("4. Error al verificar:", error.message);
        res.status(401).json({ msg: 'Token no es válido' });
    }
};