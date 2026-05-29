const express = require('express');

const router = express.Router();
const performanceController = require('../controllers/performance.controller');

// Ruta para manejar las métricas de Web Vitals de performance
router.post('/metricas', performanceController.registerWebVitalMetric);

module.exports = router;