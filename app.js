const express = require('express');
const app = express();
const cors = require('cors');
const { register } = require('./config/metrics');
const monitorMiddleware = require('./middlewares/monitor');
const config = require('./config/env')
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const routes = require('./routes/general_routes.routes');

const corsOptions = {
    origin: config.corsOrigin || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
};

// Middlewares globales de configuración y seguridad
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

// Inyecta el interceptor de métricas en todas las peticiones entrantes
app.use(monitorMiddleware);

/**
 * Endpoint expuesto para que el servidor de Prometheus haga "scraping" (recolección)
 * de las métricas acumuladas en el registro global.
 */
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.use((req, res, next) => {
    console.log("Content-Type recibido:", req.headers["content-type"]);
    console.log("Body recibido:", req.body);
    next();
});

// Definición de las rutas de negocio de la aplicación
app.use('/', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: `La ruta ${req.originalUrl} no existe en este servidor.`
    });
});

module.exports = app;