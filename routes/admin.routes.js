const express = require('express');
const router = express.Router();

const createNewClientController = require('../controllers/admin/createNewClient.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para obtener información para registrar nuevo cliente
router.get('/registrar-cliente', requireRole("Administrador"), createNewClientController.getRegisterClient);

// Ruta para registrar nuevo cliente
router.post('/registrar-cliente', requireRole("Administrador"), createNewClientController.postRegisterClient);

module.exports = router;