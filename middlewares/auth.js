const jwt = require('jsonwebtoken');

/**
 * Middleware para validar el JWT en las cabeceras de la petición.
 * Si es válido, inyecta los datos del usuario en el objeto 'req'.
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