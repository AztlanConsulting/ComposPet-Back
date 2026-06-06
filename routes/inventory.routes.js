const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { requireRole } = require('../middlewares/roleAccess');

const allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.svg',
    '.avif',
    '.heic',
];

const storage = multer.diskStorage({
    destination: 'uploads/products/',
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = `${crypto.randomUUID()}${extension}`;

        cb(null, safeName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});

// Ruta para agregar productos en el inventario
router.post(
    '/agregar-producto',
    requireRole('Administrador'),
    upload.single('image'),
    inventoryController.postRegisterProduct
);

// Ruta para obtener el inventario completo
router.get(
    '/obtener-inventario',
    requireRole('Administrador'),
    inventoryController.getInventory
);

module.exports = router;