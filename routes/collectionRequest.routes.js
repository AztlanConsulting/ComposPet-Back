const express = require('express');

const router = express.Router();
const collectionRequestController = require('../controllers/collectionRequest.controller');


router.post('/form02/obtener', collectionRequestController.getCurrentCollectionRequest);
router.post('/form02/guardar', collectionRequestController.saveCollectionRequestFirstSection);

module.exports = router;