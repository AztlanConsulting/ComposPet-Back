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

module.exports = class Client {
    /**
     * Obtiene el cliente asociado al id de usuario proporcionado.
     *
     * @async
     * @static
     * @param {string} userId - Id del usuario.
     * @returns {Promise<Object|null>} Objeto con el id del cliente o `null` si no existe.
     */
    static async getClientByUserId(userId) {
        //obtiene el cliente dependiendo del id de usuario
        const client = await prisma.cliente.findUnique({
            where: {
                id_usuario: userId,
            },
        });

        return client;
    }

    /**
     * Obtiene el saldo del cliente con su id.
     *
     * @async
     * @static
     * @param {string} idClient - Id del cliente.
     * @returns {Promise<Object|null>} Objeto con el saldo del cliente
     */
    static async getClientBalance(idClient) {
        const balance = await prisma.saldo.findUnique({
            where: {
                id_cliente: idClient,
            },
        })

        return balance
    }

}