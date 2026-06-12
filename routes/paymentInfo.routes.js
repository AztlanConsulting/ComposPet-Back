const express = require('express');

const router = express.Router();
const paymentInfoController = require('../controllers/paymentInfo.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para consultar la info de la ruta
router.get('/consultar-transferencia', requireRole("Cliente"), paymentInfoController.getPaymentInfo);

module.exports = router;