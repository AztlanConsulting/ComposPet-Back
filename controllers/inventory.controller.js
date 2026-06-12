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
const Inventory = require('../models/inventory.model');
const fs = require('fs/promises');
const path = require('path');

const { getFileTypeFromFile } = require('../utils/fileType.utils');

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg', 'image/png', 'image/webp',
    'image/avif', 'image/heic', 'image/svg+xml',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.svg'];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const DEFAULT_IMAGE = 'uploads/products/default-product.png';

const sanitize = (str) =>
    typeof str === 'string' ? str.replace(/[<>"'%;()&+]/g, '').trim() : '';

const containsEmoji = (str) =>
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu.test(str);


/**
 * Valida y sanitiza los campos de texto/numéricos del producto.
 * @param {Object} fields - Campos crudos del req.body
 * @param {boolean} isUpdate - Si es true, los campos son opcionales
 * @returns {{ data, error }}
 */
const validateProductFields = (fields, isUpdate = false) => {
    const { name: rawName, price, description: rawDescription, quantity, color } = fields;

    const validNameRegex       = /^[\p{L}\p{N}\s.()\-]+$/u;
    const validDescriptionRegex = /^[\p{L}\p{N}\s.,;:()\-]+$/u;
    const hexColorRegex        = /^#([A-Fa-f0-9]{6})$/;
    const priceRegex           = /^\d+(\.\d{1,2})?$/;

    const hasName     = rawName     !== undefined;
    const hasPrice    = price       !== undefined;
    const hasQuantity = quantity    !== undefined;
    const hasColor    = color       !== undefined;

    if (!isUpdate && (!hasName || !hasPrice || !hasQuantity || !hasColor)) {
        return { error: 'Faltan datos requeridos para registrar el producto.' };
    }

    // Tipos
    if (hasName  && typeof rawName !== 'string') return { error: 'Los datos del producto tienen un tipo inválido.' };
    if (hasColor && typeof color   !== 'string') return { error: 'Los datos del producto tienen un tipo inválido.' };
    if (hasPrice    && isNaN(Number(price)))         return { error: 'Los datos del producto tienen un tipo inválido.' };
    if (hasQuantity && isNaN(Number(quantity)))      return { error: 'Los datos del producto tienen un tipo inválido.' };

    const name        = hasName  ? sanitize(rawName)  : undefined;
    const description = sanitize(rawDescription);
    const cleanColor  = hasColor ? color.trim()       : undefined;

    // Nombre
    if (hasName) {
        if (!name) return { error: 'Faltan datos requeridos para registrar el producto.' };
        if (!validNameRegex.test(name))  return { error: 'El nombre contiene caracteres inválidos.' };
        if (name.length > 60)            return { error: 'El nombre excede la longitud permitida.' };
        if (containsEmoji(name))         return { error: 'El nombre no puede contener emojis.' };
    }

    // Descripción
    if (rawDescription !== undefined) {
        if (typeof rawDescription !== 'string') return { error: 'La descripción debe ser texto.' };
        if (description && !validDescriptionRegex.test(description)) return { error: 'La descripción contiene caracteres inválidos.' };
        if (description.length > 255)           return { error: 'La descripción excede la longitud permitida.' };
        if (containsEmoji(description))         return { error: 'La descripción no puede contener emojis.' };
    }

    // Precio
    if (hasPrice) {
        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice) || numericPrice < 0) return { error: 'El precio es inválido.' };
        if (!priceRegex.test(String(price)))    return { error: 'El precio solo puede tener hasta 2 decimales.' };
        if (numericPrice > 100000)              return { error: 'El precio no puede exceder $100,000.00.' };
    }

    // Cantidad
    if (hasQuantity) {
        const numericQuantity = Number(quantity);
        if (!Number.isInteger(numericQuantity) || numericQuantity < 0) return { error: 'La cantidad es inválida.' };
        if (numericQuantity > 999) return { error: 'La cantidad no puede ser mayor a 999.' };
    }

    // Color
    if (hasColor) {
        if (!hexColorRegex.test(cleanColor)) return { error: 'El color es inválido.' };
    }

    return {
        data: {
            ...(name        !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(hasPrice    && { price: Number(price) }),
            ...(hasQuantity && { quantity: Number(quantity) }),
            ...(cleanColor  !== undefined && { color: cleanColor }),
        },
    };
};

/**
 * Valida el archivo de imagen subido.
 * @param {Object} imageFile - req.file de multer
 * @returns {{ imageUrl, error }}
 */
const validateAndResolveImage = async (imageFile) => {
    const extension = path.extname(imageFile.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        await fs.unlink(imageFile.path).catch(() => {});
        return { error: 'La extensión de la imagen no es válida.' };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.mimetype)) {
        await fs.unlink(imageFile.path).catch(() => {});
        return { error: 'La imagen debe ser JPG, JPEG, SVG, AVIF, HEIC, PNG o WEBP.' };
    }

    if (imageFile.size > MAX_IMAGE_SIZE) {
        await fs.unlink(imageFile.path).catch(() => {});
        return { error: 'La imagen no puede exceder 2 MB.' };
    }

    if (extension !== '.svg') {
        const detectedFileType = await getFileTypeFromFile(imageFile.path);
        if (!detectedFileType || !ALLOWED_IMAGE_TYPES.includes(detectedFileType.mime)) {
            await fs.unlink(imageFile.path).catch(() => {});
            return { error: 'El contenido del archivo no corresponde a una imagen válida.' };
        }
    }

    return { imageUrl: imageFile.path.replace(/\\/g, '/') };
};

