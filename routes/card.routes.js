const express = require('express');

const router = express.Router();
const cardController = require('../controllers/card.controller');

// Ruta para consultar el saldo del cliente
router.post('/consultar-saldo', cardController.getCardBalance);

module.exports = router;