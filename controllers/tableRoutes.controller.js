const Routes = require('../models/route.model');
const GoogleSheetsMessagesService = require('../config/googleSheetsMessages.service');
const GoogleSheetsRoutesService = require('../config/googleSheetsRoutes.service');
const Payment = require('../models/payment.model');
const CollectionRequest = require('../models/collectionRequest.model');
const { request } = require('express');
const { validateRequestUpdate } = require('../utils/editValidations');

/**
 * Obtiene la información general de todas las rutas para mostrarla en la tabla principal.
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con un JSON que contiene la información de las rutas.
 * @throws {Error} Responde con status 500 si ocurre un fallo inesperado al consultar la base de datos.
 * @see Routes.getRoutesInfo
 */
const getTableInfo = async(req,res) => {
    try {
        // Obtiene la información de rutas desde el modelo
        const routeInfo = await Routes.getRoutesInfo();

        // Retorna la información obtenida exitosamente
        return res.status(200).json({
            success: true,
            data: routeInfo,
        })
    } catch(error){
        // Retorna un error en caso de que falle la consulta
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error obteniendo la información.",
        })
    }
}

/**
 * Obtiene la información de los productos extra y de los métodos de pago
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con un JSON que contiene la información de productos extra y métodos de pago.
 * @throws {Error} Responde con status 500 si ocurre un fallo inesperado al consultar la base de datos.
 */
const getEditTableInfo = async(req, res) => {
    try {

        const payMethods = await Payment.getPaymentInfo();

        const extraProducts = await CollectionRequest.getExtraProducts();

        return res.status(200).json({
            success: true,
            payMethods,
            extraProducts,
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error obteniendo la información.",
        });
    }
}
/**
 * Obtiene las semanas disponibles para filtrar la información de rutas.
 * Se utiliza para poblar el selector de semanas en la vista de rutas.
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con un JSON que contiene las semanas disponibles.
 * @throws {Error} Responde con status 500 si ocurre un fallo inesperado al consultar la base de datos.
 * @see Routes.getAvailableWeeks
 */
const getAvailableWeeks = async(req, res) => {
    try{
        const weeks = await Routes.getAvailableWeeks();

        return res.status(200).json({
            success: true,
            data: weeks,
        });
    } catch (error){
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error obteniendo la información.",
        });
    }
}

/**
 * Obtiene todos los días de ruta disponibles en el sistema.
 * Se utiliza para poblar el selector de días en la vista de rutas.
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con un JSON que contiene los días de ruta disponibles.
 * @throws {Error} Responde con status 500 si ocurre un fallo inesperado al consultar la base de datos.
 * @see Routes.findAllDaysOfRoute
 */
const getDaysOfRoutes = async (req, res) => {
    try {
        const days = await Routes.findAllDaysOfRoute();

        return res.status(200).json({ 
            success: true, 
            data: days 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: "Error obteniendo días de ruta",
        });
    }
}

/**
 * Obtiene la información de rutas filtrada por semana y opcionalmente por día.
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {string} req.query.weekIndex - Índice de la semana a filtrar. Se convierte a número.
 * @param {string} [req.query.dayName] - Nombre del día a filtrar. Opcional.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con un JSON que contiene la información de rutas filtrada.
 * @throws {Error} Responde con status 500 si ocurre un fallo inesperado al consultar la base de datos.
 * @see Routes.getFilteredRoutesInfo
 */
const getFilteredRoutesInfo = async(req, res) => {
    try{
        const { weekIndex, dayName } = req.query;

        const filteredInfo = await Routes.getFilteredRoutesInfo({
            weekIndex: weekIndex !== undefined && weekIndex !== "undefined" && weekIndex !== ""
                ? Number(weekIndex)
                : null,
            dayName: dayName && dayName !== "undefined" && dayName !== "null"
                ? dayName
                : undefined,
        });

        return res.status(200).json({
            success: true,
            data: filteredInfo,
        })

    } catch (error) {
        console.error("Error en getFilteredRoutesInfo:", error);
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error obteniendo la información.",
        })
    }
}

