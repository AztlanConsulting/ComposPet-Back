const { externalApiRetryCounter, externalApiTimeoutCounter } = require('../config/metrics');

const TIMEOUT_MS = 5000;
const RETRY_DELAYS = [1000, 2000, 4000];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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