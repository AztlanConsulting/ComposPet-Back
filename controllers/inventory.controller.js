const Inventory = require('../models/inventory.model');

/**
 * Controlador para registrar un nuevo producto en el inventario.
 * 
 * @async 
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @return {JSON} Respuesta JSON con el resultado de la operación.
 * @throws {Error} Cuando ocurre un error inesperado al registrar el producto.
 * El controlador realiza las siguientes validaciones:
 * - Verifica que los campos requeridos estén presentes.
 * - Valida que los tipos de datos sean correctos.
 * - Sanitiza los campos de texto para prevenir inyección de código.
 * - Verifica que no exista un producto con el mismo nombre registrado.
 * Si todas las validaciones pasan, crea el nuevo producto en la base de datos
 * y responde con un mensaje de éxito.
 */
const postRegisterProduct = async (req, res) => {
    try {
        const {
            name: rawName,
            price,
            description: rawDescription,
            quantity,
            color,
        } = req.body || {};

        const imageFile = req.file || null;

        const sanitize = (str) =>
            typeof str === 'string'
                ? str.replace(/[<>"'%;()&+]/g, '').trim()
                : '';

        const containsEmoji = (str) =>
            /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu.test(str);

        const validNameRegex = /^[\p{L}\p{N}\s]+$/u;
        const validDescriptionRegex = /^[\p{L}\p{N}\s.,;:()\-]+$/u;
        const hexColorRegex = /^#([A-Fa-f0-9]{6})$/;
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

        const name = sanitize(rawName);
        const description = sanitize(rawDescription);
        const cleanColor = typeof color === 'string' ? color.trim() : '';

        const numericPrice = Number(price);
        const priceRegex = /^\d+(\.\d{1,2})?$/;
        const numericQuantity = Number(quantity);

        if (!rawName || price === undefined || quantity === undefined || !color) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para registrar el producto.',
            });
        }

        if (
            typeof rawName !== 'string' ||
            typeof color !== 'string' ||
            Number.isNaN(numericPrice) ||
            Number.isNaN(numericQuantity)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Los datos del producto tienen un tipo inválido.',
            });
        }

        if (!name || !cleanColor) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para registrar el producto.',
            });
        }

        if (!validNameRegex.test(name)) {
            return res.status(400).json({
                success: false,
                message: 'El nombre contiene caracteres inválidos.',
            });
        }

        if (rawDescription !== undefined && typeof rawDescription !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'La descripción debe ser texto.',
            });
        }

        if (
            description &&
            !validDescriptionRegex.test(description)
        ) {
            return res.status(400).json({
                success: false,
                message: 'La descripción contiene caracteres inválidos.',
            });
        }

        if (name.length > 60) {
            return res.status(400).json({
                success: false,
                message: 'El nombre excede la longitud permitida.',
            });
        }

        if (description && description.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'La descripción excede la longitud permitida.',
            });
        }

        if (containsEmoji(name)) {
            return res.status(400).json({
                success: false,
                message: 'El nombre no puede contener emojis.',
            });
        }

        if (description && containsEmoji(description)) {
            return res.status(400).json({
                success: false,
                message: 'La descripción no puede contener emojis.',
            });
        }

        if (!priceRegex.test(String(price))) {
            return res.status(400).json({
                success: false,
                message: 'El precio solo puede tener hasta 2 decimales.',
            });
        }
        
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio es inválido.',
            });
        }
        
        if (numericPrice > 100000) {
            return res.status(400).json({
                success: false,
                message: 'El precio no puede exceder $100,000.00.',
            });
        }

        if (!Number.isInteger(numericQuantity) || numericQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad es inválida.',
            });
        }
        
        if (numericQuantity > 999) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad no puede ser mayor a 999.',
            });
        }

        if (!hexColorRegex.test(cleanColor)) {
            return res.status(400).json({
                success: false,
                message: 'El color es inválido.',
            });
        }

        if (imageFile) {
            if (!allowedImageTypes.includes(imageFile.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'La imagen debe ser JPG, PNG o WEBP.',
                });
            }

            if (imageFile.size > MAX_IMAGE_SIZE) {
                return res.status(400).json({
                    success: false,
                    message: 'La imagen no puede exceder 2 MB.',
                });
            }
        }

        const existingProduct = await Inventory.findByName(name);

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un producto registrado con este nombre.',
            });
        }

        const newProduct = await Inventory.createNewProduct({
            name,
            price: numericPrice,
            description,
            quantity: numericQuantity,
            imageUrl: imageFile ? imageFile.path : null,
            color: cleanColor,
        });

        return res.status(201).json({
            success: true,
            message: 'Producto registrado exitosamente.',
            data: {
                productId: newProduct.id_producto,
                name: newProduct.nombre,
                price: newProduct.precio,
                quantity: newProduct.cantidad,
                color: newProduct.color,
                status: newProduct.estatus,
                deleted: newProduct.deleted,
                imageUrl: newProduct.imagen_url,
            },
        });

    } catch (error) {
        console.error('Error en postRegisterProduct:', error);

        return res.status(500).json({
            success: false,
            message: 'Error del servidor al registrar un producto',
        });
    }
};

module.exports = {
    postRegisterProduct,
};