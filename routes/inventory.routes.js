const express = require('express');

const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
// const { requireRole } = require('../middlewares/roleAccess');

// Ruta para agregar productos en el inventario
router.post('/agregar-producto', inventoryController.postRegisterProduct);
// router.post('/agregar-producto', requireRole("Administrador"), inventoryController.postRegisterProduct);

module.exports = router;