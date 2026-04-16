const express = require('express');

const router = express.Router();
const collectionRequestController = require('../controllers/collectionRequest.controller');
const collectionSummaryController = require('../controllers/collectionSummary.controller');


router.post('/form02/obtener', collectionRequestController.getCurrentCollectionRequest);
router.post('/form02/guardar', collectionRequestController.saveCollectionRequestFirstSection);
router.get('/collection-summary', collectionSummaryController.getSummary);
router.delete('/collection-summary/product/:idProduct', collectionSummaryController.deleteProduct);
router.put('/collection/payment', collectionSummaryController.updateCollectionTotal);

module.exports = router;