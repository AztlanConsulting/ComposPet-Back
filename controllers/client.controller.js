const Cliente = require('../models/client.model');

/**
 * Obtiene el cliente asociado a un usuario.
 * Recibe el id del usuario en el body y retorna el id del cliente relacionado.
 *
 * @async
 * @function obtenerClientePorIdUsuario
 * @param {string} req.body.idUsuario - Id del usuario
 * @returns {Promise<void>} Respuesta JSON con el cliente encontrado o un error.
 */

const obtenerClientePorIdUsuario = async (req, res) => {
    console.log("Entro a obtenerClientePorIdUsuario con body:", req.body);
    try {
        const { idUsuario } = req.body;

        if (!idUsuario) {
            return res.status(400).json({
                success: false,
                message: 'Falta el id del usuario para obtener el cliente.',
            });
        }

        // Solicita al modelo la búsqueda del cliente por id de usuario
        const cliente = await Cliente.obtenerClientePorIdUsuario(idUsuario);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró un cliente asociado a este usuario.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cliente obtenido exitosamente.',
            data: cliente,
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

module.exports = {
    obtenerClientePorIdUsuario,
};
