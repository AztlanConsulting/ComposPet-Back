const GoogleSheetsService = require('./googleSheets.service');

/**
 * Servicio encargado de generar los mensajes
 * de confirmación para rutas.
 *
 * @namespace GoogleSheetsMessagesService
 * @see GoogleSheetsService
 */
const GoogleSheetsMessagesService = {

    /**
     * Envía mensajes de confirmación a Google Sheets.
     *
     * @async
     * @param {string} googleToken
     * @param {string} title - Título que identifica la semana y día de ruta.
     * @param {Array<Array<string>>} messages - Lista de mensajes y nombres completos a enviar.
     * @returns {Promise<string>} URL del archivo de Google Sheets con los mensajes generados.
     * @throws {Error} Lanza un error si falla la autenticación, escritura, limpieza o formato de la hoja.
     */
    sendRouteMessages: async (
        googleToken,
        title,
        messages
    ) => {

        // Obtiene el cliente autenticado.
        const sheets =
            GoogleSheetsService.createSheetsClient(
                googleToken
            );

        // Obtiene el id del archivo que se quiera editar desde las variables de entorno
        const spreadsheetId =
            process.env.GOOGLE_SHEET_ROUTE_MESSAGES_ID;

        // Limpia la hoja.
        await GoogleSheetsService.clearRange({
            sheets,
            spreadsheetId,
            range: 'Mensajes!A1:B',
        });

        // Inserta titulo y mensajes.
        await GoogleSheetsService.appendValues({
            sheets,
            spreadsheetId,
            range: 'Mensajes!A1',
            values: [
                [title, "Nombre Completo"],
                ...messages,
            ],
        });

        // Aplica formato.
        await GoogleSheetsService.formatSheet({
            sheets,
            spreadsheetId,
            requests: [
                {
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 0,
                            endRowIndex: messages.length + 1,
                            startColumnIndex: 0,
                            endColumnIndex: 2,
                        },
                        cell: {
                            userEnteredFormat: {
                                horizontalAlignment: "CENTER",
                                verticalAlignment: "MIDDLE",
                                wrapStrategy: "WRAP",
                            },
                        },
                        fields:
                            "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy)"
                    }
                },
                {
                    updateDimensionProperties: {
                        range: {
                            sheetId: 0,
                            dimension: "COLUMNS",
                            startIndex: 0,
                            endIndex: 1,
                        },
                        properties: {
                            pixelSize: 550,
                        },
                        fields: "pixelSize",
                    },
                }
            ]
        });

        // Retorna URL del archivo.
        return GoogleSheetsService.getSheetUrl(
            spreadsheetId
        );
    },
};

module.exports = GoogleSheetsMessagesService;