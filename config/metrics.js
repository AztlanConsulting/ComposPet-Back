const client = require('prom-client');

const register = new client.Registry();
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
  buckets: [0.1, 0.5, 1, 2, 3, 5] // El '3' es clave para tu requisito de 3s
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);

module.exports = { register, httpRequestCounter, httpRequestDurationMicroseconds };