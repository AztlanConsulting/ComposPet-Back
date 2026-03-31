const client = require('prom-client');

const register = new client.Registry();

// Recolecta métricas automáticas (CPU, memoria, etc.) para el registro global
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
    name: 'compospet_http_requests_total',
    help: 'Total de peticiones procesadas por ComposPet',
    labelNames: ['method', 'route', 'status']
});

const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de las peticiones HTTP en segundos',
    labelNames: ['method', 'route', 'code'],
    // Los buckets definen los rangos de tiempo (en segundos) para el análisis de latencia
    buckets: [0.1, 0.5, 1, 2, 3, 5] 
});

const externalApiRetryCounter = new client.Counter({
    name: 'compospet_external_api_retries_total',
    help: 'Total de reintentos a APIs externas',
    labelNames: ['url', 'attempt'],
    registers: [register],
});

const externalApiTimeoutCounter = new client.Counter({
    name: 'compospet_external_api_timeouts_total',
    help: 'Total de timeouts en llamadas a APIs externas',
    labelNames: ['url'],
    registers: [register],
});

const systemStartTime = new client.Gauge({
    name: 'compospet_system_start_time_seconds',
    help: 'Timestamp Unix del último arranque del sistema',
    registers: [register],
});
systemStartTime.setToCurrentTime();

const systemFailureCounter = new client.Counter({
    name: 'compospet_system_failures_total',
    help: 'Total de fallas/reinicios del sistema',
    registers: [register],
});

const httpErrorCounter = new client.Counter({
    name: 'compospet_http_errors_total',
    help: 'Total de errores HTTP por código de status',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(externalApiRetryCounter );
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