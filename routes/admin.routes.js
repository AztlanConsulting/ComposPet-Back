const express = require('express');
const router = express.Router();

const createNewClientController = require('../controllers/admin/createNewClient.controller')
const clientController = require('../controllers/client.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para obtener información para registrar nuevo cliente
router.get('/registrar-cliente', requireRole("Administrador"), createNewClientController.getRegisterClient);

// Ruta para registrar nuevo cliente
router.post('/registrar-cliente', requireRole("Administrador"), createNewClientController.postRegisterClient);

// Ruta para obtener la información necesaria para aactualizar un cliente
router.get('/actualizar-cliente', requireRole("Administrador"), clientController.getRoutes);

// Ruta para modificar la información de un cliente
router.post('/actualizar-cliente', requireRole("Administrador"), clientController.updateClient);

module.exports = router;