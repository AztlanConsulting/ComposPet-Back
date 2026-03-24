const client = require('prom-client');

const register = new client.Registry();

// Recolecta métricas automáticas (CPU, memoria, etc.) para el registro global
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
    name: 'compopet_http_requests_total',
    help: 'Total de peticiones procesadas por CompoPet',
    labelNames: ['method', 'route', 'status']
});

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'code'],
  // Los buckets definen los rangos de tiempo (en segundos) para el análisis de latencia
  buckets: [0.1, 0.5, 1, 2, 3, 5] 
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);

module.exports = { 
    register, 
    httpRequestCounter, 
    httpRequestDurationMicroseconds 
};