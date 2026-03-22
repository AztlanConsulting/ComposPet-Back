const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('x-auth-token'); 

    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    }

    try {
        const decoded = jwt.verify(token, 'TU_PALABRA_SECRETA_SUPER_SEGURA');
        req.user = decoded; 
        next(); 
    } catch (error) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};