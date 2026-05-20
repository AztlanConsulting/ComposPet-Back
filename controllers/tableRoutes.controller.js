const Routes = require('../models/route.model');
const GoogleSheetsMessagesService = require('../config/googleSheetsMessages.service');



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
                message: "No hay solicitudes para generar mensajes",
            });
        }

        const title = `Mensajes de Confirmación para Rutas - Semana ${weekIndex} - ${dayName}`;

        const messages = routeInfo.map((route) => {

            // Se usa solo el primer nombre
            const firstName = route.nombre.split(" ")[0];

            return[`¡Linda Tarde! ${firstName}, ⛅

            Mañana nos vemos para tu recolección aprox.
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

module.exports = {
    getTableInfo,
    getAvailableWeeks,
    getDaysOfRoutes,
    getFilteredRoutesInfo,
    generateConfirmationMessages,
}