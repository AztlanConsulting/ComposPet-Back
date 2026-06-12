const Client = require('../models/client.model');
const Route = require('../models/route.model');
const { validateEditClient } = require('../utils/editValidations');

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

        // Extrae el identificador del usuario para buscar el cliente
        const { userId } = req.body;

        // Valida que el identificador del usuario haya sido enviado.
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Falta el id del usuario para obtener la información del cliente.',
            });
        }

        // Consulta el modelo para obtener el cliente 
        const client = await Client.getClientByUserId(userId);


        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la información del cliente asociado a este usuario.',
            });
        }

        const fullName = client.usuarios_cp?.nombre?.trim() || '';
        const firstName = fullName.split(/\s+/)[0] || '';


        const clientData = {
            clientId: client.id_cliente,
            routeId: client.id_ruta,
            name: firstName,
            routeDay: client.ruta?.dia_ruta ?? null,
        };


        return res.status(200).json({
            success: true,
            message: 'Información del cliente obtenida exitosamente.',
            data: clientData,
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

/**
 * Obtiene la lista de rutas registradas.
 *
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {JSON} Respuesta JSON con la lista de rutas disponibles.
 * @throws {Error} Cuando ocurre un error inesperado al obtener las rutas.
 */
const getRoutes = async (req, res) => {
    try {

        const routes = await Route.findAllDaysOfRoute();

        return res.status(200).json({
            success: true,
            routes: routes,
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las rutas disponibles.',
            error,
        })
    }
}


/**
 * Actualiza la información del cliente ingresado.
 *
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {JSON} Respuesta JSON con success.
 * @throws {Error} Cuando ocurre un error inesperado al actualizar el cliente.
 */
const updateClient = async (req, res) => {
    try {
        const { clientObject } = req.body;

        const validationResult = validateEditClient(clientObject);

        if (!validationResult.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos.',
                errors: validationResult.errors
            });
        }

        const {
            userData, clientData, balanceData
        } = buildDataObjects(clientObject);

        const success = await Client.updateClient(
            clientObject.userId,
            clientObject.clientId,
            userData,
            clientData,
            balanceData,
        );

        res.status(200).json({
            success: true,
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la información del cliente.',
            error,
        })
    }
}

/**
 * Divide la información del objeto de cliente en
 * los objetos userData, clientData y balanceData
 * 
 * @async
 * @param {Object} clientObject - Objeto con la información a actualizar del cliente
 * @returns {Object} Objeto con los 3 objetos de data
 */
function buildDataObjects(clientObject) {
    const userData = {};
    const clientData = {};
    const balanceData = {};

    // Campos de la tabla usuarios_cp
    if (clientObject.cellphone !== undefined) {
        userData.telefono = clientObject.cellphone;
    }

    if (clientObject.priceType !== undefined) {
        clientData.tipo_precio = clientObject.priceType;
    }

    if (clientObject.status !== undefined) {
        userData.estatus = clientObject.status;
    }

    if (clientObject.email !== undefined) {
        userData.correo = clientObject.email;
    }

    // Campos para la tabla clientes
    if (clientObject.notes !== undefined) {
        clientData.notas = clientObject.notes;
    }

    if (clientObject.address !== undefined) {
        clientData.direccion = clientObject.address;
    }

    if (clientObject.pets !== undefined) {
        clientData.mascotas = clientObject.pets;
    }

    if (clientObject.family !== undefined) {
        clientData.familia = clientObject.family;
    }

    if (clientObject.routeId !== undefined) {
        clientData.id_ruta = clientObject.routeId;
    }

    if (clientObject.order !== undefined) {
        clientData.orden_horario = clientObject.order;
    }

    // Campos para saldo
    if (clientObject.balance !== undefined) {
        balanceData.saldo = clientObject.balance;
    }

    return { userData, clientData, balanceData };

}

const getCompostStatus = async(req, res) =>{
    try {
        const status = await Client.getCompostStatus();

        return res.status(200).json({
            success:true,
            data: status,
        })
    } catch (error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el estatus de la composta.',
        })
    }
}

const updateCompostStatus = async(req, res) => {
    try{
        const { status } = req.body;

        if (typeof status !== 'boolean') {
            throw new Error('INVALID_COMPOST_STATUS');
        }

        const result = await Client.updateCompostStatus(status);

        return res.status(200).json({
            success:true,
            message: 'Estatus de composta actualizado exitosamente.',
        })
    } catch (error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el estatus de la composta.',
        })
    }
}

module.exports = {
    getClientByUserId,
    getClientsInfo,
    getRoutes,
    updateClient,
    getCompostStatus,
    updateCompostStatus,
};
