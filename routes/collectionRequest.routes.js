const express = require('express');

const router = express.Router();
const collectionRequestController = require('../controllers/collectionRequest.controller');
const collectionSummaryController = require('../controllers/collectionSummary.controller');


router.post('/form02/obtener', collectionRequestController.getCurrentCollectionRequest);
router.post('/form02/guardar', collectionRequestController.saveCollectionRequestFirstSection);
router.post('/collection-summary', collectionSummaryController.getSummary);
router.delete('/collection-summary/product/:idProduct/request/:idRequest', collectionSummaryController.deleteProduct);
router.put('/collection-summary/payment', collectionSummaryController.updateCollectionTotal);

// Ruta que obtiene la solicitud de recolección actual del cliente para la semana indicada
router.get('/form04/obtener', collectionRequestController.getExtraProducts);

// Rute que guarda la segunda parte del formulario
router.post('/form04/guardar', collectionRequestController.saveSecondSection);

// Ruta que obtiene el id de la última solicitud que hizo
router.post('/ultimaSolicitud', collectionRequestController.getLastRequestPerClient);

// Ruta que obtiene la información de los productos que previamente solicito el usuario.
router.post('/form03/obtenerInfo', collectionRequestController.getInfoAboutExtraProuctsSelected);

module.exports = router;