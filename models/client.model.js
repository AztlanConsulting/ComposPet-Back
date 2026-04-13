/**
 * Modelo de acceso a datos para el módulo de clientes
 * Encapsula todas las operaciones sobre la tabla `cliente` y `bitacora`
 * relacionadas con el flujo del cliente,
 * de la tabla de cliente y la auditoría necesaria
 *
 * Todas las operaciones son realizadas mediante el cliente Prisma configurado
 * en `config/prisma`
 *
 * @namespace Client
 */

const prisma = require("../config/prisma");

module.exports = class Cliente {
    /**
     * Obtiene el cliente asociado al id de usuario proporcionado.
     *
     * @async
     * @static
     * @param {string} idUsuario - Id del usuario 
     * @returns {Promise<object|null>} Objeto con el id del cliente o `null` si no existe.
     */

    static async obtenerClientePorIdUsuario(idUsuario) {
        const cliente = await prisma.cliente.findUnique({
            where: {
                id_usuario: idUsuario,
            },
        });

        return cliente;
    }

}