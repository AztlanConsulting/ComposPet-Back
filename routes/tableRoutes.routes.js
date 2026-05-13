const express = require('express');

const router = express.Router();
const routesController = require('../controllers/tableRoutes.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para consultar el saldo del cliente
router.get('/informacion', requireRole("Administrador"),  routesController.getTableInfo);

router.get('/semanas', requireRole("Administrador"), routesController.getAvailableWeeks);

router.get('/dias-ruta', requireRole("Administrador"), routesController.getDaysOfRoutes);

router.get('/filtrar-informacion', requireRole("Administrador"), routesController.getFilteredRoutesInfo);

module.exports = router;