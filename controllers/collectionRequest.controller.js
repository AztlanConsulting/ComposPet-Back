const CollectionRequest = require('../models/collectionRequest.model');


/**
 * Obtiene la solicitud de recolección actual del cliente para la semana indicada.
 * Si no existe una solicitud dentro de ese rango de fechas, se crea una solicitud inicial.
 *
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} req.body - Cuerpo de la solicitud.
 * @param {number} req.body.clientId - Id del cliente.
 * @param {string} req.body.weekStartDate - Fecha inicial de la semana.
 * @param {string} req.body.weekEndDate - Fecha final de la semana.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Respuesta HTTP con la solicitud encontrada o creada.
 * @throws {Error} Cuando ocurre un error inesperado al obtener la solicitud.
 */

const getCurrentCollectionRequest = async (req, res) => {
    try {

        //Arbnb style destructuring para extraer los datos del body de la solicitud
        const {
            clientId,
            weekStartDate,
            weekEndDate,
        } = req.body;

        // Validación de que lleguen los datos
        if (!clientId || !weekStartDate || !weekEndDate) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para obtener la solicitud de recolección.',
            });
        }

        // Solicita al modelo la búsqueda o creación de la solicitud actual
        const currentCollectionRequest = await CollectionRequest.getCurrentCollectionRequest(
            clientId, 
            weekStartDate, 
            weekEndDate
        );

         // Si no existe una solicitud previa, crea el registro inicial para continuar el flujo
        if (!currentCollectionRequest) {
            currentCollectionRequest= await CollectionRequest.createInitialCollectionRequest(clientId);
        }

        res.status(200).json({
            success: true,
            message: "Solicitud de recolección obtenida exitosamente.",
            data: currentCollectionRequest,
        });
    } catch (error) {
        console.error("Error al obtener la solicitud de recolección:", error);

        res.status(500).json({
            success: false,
            message: "Error servidor al obtener la solicitud de recolección.",
            error,
        });
    }   
};

/**
 * Guarda la información de la primera sección del formulario de recolección.
 * Actualiza la solicitud con la decisión del cliente sobre la recolección,
 * los productos extra y las cantidades de cubetas involucradas.
 *
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} req.body - Cuerpo de la solicitud.
 * @param {number} req.body.requestId - Id de la solicitud.
 * @param {boolean} req.body.wantsCollection - Indica si el cliente desea recolección.
 * @param {boolean} req.body.wantsExtraProducts - Indica si el cliente desea productos extra.
 * @param {number} req.body.collectedBuckets - Cantidad de cubetas que el cliente entregará.
 * @param {number} req.body.deliveredBuckets - Cantidad de cubetas vacías solicitadas.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Respuesta HTTP con la solicitud actualizada.
 * @throws {Error} Cuando ocurre un error inesperado al guardar la información.
 */

const saveCollectionRequestFirstSection  = async (req, res) => {
    try {
        // Recupera los datos de la primera sección del formulario enviados por el cliente.
        const {
            requestId,
            wantsCollection,
            wantsExtraProducts,
            collectedBuckets,
            deliveredBuckets,
        } = req.body;

        // Validación de que lleguen los datos
        if (!requestId || wantsCollection === undefined || wantsExtraProducts === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para guardar la primera sección de la solicitud de recolección.',
            });
        }

         // Envía al modelo la información para actualizar la solicitud
        const savedCollectionRequest = await CollectionRequest.saveCollectionRequestFirstSection({
            requestId,
            wantsCollection,
            wantsExtraProducts,
            collectedBuckets,
            deliveredBuckets,
        });

        res.status(200).json({
            success: true,
            message: "Primera sección de la solicitud de recolección guardada exitosamente.",
            data: savedCollectionRequest,
        });
    } catch (error) {
        console.error("Error al guardar la primera sección de la solicitud de recolección:", error);
        res.status(500).json({
            success: false,
            message: "Error servidor al guardar la primera sección de la solicitud de recolección.",
            error,
        });
    }
}

module.exports = {
    getCurrentCollectionRequest,
    saveCollectionRequestFirstSection,
};