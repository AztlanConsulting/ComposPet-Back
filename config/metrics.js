const client = require('prom-client');

/**
 * Registro central de Prometheus donde se agrupan todas las métricas de la aplicación.
 * Se utiliza como contenedor para exportar y exponer métricas en el endpoint /metrics.
 */
const register = new client.Registry();

// Recolecta métricas automáticas (CPU, memoria, etc.) para el registro global
client.collectDefaultMetrics({ register });

/**
 * Contador de peticiones HTTP procesadas por la aplicación.
 * Segmentado por método HTTP, ruta y código de estado para análisis de tráfico.
 */
const httpRequestCounter = new client.Counter({
    name: 'compospet_http_requests_total',
    help: 'Total de peticiones procesadas por ComposPet',
    labelNames: ['method', 'route', 'status']
});

/**
 * Histograma para medir la duración de las peticiones HTTP en segundos.
 * Permite analizar la distribución de latencias por método, ruta y código de respuesta.
 */
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de las peticiones HTTP en segundos',
    labelNames: ['method', 'route', 'code'],
    // Los buckets definen los rangos de tiempo (en segundos) para el análisis de latencia
    buckets: [0.1, 0.5, 1, 2, 3, 5]
});

/**
 * Contador de reintentos realizados hacia APIs externas.
 * Permite identificar inestabilidad en servicios de terceros por URL y número de intento.
 */
const externalApiRetryCounter = new client.Counter({
    name: 'compospet_external_api_retries_total',
    help: 'Total de reintentos a APIs externas',
    labelNames: ['url', 'attempt']
});

/**
 * Contador de timeouts ocurridos en llamadas a APIs externas.
 * Útil para detectar servicios con tiempos de respuesta fuera del umbral permitido.
 */
const externalApiTimeoutCounter = new client.Counter({
    name: 'compospet_external_api_timeouts_total',
    help: 'Total de timeouts en llamadas a APIs externas',
    labelNames: ['url']
});

/**
 * Gauge que registra el timestamp Unix del último arranque del sistema.
 * Se establece al momento de inicializar este módulo mediante setToCurrentTime().
 */
const systemStartTime = new client.Gauge({
    name: 'compospet_system_start_time_seconds',
    help: 'Timestamp Unix del último arranque del sistema',
});
systemStartTime.setToCurrentTime();

/**
 * Contador de fallas o reinicios del sistema.
 * Permite monitorear la estabilidad general de la aplicación a lo largo del tiempo.
 */
const systemFailureCounter = new client.Counter({
    name: 'compospet_system_failures_total',
    help: 'Total de fallas/reinicios del sistema',
});

/**
 * Contador de errores HTTP clasificados por código de estado.
 * Permite distinguir errores de cliente (4xx) y de servidor (5xx) por ruta y método.
 */
const httpErrorCounter = new client.Counter({
    name: 'compospet_http_errors_total',
    help: 'Total de errores HTTP por código de status',
    labelNames: ['method', 'route', 'status_code'],
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(externalApiRetryCounter);
register.registerMetric(externalApiTimeoutCounter);
register.registerMetric(systemStartTime);
register.registerMetric(systemFailureCounter);
register.registerMetric(httpErrorCounter);

module.exports = {
    register,
    httpRequestCounter,
    httpRequestDurationMicroseconds,
    externalApiRetryCounter,
    externalApiTimeoutCounter,
    systemStartTime,
    systemFailureCounter,
    httpErrorCounter,
};