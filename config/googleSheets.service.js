const { google } = require('googleapis');
const { callExternalApi } = require('../middlewares/externalApiClient');

/**
 * Servicio base para interactuar con Google Sheets.
 *
 * Proporciona métodos reutilizables para autenticación,
 * escritura, limpieza y formato de hojas de cálculo.
 *
 * @namespace GoogleSheetsService
 */
const GoogleSheetsService = {

    /**
     * Crea un cliente autenticado de Google Sheets.
     *
     * @param {string} googleToken - Token OAuth2 del usuario autenticado.
     * @returns {import('googleapis').sheets_v4.Sheets}
     */
    createSheetsClient: (googleToken) => {

        // Inicializa el cliente OAuth2.
        const auth = new google.auth.OAuth2();

        // Configura el token de acceso.
        auth.setCredentials({
            access_token: googleToken,
        });

        // Retorna el cliente autenticado de Sheets.
        return google.sheets({
            version: 'v4',
            auth,
        });
    },

    createSheetsClientServiceAccount: () => {
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
        );
        auth.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });
        // Con refresh_token, Google renueva el access_token automáticamente
        return google.sheets({ version: 'v4', auth });
    },

    /**
     * Limpia un rango específico de una hoja.
     *
     * @async
     * @param {Object} params
     * @param {Object} params.sheets - Cliente autenticado de Sheets
     * @param {string} params.spreadsheetId - Id del archivo de google Sheets que quieras usar
     * @param {string} params.range - Rango a limpiar.
     */
    clearRange: async ({
        sheets,
        spreadsheetId,
        range,
    }) => {

        await callExternalApi(
            () => sheets.spreadsheets.values.clear({
                spreadsheetId,
                range,
            }),
            'google-sheets-clear-range'
        );
    },

    /**
     * Inserta información en una hoja de cálculo.
     *
     * @async
     * @param {Object} params
     * @param {Object} params.sheets - Cliente autenticado de Sheets.
     * @param {string} params.spreadsheetId - Id del archivo.
     * @param {string} params.range - Rango inicial.
     * @param {Array<Array<string>>} params.values - Datos a insertar.
     */
    appendValues: async ({
        sheets,
        spreadsheetId,
        range,
        values,
    }) => {

        await callExternalApi(
            () => sheets.spreadsheets.values.append({
                spreadsheetId,
                range,

                //User entered es para que respete formatos como fechas, o formulas .
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values,
                },
            }),
            'google-sheets-append-values'
        );
    },

    /**
     * Aplica formato a una hoja de cálculo.
     *
     * @async
     * @param {Object} params
     * @param {Object} params.sheets - Cliente autenticado de Sheets.
     * @param {string} params.spreadsheetId - Id del archivo de google Sheets que quieras usar.
     * @param {Array<Object>} params.requests - Lista de instrucciones para darle formato.
     */
    formatSheet: async ({
        sheets,
        spreadsheetId,
        requests,
    }) => {

        await callExternalApi(
            () => sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests,
                },
            }),
            'google-sheets-format-sheet'
        );
    },

    /**
     * Construye la URL pública del archivo.
     *
     * @param {string} spreadsheetId - Id del archivo.
     * @returns {string} - URL del archivo que esditaste
     */
    getSheetUrl: (spreadsheetId) => {
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    },
};

module.exports = GoogleSheetsService;