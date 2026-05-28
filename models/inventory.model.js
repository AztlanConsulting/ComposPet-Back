/**
 * Modelo de acceso a datos para el módulo de inventario.
 * Encapsula todas las operaciones sobre la tabla `productos_extra`
 * relacionadas con el registro y consulta de productos.
 *
 * Todas las operaciones son realizadas mediante el cliente Prisma configurado
 * en `config/prisma`.
 *
 * @namespace Inventory
 */

const prisma = require('../config/prisma');

module.exports = class Inventory {

    /**
     * Obtiene un producto a partir de su nombre.
     *
     * @async
     * @static
     * @param {string} name - Nombre del producto.
     * @returns {Promise<Object|null>} Objeto del producto o `null` si no existe.
     */
    static async findByName(name) {
        const product = await prisma.productos_extra.findFirst({
            where: {
                nombre: name,
            },
        });

        return product;
    }

    /**
     * Obtiene el último valor de orden registrado en inventario.
     *
     * @async
     * @static
     * @returns {Promise<number>} Último orden registrado.
     */
    static async getLastOrder() {
        const lastProduct = await prisma.productos_extra.findFirst({
            orderBy: {
                orden: 'desc',
            },
            select: {
                orden: true,
            },
        });

        return lastProduct?.orden ?? 0;
    }

    /**
     * Crea un nuevo producto en la base de datos.
     * Los campos `descripcion` e `imagen_url` son opcionales.
     * El producto se registra con estatus activo por defecto
     * y se coloca al final del inventario.
     *
     * @async
     * @static
     * @param {Object} productData - Datos del producto.
     * @param {string} productData.name - Nombre del producto.
     * @param {number} productData.price - Precio del producto.
     * @param {string|null} productData.description - Descripción del producto.
     * @param {number} productData.quantity - Cantidad disponible.
     * @param {string|null} productData.imageUrl - URL de la imagen del producto.
     * @param {string} productData.color - Color asociado al producto.
     * @returns {Promise<Object>} Objeto del producto recién creado.
     */
    static async createNewProduct({
        name,
        price,
        description,
        quantity,
        imageUrl,
        color,
    }) {

        const lastOrder = await this.getLastOrder();

        const newProduct = await prisma.productos_extra.create({
            data: {
                nombre: name,
                precio: price,
                descripcion: description || null,
                cantidad: quantity,
                imagen_url: imageUrl || null,
                orden: lastOrder + 1,
                estatus: true,
                color: color,
            },
        });

        return newProduct;
    }
};