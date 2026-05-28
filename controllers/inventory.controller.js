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
            imageUrl,
            color,
        } = req.body;

        const sanitize = (str) =>
            typeof str === 'string'
                ? str.replace(/[<>"'%;()&+]/g, '').trim()
                : '';

        const name = sanitize(rawName);
        const description = sanitize(rawDescription);

        const numericPrice = Number(price);
        const numericQuantity = Number(quantity);

        if (!name || price === undefined || quantity === undefined || !color) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para registrar el producto.',
            });
        }

        if (
            typeof rawName !== 'string' ||
            Number.isNaN(numericPrice) ||
            Number.isNaN(numericQuantity) ||
            typeof color !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Los datos del producto tienen un tipo inválido.',
            });
        }

        if (rawDescription !== undefined && typeof rawDescription !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'La descripción debe ser texto.',
            });
        }

        if (imageUrl !== undefined && typeof imageUrl !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'La imagen debe ser una URL válida.',
            });
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
            imageUrl,
            color,
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