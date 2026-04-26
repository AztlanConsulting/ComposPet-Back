const express = require('express');

const router = express.Router();
const creditController = require('../controllers/credit.controller');

// Ruta para consultar el saldo del cliente
router.post('/consultar-saldo', creditController.getCreditBalance);

module.exports = router;