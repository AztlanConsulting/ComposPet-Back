const express = require('express');
const router = express.Router();

const createNewClientController = require('../../controllers/admin/createNewClient.controller')

// Ruta para obtener información para registrar nuevo cliente
router.get('/registrar-cliente', createNewClientController.getRegisterClient);

// Ruta para registrar nuevo cliente
router.post('/registrar-cliente', createNewClientController.postRegisterClient);

// Ruta para obtener la información necesaria para aactualizar un cliente
router.get('/actualizar-cliente');

// Ruta para modificar la información de un cliente
router.post('/actualizar-cliente')

module.exports = router;