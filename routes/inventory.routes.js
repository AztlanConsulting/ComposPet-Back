const express = require('express');
const multer = require('multer');

const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { requireRole } = require('../middlewares/roleAccess');

const upload = multer({
    dest: 'uploads/products/',
    limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB
    },
});

// Ruta para agregar productos en el inventario
router.post(
    '/agregar-producto',
    requireRole("Administrador"),
    upload.single('image'),
    inventoryController.postRegisterProduct
);

// Ruta para obtener el inventario completo
router.get('/obtener-inventario', requireRole("Administrador"), inventoryController.getInventory);

module.exports = router;