/**
 * Middleware de autorización basado en roles.
 * Restringe el acceso a recursos específicos según el rol inyectado en `req.user`.
 * * @param {...string} allowedRoles - Lista de roles permitidos
 * @returns {function(import('express').Request, import('express').Response, import('express').NextFunction): void} 
 * Middleware configurado para los roles especificados.
 * * @example
 * router.get('/admin-panel', requireRole('admin'), adminController);
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            error: 'FORBIDDEN',
            message: 'No tienes permisos para acceder a este recurso',
        });
        }

        next();
    };
};

module.exports = {
    requireRole,
};