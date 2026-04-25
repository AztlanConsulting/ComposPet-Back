/**
 * Modelo de acceso a datos para el módulo de tarjeta del cliente.
 * Encapsula todas las operaciones sobre la tabla `tarjeta`
 * relacionadas con el flujo de la tarjeta del cliente y
 * de la tabla de tarjeta.
 *
 * Todas las operaciones son realizadas mediante el cliente Prisma configurado
 * en `config/prisma`
 *
 * @namespace Credit
 */

const prisma = require("../config/prisma");

module.exports = class Credit {

    /**
     * Obtiene el saldo del cliente.
     *
     * @async
     * @static
     * @param {string} clientId - Id del cliente.
     * @returns {Promise<Object|null>} La saldo encontrado o `null` si no existe.
     */
    static async getCreditBalance(clientId){

        // Busca el saldo del cliente.
        const creditBalance = await prisma.saldo.findFirst({
            where: {
                id_cliente: clientId,
            },
        });

        // Si existe regresa el saldo del cliente
        return creditBalance;
    }

    /**
     * Crea una tarjeta con saldo en 0
     *
     * @async
     * @static
     * @param {string} clientId - Id del cliente.
     * @returns {Promise<Object>} La tarjeta creada.
     */
    static async createInitialCredit(clientId) {
        const newCredit = await prisma.saldo.create({
            data:{
                cliente: {
                    connect:{
                        id_cliente: clientId
                    }
                },
                saldo: 0,
            },
        });

        return newCredit;
    }
};