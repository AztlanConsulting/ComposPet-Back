const GoogleSheetsService = require('./googleSheets.service');

/** Encabezados de la hoja de cálculo exportada, en el orden exacto de las columnas A–J. */
const HEADERS = [
    "Nombre cliente", 
    "Día de ruta",
    "#cubetas\nRECOLECTAR", 
    "#cubetas\nENTREGAR", 
    "Productos extra",
    "Horario", 
    "Forma de pago", 
    "Total a pagar", 
    "Total pagado",
    "Notas de recolección",
];

/**
 * Servicio para la exportación de información de rutas a Google Sheets.
 * Utiliza `GoogleSheetsService` como capa de acceso a la API de Google Sheets
 * y escribe en la hoja identificada por la variable de entorno
 * `GOOGLE_SHEET_ROUTE_EXPORT_INFO`.
 *
 * @namespace GoogleSheetsRoutesService
 * @see GoogleSheetsService
 */
const GoogleSheetsRoutesService = {

    /**
     * Exporta la información de rutas del día a la hoja `Ruta` de la hoja de cálculo configurada.
     * El proceso sigue este orden:
     * 1. Limpia el rango `Ruta!A1:J` para eliminar datos de exportaciones anteriores.
     * 2. Escribe los encabezados seguidos de los datos de cada cliente.
     * 3. Aplica formato a la fila de encabezados (fondo negro, texto blanco y negrita)
     *    y a las filas de datos (alineación centrada y ajuste de texto).
     * 4. Congela la primera fila para facilitar la navegación en la hoja.
     *
     * El ID de la hoja de cálculo se obtiene de la variable de entorno
     * `GOOGLE_SHEET_ROUTE_EXPORT_INFO`.
     *
     * @param {Array<Object>} routeInfo - Arreglo de clientes con su información de ruta formateada,
     * con la misma estructura retornada por `Route.getRoutesInfo`.
     * @returns {Promise<string>} URL de la hoja de cálculo actualizada.
     * @throws {Error} Si falla la autenticación, la escritura o el formateo en Google Sheets.
     * @see GoogleSheetsService.clearRange
     * @see GoogleSheetsService.appendValues
     * @see GoogleSheetsService.formatSheet
     * @see GoogleSheetsService.getSheetUrl
     */
    exportDailyRoutes: async (routeInfo) => {
        const sheets = GoogleSheetsService.createSheetsClientServiceAccount();

        const spreadsheetId =
            process.env.GOOGLE_SHEET_ROUTE_EXPORT_INFO;

        const values = routeInfo.map((routeInfo) => [
            routeInfo.nombre,
            routeInfo.dia_ruta,
            routeInfo.recoleccion,
            routeInfo.entrega,
            routeInfo.productos_extra,
            routeInfo.horario,
            routeInfo.forma_pago,
            routeInfo.total_a_pagar,
            routeInfo.total_pagado,
            routeInfo.notas,
        ]);

        await GoogleSheetsService.clearRange({
            sheets,
            spreadsheetId,
            range: 'Ruta!A1:J',
        });

        await GoogleSheetsService.appendValues({
            sheets,
            spreadsheetId,
            range: 'Ruta!A1:J',
            values: [HEADERS, ...values],
        });

        await GoogleSheetsService.formatSheet({
            sheets,
            spreadsheetId,
            requests: [
                {
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: 0,
                            endColumnIndex: HEADERS.length,
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0, green: 0, blue: 0 },
                                horizontalAlignment: "CENTER",
                                verticalAlignment: "MIDDLE",
                                wrapStrategy: "WRAP",
                                textFormat: {
                                    foregroundColor: { red: 1, green: 1, blue: 1 },
                                    bold: true,
                                },
                            },
                        },
                        fields: "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)",
                    },
                },
                {
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 1,
                            endRowIndex: values.length + 1,
                            startColumnIndex: 0,
                            endColumnIndex: HEADERS.length,
                        },
                        cell: {
                            userEnteredFormat: {
                                horizontalAlignment: "CENTER",
                                verticalAlignment: "MIDDLE",
                                wrapStrategy: "WRAP",
                            },
                        },
                        fields: "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy)",
                    },
                },
                {
                    updateSheetProperties: {
                        properties: {
                            sheetId: 0,
                            gridProperties: {
                                frozenRowCount: 1,
                            },
                        },
                        fields: "gridProperties.frozenRowCount",
                    },
                },
            ],
        });

        return GoogleSheetsService.getSheetUrl(
            spreadsheetId
        );
    },
};

module.exports = GoogleSheetsRoutesService;