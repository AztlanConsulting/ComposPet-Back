const Card = require('../models/card.model');

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

const getCardBalance= async (req, res) => {
    try{

        console.log(req.body)
        const { clientId } = req.body;

        // Validación de que lleguen los datos
        if(!clientId){
            return res.status(400).json({
                success:false,
                message: 'Falta id del cliente para obtener el balance de tarjeta',
            });
        }

        // Solicita al modelo la búsqueda
        let cardBalance = await Card.getCardBalance(clientId);

        // Si no existe una tarjeta previa, crea una para continuar
        if (!cardBalance){
            cardBalance = await Card.createInitialCard(clientId);            
        }

        res.status(200).json({
            success: true,
            message: "Saldo de tarjeta obtenido exitosamente",
            data: cardBalance
        });
    }catch(error){
        console.error("Error al obtener el saldo de la tarjeta:", error);

        res.status(500).json({
            success: false,
            message: "Error servidor al obtener el saldo del cliente.", 
            error,
        });
    }
};

module.exports = {
    getCardBalance,
};