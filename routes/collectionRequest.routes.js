const express = require('express');

const router = express.Router();
const collectionRequestController = require('../controllers/collectionRequest.controller');
const collectionSummaryController = require('../controllers/collectionSummary.controller');
const { requireRole } = require('../middlewares/roleAccess');


router.post('/form02/obtener', requireRole("Cliente"), collectionRequestController.getCurrentCollectionRequest);
router.post('/form02/guardar', requireRole("Cliente"), collectionRequestController.saveCollectionRequestFirstSection);
router.post('/resumen-recoleccion', requireRole("Cliente") ,collectionSummaryController.getSummary);
router.delete('/resumen-recoleccion/producto/:idProduct/solicitud/:idRequest/:quantity', requireRole("Cliente"), collectionSummaryController.deleteProduct);
router.put('/resumen-recoleccion/pago', requireRole("Cliente"), collectionSummaryController.updateCollectionTotal);

// Ruta que obtiene la solicitud de recolección actual del cliente para la semana indicada
router.get('/form04/obtener', requireRole("Cliente"), collectionRequestController.getExtraProducts);

// Rute que guarda la segunda parte del formulario
router.post('/form04/guardar', requireRole("Cliente"), collectionRequestController.saveSecondSection);

// Ruta que obtiene el id de la última solicitud que hizo
router.post('/ultimaSolicitud', requireRole("Cliente"), collectionRequestController.getLastRequestPerClient);

// Ruta que obtiene la información de los productos que previamente solicito el usuario.
router.post('/form03/obtenerInfo', requireRole("Cliente"), collectionRequestController.getInfoAboutExtraProuctsSelected);

module.exports = router;