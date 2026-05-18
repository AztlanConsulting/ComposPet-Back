const Routes = require('../models/route.model');
const Payment = require('../models/payment.model');
const CollectionRequest = require('../models/collectionRequest.model');
const { request } = require('express');

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
        })
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
            weekIndex: Number(weekIndex),
            dayName: dayName && dayName !== "undefined" && dayName !== "null"
                ? dayName
                : undefined,
        });

        return res.status(200).json({
            success: true,
            data: filteredInfo,
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error obteniendo la información.",
        })
    }
}

/**
 * Actualiza la información de la solicitud de recolección
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

        const {
            requestData,
            productsData
        } = structureRequestData(data);

        await CollectionRequest.updateRequest(requestData, productsData);

        return res.status(200).json({
            success: true,
        })
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

    console.log(requestData);

    return {requestData, productsData};
}

module.exports = {
    getTableInfo,
    getEditTableInfo,
    getAvailableWeeks,
    getDaysOfRoutes,
    getFilteredRoutesInfo,
    updateRequest,
}