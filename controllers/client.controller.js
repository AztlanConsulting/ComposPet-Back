const Client = require('../models/client.model');

/**
 * Obtiene el cliente asociado a un usuario.
 * Recibe el id del usuario en el body y retorna el id del cliente relacionado.
 *
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} req.body - Cuerpo de la solicitud.
 * @param {string} req.body.userId - Id del usuario.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Respuesta JSON con el cliente encontrado o un error.
 * @throws {Error} Cuando ocurre un error inesperado al obtener el cliente.
 */

const getClientByUserId = async (req, res) => {
    try {
        // Extrae el identificador del usuario para buscar el cliente
        const { userId } = req.body;

        // Valida que el identificador del usuario haya sido enviado.
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Falta el id del usuario para obtener el cliente.',
            });
        }

        // Consulta el modelo para obtener el cliente 
        const client = await Client.getClientByUserId(userId);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró un cliente asociado a este usuario.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cliente obtenido exitosamente.',
            data: client,
        });
    } catch (error) {
        console.error('Error al obtener el cliente por id de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener el cliente.',
            error,
        });
    }
};

const getClientsInfo = async (req, res) => {
    try {

        const clientList = await Client.getClients();

        console.log("CLIENT LIST: ", clientList);

        return res.status(200).json({
            success: true,
            message: 'Lista obtenida exitosamente',
            clientList, clientList
        })

    } catch (error) {
        console.error('Error al obtener la lista de clientes', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener la lista de clientes.',
            error,
        });
    }
}

module.exports = {
    getClientByUserId,
    getClientsInfo,
};
