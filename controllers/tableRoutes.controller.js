const Routes = require('../models/route.model');
const Payment = require('../models/payment.model');
const CollectionRequest = require('../models/collectionRequest.model');

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

module.exports = {
    getTableInfo,
    getEditTableInfo,
    getAvailableWeeks,
    getDaysOfRoutes,
    getFilteredRoutesInfo,
}