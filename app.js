const express = require('express');
const app = express();
const cors = require('cors');
const { register } = require('./config/metrics');
const monitorMiddleware = require('./middlewares/monitor');
const config = require('./config/env')
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const routes = require('./routes/general_routes.routes');

/**
 * Configuración de opciones para el middleware CORS.
 * Define el origen permitido, métodos HTTP habilitados y manejo de credenciales.
 * * @type {Object}
 * @property {string} origin - Dominio permitido (por defecto localhost:3000).
 * @property {string[]} methods - Verbos HTTP permitidos para las peticiones.
 * @property {boolean} credentials - Indica si se permite el intercambio de cookies.
 */
const corsOptions = {
    origin: config.corsOrigin || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
};

// --- Middlewares Globales ---
app.use(cookieParser());
app.use(cors(corsOptions));

/**
 * Configuración de Helmet para la seguridad de cabeceras HTTP.
 * En producción aplica políticas estrictas; en desarrollo se desactivan
 * las políticas de origen cruzado para facilitar el trabajo local.
 */
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
} else {
    app.use(helmet({
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false,
        contentSecurityPolicy: false,
    }));
}
app.use(express.json());

// Inyecta el interceptor de métricas en todas las peticiones entrantes
app.use(monitorMiddleware);

/**
 * Endpoint de exposición de métricas para Prometheus.
 * Realiza el scraping de los datos acumulados en el registro global de la aplicación.
 * * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Devuelve un buffer de texto con las métricas en formato Prometheus.
 */
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

/**
 * Middleware de auditoría básica para depuración.
 * Imprime en consola el tipo de contenido y el cuerpo de las peticiones entrantes.
 */
app.use((req, res, next) => {
    console.log("Content-Type recibido:", req.headers["content-type"]);
    console.log("Body recibido:", req.body);
    next();
});

// Definición de las rutas de negocio de la aplicación
app.use('/', routes);

/**
 * Endpoint de verificación de estado (Health Check).
 * Permite a sistemas externos o balanceadores confirmar que el servicio está activo.
 * * @param {import('express').Request} _req - Objeto de petición (no utilizado).
 * @param {import('express').Response} res - Objeto de respuesta.
 * @returns {void}
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Manejador global para rutas no encontradas (404).
 * Captura cualquier petición que no haya coincidido con los handlers anteriores.
 * * @param {import('express').Request} req - Objeto de petición para extraer la URL original.
 * @param {import('express').Response} res - Objeto de respuesta con el error formateado.
 * @returns {void}
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: `La ruta ${req.originalUrl} no existe en este servidor.`
    });
});

module.exports = app;