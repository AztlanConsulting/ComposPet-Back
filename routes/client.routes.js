const express = require('express');
const router = express.Router();

const clientController = require('../controllers/client.controller');

// Ruta para obtener id del cliente y el dia de ruta a partir del id del usuario
router.post('/obtener-cliente-y-ruta', clientController.getClientByUserId);

router.get('/informacion', clientController.getClientsInfo);


module.exports = router;