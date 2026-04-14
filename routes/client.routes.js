const express = require('express');
const router = express.Router();

const clientController = require('../controllers/client.controller');

// Ruta para obtener id del cliente a partir del id del usuario
router.post('/obtener-id-cliente', clientController.getClientByUserId);

module.exports = router;