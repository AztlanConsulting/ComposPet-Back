const express = require('express');
const router = express.Router();

const clientController = require('../controllers/client.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para obtener id del cliente a partir del id del usuario
router.post('/obtener-id-cliente', requireRole("Administrador", "Cliente"), clientController.getClientByUserId);
router.get('/informacion', requireRole("Administrador"), clientController.getClientsInfo);

module.exports = router;