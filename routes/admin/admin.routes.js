const express = require('express');
const router = express.Router();

const createNewClientController = require('../../controllers/admin/createNewClient.controller')

// Ruta para obtener información para registrar nuevo cliente
router.get('/registrar-cliente', createNewClientController.getRegisterClient);

// Ruta para registrar nuevo cliente
router.post('/registrar-cliente', createNewClientController.postRegisterClient);

module.exports = router;