const prisma = require("../config/prisma");

/**
 * Modelo que representa las rutas registradas en el sistema.
 * Interactúa con la tabla `ruta` de la base de datos.
 */
module.exports = class Route {
    
    /**
     * Obtiene todos los días de ruta disponibles en el sistema.
     * Consulta la tabla `ruta` y retorna únicamente el identificador y el día asignado.
     * Se utiliza para poblar el catálogo de días de ruta en el formulario de registro de clientes.
     *
     * @returns {Promise<Array<{ id_ruta: number, dia_ruta: string }>>}
     * Arreglo con los registros de ruta disponibles, o un arreglo vacío si no existen.
     * @see Route.findAllDaysOfRoute
     */
    static async findAllDaysOfRoute(){
        const daysOfRoutes = await prisma.ruta.findMany({
            select: {
                id_ruta: true,
                dia_ruta: true,
            }
        });

        return daysOfRoutes;
    }
    
}