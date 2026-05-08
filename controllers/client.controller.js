const Client = require('../models/client.model');

/**
 * Obtiene la información básica del cliente asociado a un usuario,
 * incluyendo su ruta asignada
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

        console.log("Entro al back")
        // Extrae el identificador del usuario para buscar el cliente
        const { userId } = req.body;

        console.log("SI OBTIENE EL EUSER ID",userId)
        // Valida que el identificador del usuario haya sido enviado.
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Falta el id del usuario para obtener la información del cliente.',
            });
        }

        // Consulta el modelo para obtener el cliente 
        const client = await Client.getClientByUserId(userId);

        console.log("ESTOS SON LOS DATOS QUE RECUPERO DEL CLIENTE", client)

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la información del cliente asociado a este usuario.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Información del cliente obtenida exitosamente.',
            data: client,
        });
    } catch (error) {
        console.error('Error al obtener la información del cliente por id de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener la información del cliente.',
            error,
        });
    }
};

const getClientsInfo = async (req, res) => {
    try {

        const clientList = await Client.getClients();

        return res.status(200).json({
            success: true,
            message: 'Lista obtenida exitosamente',
            clientList: clientList
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
