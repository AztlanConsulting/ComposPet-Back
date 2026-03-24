const { httpRequestCounter, httpRequestDurationMicroseconds } = require('../config/metrics');

const monitorMiddleware = (req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        if (req.path !== '/metrics') {
            const labels = { method: req.method, route: req.path, status: res.statusCode };
            httpRequestCounter.inc(labels);
            end({ code: res.statusCode });
        }
    });
    next();
};

module.exports = monitorMiddleware;