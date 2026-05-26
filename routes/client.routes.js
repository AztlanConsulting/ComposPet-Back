const express = require('express');
const router = express.Router();

const clientController = require('../controllers/client.controller');
const { requireRole } = require('../middlewares/roleAccess');

// Ruta para obtener id del cliente y el dia de ruta a partir del id del usuario
router.post('/obtener-cliente-y-ruta', requireRole("Administrador", "Cliente"), clientController.getClientByUserId);

router.get('/informacion', requireRole("Administrador"), clientController.getClientsInfo);

router.get('/estatus-composta', requireRole('Administrador'), clientController.getCompostStatus);

router.post('/modificar-estatus-composta', requireRole('Administrador'), clientController.updateCompostStatus);


module.exports = router;