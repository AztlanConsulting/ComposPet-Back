const { externalApiRetryCounter, externalApiTimeoutCounter } = require('../config/metrics');

/** Tiempo máximo de espera en milisegundos antes de considerar una llamada como timeout. */
const TIMEOUT_MS = 5000;

/** Tiempos de espera entre reintentos en milisegundos, aplicados de forma progresiva (backoff). */
const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * Pausa la ejecución durante un tiempo determinado.
 *
 * @param {number} ms - Cantidad de milisegundos a esperar.
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ejecuta una llamada a una API externa con soporte de reintentos automáticos y timeout.
 * Aplica una estrategia de backoff incremental entre intentos fallidos.
 * Solo reintenta ante errores de timeout o respuestas con código 5xx.
 * Cualquier otro tipo de error se propaga de inmediato sin reintentar.
 * Registra métricas de reintentos y timeouts en Prometheus.
 *
 * @param {() => Promise<any>} apiFn - Función asíncrona que realiza la llamada a la API externa.
 * @param {string} [label='unknown'] - Identificador de la URL o servicio externo, usado para etiquetar las métricas.
 * @returns {Promise<any>} Resultado de la llamada exitosa a la API.
 * @throws {Error} Lanza el último error registrado si se agotan todos los reintentos disponibles.
 * @throws {Error} Lanza inmediatamente si el error no es timeout ni un código 5xx.
 * @see {@link RETRY_DELAYS} para la configuración de los intervalos de reintento.
 */
async function callExternalApi(apiFn, label = 'unknown') {
    let lastError;

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        try {
            const result = await Promise.race([
                apiFn(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
                ),
            ]);
            return result;

        } catch (error) {
            lastError = error;

            const isTimeout = error.message === 'TIMEOUT';

            const statusCode = error.response?.status || error.code;
            const is5xx = typeof statusCode === 'number' && statusCode >= 500;

            if (isTimeout) {
                externalApiTimeoutCounter.inc({ url: label });
            }

            // Si no es timeout ni error de servidor, no tiene sentido reintentar
            if (!isTimeout && !is5xx) throw error;

            if (attempt < RETRY_DELAYS.length) {
                externalApiRetryCounter.inc({ url: label, attempt: attempt + 1 });
                await sleep(RETRY_DELAYS[attempt]);
            }
        }
    }

    throw lastError;
}

module.exports = { callExternalApi };