const prisma = require("../config/prisma");

/**
 * Modelo que representa los municipios registrados en el sistema.
 * Interactúa con la tabla `municipios` de la base de datos mediante Prisma ORM.
 */
module.exports = class Town {
    /**
     * Obtiene todos los municipios disponibles en el sistema, ordenados alfabéticamente.
     *
     * @returns {Promise<Array<{ id_municipio: number, municipio: string }>>}
     * Arreglo con los municipios ordenados de forma ascendente por nombre.
     * @see Town.findAllTowns
     */
    static async findAllTowns(){
        const towns = await prisma.municipios.findMany({
            orderBy:{
                municipio: 'asc',
            },
            select: {
                id_municipio: true,
                municipio: true,
            }
        });

        return towns;
    }
}