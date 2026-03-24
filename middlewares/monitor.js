const { httpRequestCounter } = require('../config/metrics');

const monitorMiddleware = (req, res, next) => {
    res.on('finish', () => {
        if (req.path !== '/metrics') {
            httpRequestCounter.inc({ 
                method: req.method, 
                route: req.path, 
                status: res.statusCode 
            });
        }
    });
    next();
};

module.exports = monitorMiddleware;