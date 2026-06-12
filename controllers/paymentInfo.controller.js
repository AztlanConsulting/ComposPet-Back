const PaymentInfo = require('../models/paymentInfo.model');

/**
 * Obtiene las notas de la forma de pago por transferencia.
 *
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Respuesta HTTP con las notas de transferencia.
 */
const getPaymentInfo = async (req, res) => {
    try {
        const paymentInfo = await PaymentInfo.getTransferPaymentNotes();

        if (!paymentInfo) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la información de transferencia.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Información de transferencia obtenida exitosamente.',
            data: paymentInfo,
        });
    } catch (error) {
        console.error(
            'Error al obtener la información de transferencia:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener la información de transferencia.',
        });
    }
};

module.exports = {
    getPaymentInfo,
};