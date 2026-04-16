const express = require('express');

const router = express.Router();
const collectionRequestController = require('../controllers/collectionRequest.controller');


router.post('/form02/obtener', collectionRequestController.getCurrentCollectionRequest);
router.post('/form02/guardar', collectionRequestController.saveCollectionRequestFirstSection);

// Ruta que obtiene la solicitud de recolección actual del cliente para la semana indicada
router.get('/form04/obtener', collectionRequestController.getExtraProducts);

router.post('/form04/guardar', collectionRequestController.saveSecondSection);

router.post('/ultimaSolicitud', collectionRequestController.getLastRequestPerClient);

router.post('/form03/obtenerInfo', collectionRequestController.getInfoAboutExtraProuctsSelected);

module.exports = router;