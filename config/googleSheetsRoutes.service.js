const GoogleSheetsService = require('./googleSheets.service');

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

const GoogleSheetsRoutesService = {

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