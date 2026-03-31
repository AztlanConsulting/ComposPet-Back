const { httpRequestCounter, httpRequestDurationMicroseconds } = require('../config/metrics');

/**
 * Middleware para registrar métricas de rendimiento y conteo de peticiones.
 * Se integra con Prometheus para medir latencia y volumen de tráfico.
 */
const monitorMiddleware = (req, res, next) => {
    // Inicia el cronómetro para medir cuánto tarda en resolverse la petición
    const end = httpRequestDurationMicroseconds.startTimer();

    // El evento 'finish' se dispara cuando la respuesta ya se envió al cliente
    res.on('finish', () => {
        // Evitamos registrar la propia ruta de métricas para no "ensuciar" las estadísticas
        if (req.path !== '/metrics') {
            const labels = { 
                method: req.method, 
                route: req.path, 
                status: res.statusCode 
            };

            // Incrementa el contador global y detiene el cronómetro del histograma
            httpRequestCounter.inc(labels);
            end({ code: res.statusCode });

            // Conteo explícito de errores 5xx
            if (res.statusCode >= 500) {
                httpErrorCounter.inc({
                    method: req.method,
                    route: req.path,
                    status_code: res.statusCode,
                });
            }
        }
    });

    next();
};

module.exports = monitorMiddleware;