const postRegisterProduct = async (req, res) => {
    try {
        const { data, error } = validateProductFields(req.body ?? {}, false);
        if (error) return res.status(400).json({ success: false, message: error });

        let imageUrl = DEFAULT_IMAGE;
        if (req.file) {
            const result = await validateAndResolveImage(req.file);
            if (result.error) return res.status(400).json({ success: false, message: result.error });
            imageUrl = result.imageUrl;
        }

        const existingProduct = await Inventory.findByName(data.name);
        if (existingProduct) {
            if (req.file) await fs.unlink(req.file.path).catch(() => {});
            return res.status(409).json({ success: false, message: 'Ya existe un producto registrado con este nombre.' });
        }

        const newProduct = await Inventory.createNewProduct({ ...data, imageUrl });

        return res.status(201).json({
            success: true,
            message: 'Producto registrado exitosamente.',
            data: {
                productId: newProduct.id_producto,
                name:      newProduct.nombre,
                price:     newProduct.precio,
                quantity:  newProduct.cantidad,
                color:     newProduct.color,
                status:    newProduct.estatus,
                deleted:   newProduct.deleted,
                imageUrl:  newProduct.imagen_url,
            },
        });
    } catch (error) {
        console.error('Error en postRegisterProduct:', error);
        return res.status(500).json({ success: false, message: 'Error del servidor al registrar un producto', error: error.message });
    }
};

/**
 * Controlador para obtener los productos extra del inventario.
 * 
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @return {JSON} Respuesta JSON con el listado de productos extra del inventario.
 * @throws {Error} Cuando ocurre un error inesperado al consultar el inventario.
 * 
 * El controlador realiza las siguientes acciones:
 * - Solicita al modelo la consulta de productos extra registrados.
 * - Obtiene únicamente productos activos/no eliminados.
 * - Retorna la información obtenida en formato JSON.
 * - Registra errores internos en consola para fines de depuración.
 * 
 * Si la consulta se ejecuta correctamente, responde con el listado
 * de productos extra y un mensaje de éxito.
 */
const getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.getInventory();

        return res.status(200).json({
            success: true,
            message: 'Inventario obtenido exitosamente.',
            data: inventory.map(item => ({
                productId: item.id_producto,
                name: item.nombre,
                price: item.precio,
                description: item.descripcion,
                quantity: item.cantidad,
                color: item.color,
                status: item.estatus,
                imageUrl: item.imagen_url,
            })),
        });
    }catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener el inventario',
        });
    }
}


/**
 * Controlador para modificar el estatus de un producto extra del inventario.
 * 
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @return {JSON} Respuesta JSON con success.
 * @throws {Error} Cuando ocurre un error inesperado al modificar el producto extra.
 */
const changeProductVisibility = async (req, res) => {
    try {
        const data = req.body;
        await Inventory.changeProductVisibility(data.productId, data.newStatus);
        
        return res.status(200).json({
            success: true,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al modificar la visibilidad del producto',
        });
    }
}

/**
 * Controlador para eliminar un producto del catálogo.
 * 
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @return {JSON} Respuesta JSON con success.
 * @throws {Error} Cuando ocurre un error inesperado al eliminar el producto.
 */
const deleteProduct = async (req, res) => {
    try {
        const data = req.body;
        await Inventory.deleteProduct(data.productId);

        return res.status(200).json({
            success: true,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el producto',
        })
    }
}

/**
 * Controlador para modificar un producto del catálogo.
 * 
 * @async
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @return {JSON} Respuesta JSON con success.
 * @throws {Error} Cuando ocurre un error inesperado al modificar el producto.
 */
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ success: false, message: 'Falta el ID del producto.' });

        // Solo valida los campos que lleguen (isUpdate = true)
        const { data, error } = validateProductFields(req.body, true);
        if (error) return res.status(400).json({ success: false, message: error });

        if (req.file) {
            const result = await validateAndResolveImage(req.file);
            if (result.error) return res.status(400).json({ success: false, message: result.error });
            data.imageUrl = result.imageUrl;
        }

        await Inventory.updateProduct({ productId, ...data });

        return res.status(200).json({ success: true, message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        console.error('Error en updateProduct:', error);
        return res.status(500).json({ success: false, message: 'Error al modificar producto' });
    }
};

module.exports = {
    postRegisterProduct,
    getInventory,
    changeProductVisibility,
    deleteProduct,
    updateProduct,
};