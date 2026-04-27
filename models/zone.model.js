const prisma = require("../config/prisma");

/**
 * Modelo de acceso a datos para la gestión de zonas de reparto.
 *
 * @namespace Zone
 */
module.exports = class Zone {

    /**
     * Obtiene todas las zonas registradas en el sistema.
     *
     * @returns {Promise<Array<{ id_zona: number, descripcion: string, id_estado: number, id_municipio: number }>>}
     * Arreglo con las zonas disponibles, o un arreglo vacío si no existen registros.
     * @see getRegisterClient
     */
    static async findAll() {
        return await prisma.zona.findMany({
            select: {
                id_zona: true,
                descripcion: true,
                id_estado: true,
                id_municipio: true,
            }
        });
    }

};