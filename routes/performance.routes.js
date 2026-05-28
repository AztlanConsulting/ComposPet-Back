const express = require('express');

const router = express.Router();
const performanceController = require('../controllers/performance.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para manejar las métricas de Web Vitals de performance
router.post('/metricas', performanceController.getWebVitalMetric);

module.exports = router;