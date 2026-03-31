const { httpRequestCounter, httpRequestDurationMicroseconds, httpErrorCounter } = require('../config/metrics');

/**
 * Middleware para registrar métricas de rendimiento y conteo de peticiones HTTP.
 * Se integra con Prometheus para medir latencia y volumen de tráfico por ruta.
 * La ruta /metrics queda excluida del registro para evitar contaminación de estadísticas.
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para continuar al siguiente middleware.
 * @returns {void}
 * @see {@link https://prometheus.io/docs/concepts/metric_types/ Tipos de métricas en Prometheus}
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