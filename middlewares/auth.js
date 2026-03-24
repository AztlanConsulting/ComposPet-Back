const jwt = require('jsonwebtoken');

/**
 * Middleware para validar el JWT en las cabeceras de la petición.
 * Si es válido, inyecta los datos del usuario en el objeto 'req'.
 */
module.exports = (req, res, next) => {
    const token = req.header('x-auth-token'); 

    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    }

    try {
        // Verifica la autenticidad del token y extrae el payload
        const decoded = jwt.verify(token, 'TU_PALABRA_SECRETA_SUPER_SEGURA');
        
        // Adjuntamos el payload decodificado (ej. user id, email) para uso en rutas posteriores
        req.user = decoded; 
        
        next(); 
    } catch (error) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};