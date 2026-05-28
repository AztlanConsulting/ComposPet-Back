const express = require('express');

const router = express.Router();
const performanceController = require('../controllers/performance.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para consultar el saldo del cliente
router.post('/metricas', performanceController.getWebVitalMetric);

module.exports = router;