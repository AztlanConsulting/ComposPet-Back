const Credit = require('../models/credit.model');

/**
 * Obtiene el saldo de la tarjeta de lealtad del cliente
 * Si no existe, crear una tarjeta inicial.

 *
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} req.body - Cuerpo de la solicitud.
 * @param {string} req.body.clientId - Id del cliente.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Respuesta HTTP con la solicitud encontrada o creada.
 * @throws {Error} Cuando ocurre un error inesperado al obtener la solicitud.
 */

const getCreditBalance= async (req, res) => {
    try{

        const { clientId } = req.body;

        // Validación de que lleguen los datos
        if(!clientId){
            return res.status(400).json({
                success:false,
                message: 'Falta id del cliente para obtener el balance de tarjeta',
            });
        }

        // Solicita al modelo la búsqueda
        let creditBalance = await Credit.getCreditBalance(clientId);

        // Si no existe una tarjeta previa, crea una para continuar
        if (!creditBalance){
            creditBalance = await Credit.createInitialCredit(clientId);            
        }

        res.status(200).json({
            success: true,
            message: "Saldo de tarjeta obtenido exitosamente",
            data: creditBalance
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: "Error servidor al obtener el saldo del cliente.", 
            error,
        });
    }
};

module.exports = {
    getCreditBalance,
};