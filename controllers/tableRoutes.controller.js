const Routes = require('../models/route.model');

/**
 * Controlador encargado de obtener la información de rutas
 * para mostrarla en la tabla correspondiente.
 *
 * Realiza la consulta al modelo `Routes` y retorna la información
 * en formato JSON.
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


module.exports = {
    getTableInfo,
}