/**
 * Genera mensajes de confirmación para las solicitudes de recolección filtradas
 * por semana y día de ruta, y los envía a un archivo de Google Sheets.
 *
 * @async
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {string} req.body.weekIndex - Índice de la semana a filtrar. Se convierte a número.
 * @param {string} req.body.dayName - Nombre del día a filtrar. Opcional.
 * @param {string} req.cookies.googleToken - Token de autenticación para Google Sheets.
 * @param {import('express').Response} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con la data.
 * @throws {Error} Responde con status 500 si ocurre un fallo inesperado al consultar rutas o escribir en Google Sheets.
 * @see Routes.generateConfirmationMessages
 * @see GoogleSheetsMessagesService.sendRouteMessages
 */
const generateConfirmationMessages = async (req, res) => {
    try {

        const { weekIndex, dayName } = req.body;

        const googleToken = req.cookies.googleToken;

        if (weekIndex === undefined || weekIndex === null || !dayName) {
            return res.status(400).json({
                success: false,
                message: "Faltan datos para generar los mensajes de confirmación",
            });
        }

        if (!googleToken) {
            return res.status(401).json({
                success: false,
                message: "No hay token de Google para usar Google Sheets",
            });
        }

        const routeInfo = await Routes.generateConfirmationMessages({
            weekIndex: Number(weekIndex),
            dayName: dayName && dayName !== "undefined" && dayName !== "null"
                ? dayName
                : undefined,
        });

        if (!routeInfo || routeInfo.length === 0) {
            return res.status(200).json({
                success: false,
                message: "Revisa que las solicitudes estén completas y agrega un horario a cada una",
            });
        }

        const title = `Mensajes de Confirmación para Rutas - Semana ${weekIndex} - ${dayName}`;

        const messages = routeInfo.map((route) => {

            // Se usa solo el primer nombre
            const firstName = route.nombre.split(" ")[0];

            const serviceText =
                route.wantsCollection === true && route.wantsExtraProducts === true
                    ? "recolección y entrega de productos"
                    : route.wantsExtraProducts === true
                        ? "entrega de productos"
                        : "recolección";

            return[`¡Linda Tarde! ${firstName}, ⛅

            Mañana nos vemos para tu ${serviceText} aprox.
            ${route.horario} 🪣🤩 con "Nombre Operador"

            Disfruta el resto de tu tarde.😄`, `${route.nombre}`]
    });


        const sheetUrl =
            await GoogleSheetsMessagesService.sendRouteMessages( 
                googleToken,
                title,
                messages
            );

        return res.status(200).json({
            success: true,
            messages :"Mensajes de confirmación generados exitosamente.",
            data: { sheetUrl, },
        });
        
    } catch (error) {
        console.error("Error generando mensajes de confirmación:", error);
        
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error generando los mensajes de confirmación.",
            error: error.message,
        });
    }
}

/**
 * Obtiene las rutas del día actual y las exporta a Google Sheets.
 * Función utilitaria compartida entre el controlador HTTP y la tarea programada de cron.
 *
 * @returns {Promise<string>} URL de la hoja de cálculo generada en Google Sheets.
 * @throws {Error} Si falla la consulta de rutas o la exportación a Google Sheets.
 * @see Routes.getRoutesInfo
 * @see GoogleSheetsRoutesService.exportDailyRoutes
 */
const exportDailyRoutes = async () => {
    const routeInfo = await Routes.getRoutesInfo();
    const sheetUrl = await GoogleSheetsRoutesService.exportDailyRoutes(routeInfo);

    return sheetUrl;
}

/**
 * Controlador HTTP que dispara manualmente la exportación de rutas del día a Google Sheets.
 * Internamente delega en `exportDailyRoutes`, la misma función utilizada por la tarea cron.
 * Responde con la URL de la hoja generada si la exportación es exitosa.
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con status 200 y la URL de la hoja, o 500 si ocurre un error.
 * @throws {Error} Responde con status 500 si falla la consulta de rutas o la exportación.
 * @see exportDailyRoutes
 */
const exportDailyRoutesInfo = async (req, res) => {
    try {
        
        const routeInfo = await exportDailyRoutes();

        return res.status(200).json({
            success: true,
            message: "Exportación exitosa",
            data: { routeInfo },
        });

    } catch(error){
        console.error("Error exportando rutas a Sheets:", error);
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error obteniendo la información.",
            error: error.message,
        });
    }
};

