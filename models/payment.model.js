/**
 * Modelo de acceso a datos para el módulo de pagos y recolección
 * Encapsula todas las operaciones sobre la tabla `formas_pago`
 * relacionadas con el flujo de pagos
 *
 * Todas las operaciones son realizadas mediante el cliente Prisma configurado
 * en `config/prisma`
 *
 * @namespace Payment
 */

const prisma = require("../config/prisma");

module.exports = class Payment {
    /**
     * Obtiene las formas de pago guardadas en la bd.
     *
     * @async
     * @static
     * @returns {Promise<Object|null>} Objeto con ela lista de los métodos de pago
     */
    static async getPaymentInfo() {
        const payMethods = await prisma.formas_pago.findMany();

        return payMethods
    }

}