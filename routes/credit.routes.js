const express = require('express');

const router = express.Router();
const creditController = require('../controllers/credit.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para consultar el saldo del cliente
router.post('/consultar-saldo', requireRole("Administrador", "Cliente"), creditController.getCreditBalance);

module.exports = router;