/** Actualiza la información de la solicitud de recolección
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {Int} req.body.collectedBuckets - Número de cubetas a recolectar.
 * @param {Int} req.body.deliveredBuckets - Número de cubetas a entregar.
 * @param {Array} req.body.extraProducts - String con la información de los productos extra seleccionados.
 * @param {Object} req.body.extraProductsArray - Diccionario con la cantidad de productos por id.
 * @param {Array} req.body.extraProductsDetails - Información de los productos extra actualizados.
 * @param {BOOL} req.body.hasRequest - Bandera si el cliente quiso recolección.
 * @param {string} req.body.name - Nombre del cliente.
 * @param {string} req.body.notes - Notas asociadas a la recolección.
 * @param {Int} req.body.paymentId - Id de la forma de pago seleccionada.
 * @param {string} req.body.paymentMethod - Tipo de pago seleccionado.
 * @param {string} req.body.schedule - Fecha en la que el operador va a pasar.
 * @param {BOOL} req.body.status - Bandera si el cliente está activo.
 * @param {string} req.body.totalPaid - Dinero total pagado por la recolección.
 * @param {string} req.body.totalToPay - Dinero total a pagar por la recolección.
 * @param {BOOL} req.body.wantsCollection - Bandera si el cliente quiere que le recolecten cubetas.
 * @param {BOOL} req.body.wantsExtraProducts - Bandera si el usuario quiere productos extra.
 * @param {UUID} req.body.clientId - Id del cliente.
 * @param {UUID} req.body.requestId - Id de la solicitud de recolección.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con un JSON que contiene success true/false.
 * @throws {Error} Responde con status 500 si ocurre un fallo inesperado al modificar la base de datos.
 */
const updateRequest = async(req, res) => {
    try {
        const { data } = req.body;

        const validation = validateRequestUpdate(data);

        if(!validation.isValid){
            return res.status(400).json({
                success: false,
                message: "Datos inválidos para actualizar la solicitud",
                errors: validation.errors,
            });
        }

        const {
            requestData,
            productsData
        } = structureRequestData(data);

        await CollectionRequest.updateRequest(requestData, productsData);

        res.status(200).json({
            success: true,
        })

        exportDailyRoutes().catch((err) =>
            console.error("Error sincronizando Sheets tras edición:", err)
        );
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error actualizando la información",
        })
    }
}

/**
 * Divide la información del objeto de request en
 * los objetos requestData y el arreglo productsData
 * 
 * @async
 * @param {Object} clientObject - Objeto con la información a actualizar del cliente
 * @returns {Object} Objeto con los 3 objetos de data
 */
function structureRequestData(data){
    const requestData = {};
    let productsData = [];

    if(data.requestId !== undefined){
        requestData.id_solicitud = data.requestId;
    }

    if(data.collectedBuckets !== undefined){
        requestData.cubetas_recolectadas = data.collectedBuckets;
    }

    if(data.deliveredBuckets !== undefined){
        requestData.cubetas_entregadas = data.deliveredBuckets;
    }

    if(data.collectedBuckets < 1 && data.deliveredBuckets < 1){
        requestData.quiere_recoleccion  = false;
    }

    if(data.collectedBuckets > 0 && data.deliveredBuckets > 0){
        requestData.quiere_recoleccion  = true;
    }

    if(data.notes !== undefined){
        requestData.notas = data.notes;
    }

    if(data.paymentId !== undefined){
        requestData.id_pago = data.paymentId;
    }

    if(data.totalPaid !== undefined){
        requestData.total_pagado = data.totalPaid;
    }

    if(data.extraProductsDetails.length > 0 && !data.wantsExtraProducts){
        requestData.quiere_productos_extra = true;
    }

    if(data.extraProductsDetails.length < 1){
        requestData.quiere_productos_extra = false;
    }

    if(data.collectedBuckets > 0 && !data.wantsCollection){
        requestData.quiere_recoleccion = true;
    }

    if(data.schedule !== undefined){
        requestData.horario = data.schedule;
    }

    if(data.extraProductsArray !== undefined){
        productsData = Object.entries(data.extraProductsArray).map(([id_producto, cantidad]) => ({
            id_solicitud: data.requestId,
            id_producto: Number(id_producto),
            cantidad
        }));
    }

    return {requestData, productsData};
}

module.exports = {
    getTableInfo,
    getEditTableInfo,
    getAvailableWeeks,
    getDaysOfRoutes,
    getFilteredRoutesInfo,
    generateConfirmationMessages,
    exportDailyRoutes,
    exportDailyRoutesInfo,
    updateRequest,
}