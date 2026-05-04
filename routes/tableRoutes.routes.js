const express = require('express');

const router = express.Router();
const routesController = require('../controllers/tableRoutes.controller');

// Ruta para consultar el saldo del cliente
router.get('/informacion', routesController.getTableInfo);

module.exports = router;