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
            currentCollectionRequest = await CollectionRequest.createInitialCollectionRequest(clientId);
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

const saveCollectionRequestFirstSection = async (req, res) => {
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

/**
 * Obtiene todos los productos extra disponibles
 *
 * @async
 * @function getExtraProducts
 */
const getExtraProducts = async (req, res) => {
    try {
        const extraProducts = await CollectionRequest.getExtraProducts();

        return res.status(200).json({
            success: true,
            message: 'Productos extra obtenidos exitosamente.',
            data: extraProducts,
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: 'No se encontraron productos extra.',
        });
    }
};

/**
 * Guarda la segunda sección de la solicitud (productos extra seleccionados)
 *
 * Flujo:
 * 1. Validar datos de entrada
 * 2. Actualizar flag si no hay productos
 * 3. Recuperar productos previamente seleccionados
 * 4. Regresar inventario anterior
 * 5. Descontar nuevo inventario
 * 6. Guardar nuevos productos
 *
 * @async
 * @function saveSecondSection
 * @param {string} req.body.requestIDReceived - ID de la solicitud de recolección
 * @param {Array<Object>} req.body.products - Lista de productos seleccionados
 */
const saveSecondSection = async (req, res) => {
    console.log(req.body);
    try {
        const { requestIDReceived, products } = req.body;

        if (!requestIDReceived || !Array.isArray(products)) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para guardar la segunda sección de la solicitud de recolección.',
            });
        }

        if (
            !products.every(
                (product) =>
                    (product.id_producto !== undefined) &&
                    product.cantidad !== undefined
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Cada producto debe incluir id_producto y cantidad.',
            });
        }

        if (products.length === 0) {
            const updateRequest = await CollectionRequest.updateWantsRequestAttribute(
                requestIDReceived,
                false,
            )
        };

        const productsLastRequest = await CollectionRequest.getInfoAboutExtraProuctsSelected(requestIDReceived);

        if (productsLastRequest.length !== 0) {
            for (const product1 of productsLastRequest) {
                const add = await CollectionRequest.incrementInventory(product1);
            }
        }

        for (const product of products) {
            const substract = await CollectionRequest.substractInventory(product);
        }

        const savedProducts = await CollectionRequest.saveSecondSection(
            requestIDReceived,
            products
        );

        return res.status(200).json({
            success: true,
            message: 'Segunda sección de la solicitud de recolección guardada exitosamente.',
            data: savedProducts,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error de la aplicacion al guardar la segunda sección de la solicitud de recolección.',
            error,
        });
    }
};

/**
 * Obtiene el id de la última solicitud de recolección de un cliente
 *
 * @async
 * @function obtenerUltimaSolicitudPorCliente
 * @param {string} req.body.id_cliente - Id del cliente
 */
const getLastRequestPerClient = async (req, res) => {

    try {
        const idClient = req.body.idClient;

        if (!idClient) {
            return res.status(400).json({
                success: false,
                message: 'El id del cliente es requerido.',
            });
        }

        const data = await CollectionRequest.getLastRequestPerClient(idClient);

        return res.status(200).json({
            data,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error servidor al obtener la última solicitud.',
            error,
        });
    }
};

/**
 * Obtiene los productos extra previamente seleccionados en una solicitud
 *
 * @async
 * @function getInfoAboutExtraProuctsSelected
 * @param {string} req.body.requestID - ID de la solicitud
 */
const getInfoAboutExtraProuctsSelected = async (req, res) => {
    try {
        const requestId = req.body.requestID;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "El id de la solicitud es requerido para obtener la información de los productos extra seleccionados.",
            });
        }

        const data = await CollectionRequest.getInfoAboutExtraProuctsSelected(requestId);

        return res.status(200).json({
            data,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener la información de los productos extra",
            error,
        })
    }
};


module.exports = {
    getCurrentCollectionRequest,
    saveCollectionRequestFirstSection,
    getExtraProducts,
    saveSecondSection,
    getLastRequestPerClient,
    getInfoAboutExtraProuctsSelected
};