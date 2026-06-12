const prisma = require('../config/prisma');

/**
 * Modelo para consultar la información de las formas de pago.
 */
class PaymentInfo {
    /**
     * Obtiene las notas de la forma de pago por transferencia.
     *
     * @async
     * @returns {Promise<Object|null>} Objeto con las notas de transferencia
     * o `null` cuando no existe el registro.
     */
    static async getTransferPaymentNotes() {
        return await prisma.formas_pago.findFirst({
            where: {
                tipo: 'Transferencia',
            },
            select: {
                notas: true,
            },
        });
    }

    
}

module.exports = PaymentInfo;