const express = require('express');

const router = express.Router();
const routesController = require('../controllers/tableRoutes.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para consultar tabla de rutas
router.get('/informacion', requireRole("Administrador"),  routesController.getTableInfo);
router.get('/informacion-editar', requireRole("Administrador"), routesController.getEditTableInfo);
router.post('/informacion-editar', requireRole("Administrador"), routesController.updateRequest);

router.get('/semanas', requireRole("Administrador"), routesController.getAvailableWeeks);

router.get('/dias-ruta', requireRole("Administrador"), routesController.getDaysOfRoutes);

router.get('/filtrar-informacion', requireRole("Administrador"), routesController.getFilteredRoutesInfo);

router.post('/mensajes-de-confirmacion', requireRole("Administrador"), routesController.generateConfirmationMessages);

router.post('/exportar-tabla-rutas', routesController.exportDailyRoutesInfo);

module.exports = router;