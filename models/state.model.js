const prisma = require("../config/prisma");

/**
 * Modelo que representa los estados del país registrados en el sistema.
 * Interactúa con la tabla `estados` de la base de datos mediante Prisma ORM.
 */
module.exports = class State {
    /**
     * Obtiene todos los estados disponibles en el sistema, ordenados alfabéticamente.
     *
     * @returns {Promise<Array<{ id_estado: number, estado: string }>>}
     * Arreglo con los estados ordenados de forma ascendente por nombre
     * @see State.findAllStates
     */
    static async findAllStates(){
        const states = await prisma.estados.findMany({
            orderBy:{
                estado: 'asc',
            },
            select: {
                id_estado: true,
                estado: true,
            }
        });

        return states;
    }
}