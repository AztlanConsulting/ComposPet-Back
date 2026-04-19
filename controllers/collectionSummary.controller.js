const CollectionRequest = require('../models/collectionRequest.model');
const bucketCostMap = require('../utils/bucketCostMap');
const Client = require('../models/client.model');
const Payment = require('../models/payment.model');

/**
 * Obtiene la información de la solicitud actual, la información
 * de los métodos de pago y el saldo del
 * 
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} req.body - Cuerpo de la solicitud.
 * @param {number} req.body.idClient - Id del cliente.
 * @param {string} req.body.weekStartDate - Fecha inicial de la semana.
 * @param {string} req.body.weekEndDate - Fecha final de la semana.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Respuesta HTTP con la solicitud encontrada o creada.
 * @throws {Error} Cuando ocurre un error inesperado al obtener la solicitud.
 */
const getSummary = async (req, res) => {

    const {
        idClient,
        weekStartDate,
        weekEndDate,
    } = req.body;

    const collectionObject = await CollectionRequest.getCurrentCollectionRequest(
        idClient, weekStartDate, weekEndDate
    );

    const productsList = await CollectionRequest.getProductsByCollection(collectionObject.id_solicitud)

    const collectionTotal = calculateCollectionTotal(collectionObject, productsList)

    const balanceObject = await Client.getClientBalance(idClient);

    const payMethods = await Payment.getPaymentInfo();

    res.status(200).json({
        success: true,
        data: {
            collection: collectionObject,
            products: productsList,
            collectionTotal,
            balance: balanceObject.saldo,
            payMethods,
        }
    });

}

const deleteProduct = async (req, res) => {

}

const updateCollectionTotal = async(req, res) => {

}

const calculateCollectionTotal = (collectionObject, productsList) => {

    const collectionCost = bucketCostMap.bucketCostMap[collectionObject.cubetas_entregadas]

    let productsCost = 0;
    for (let product of productsList){
        console.log(product)
        productsCost += product.productos_extra.precio * product.cantidad;
    }

    return productsCost + collectionCost;
}

module.exports = {
    getSummary,
    deleteProduct,
    updateCollectionTotal,
}