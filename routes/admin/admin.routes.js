const express = require('express');
const router = express.Router();

const adminController = require('../../controllers/admin/admin.controller');

// Ruta para obtener información para registrar nuevo cliente
router.get('/registrar-cliente', adminController.getRegisterClient);

module.exports = router;