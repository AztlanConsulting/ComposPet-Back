const express = require('express');

const router = express.Router();
const collectionRequestController = require('../controllers/collectionRequest.controller');
const collectionSummaryController = require('../controllers/collectionSummary.controller');


router.post('/form02/obtener', collectionRequestController.getCurrentCollectionRequest);
router.post('/form02/guardar', collectionRequestController.saveCollectionRequestFirstSection);
router.post('/collection-summary', collectionSummaryController.getSummary);
router.delete('/collection-summary/product/:idProduct/request/:idRequest', collectionSummaryController.deleteProduct);
router.put('/collection-summary/payment', collectionSummaryController.updateCollectionTotal);

module.exports = router;