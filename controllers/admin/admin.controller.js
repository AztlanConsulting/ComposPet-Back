const State = require('../../models/state.model');
const Town = require('../../models/town.model');
const Route = require('../../models/route.model');

/**
 * Obtiene los datos necesarios para renderizar el formulario de registro de un nuevo cliente.
 * Si alguno de los catálogos está vacío, se interrumpe la respuesta con un error 404
 * para evitar que el formulario se presente con información incompleta.
 *
 * @returns {Promise<void>} Responde con un JSON que contiene los catálogos necesarios,
 * o un mensaje de error si alguno no está disponible.
 * @throws {Error} Responde con status 500 si ocurre un fallo inesperado al consultar la base de datos.
 * @see State.findAllStates
 * @see Town.findAllTowns
 * @see Route.findAllDaysOfRoute
 */
const getRegisterClient = async (req, res) => {

    try {
        const [states, towns, daysOfRoutes] = await Promise.all([
            State.findAllStates(),
            Town.findAllTowns(),
            Route.findAllDaysOfRoute(),
        ]);

        if (!states || states.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No se encontraron estados.' 
            });
        }

        if (!towns || towns.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No se encontraron municipios.' 
            });
        }

        if (!daysOfRoutes || daysOfRoutes.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No se encontraron días de ruta.' 
            });
        }


    } catch (error) {
        console.error('Error en getRegisterClient:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener datos para registrar un nuevo cliente',
        })
    }
};


module.exports = {
    getRegisterClient,
};