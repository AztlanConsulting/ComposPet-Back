const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
    name: 'compopet_http_requests_total',
    help: 'Total de peticiones procesadas por CompoPet',
    labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestCounter);

module.exports = { register, httpRequestCounter };