/**
 * Modelo de acceso a datos para el módulo de solicitudes de recolección
 * Encapsula todas las operaciones sobre la tabla `solicitud_recoleccion` y `bitacora`
 * relacionadas con el flujo del formulario de recolección,
 * de la tabla de solicitudes de recolección y la auditoría necesaria
 *
 * Todas las operaciones son realizadas mediante el cliente Prisma configurado
 * en `config/prisma`
 *
 * @namespace CollectionRequest
 */

const prisma = require("../config/prisma");

const bucketCostMap = require('../utils/bucketCostMap');

module.exports = class CollectionRequest {

    /**
     * Obtiene la solicitud de recolección actual del cliente dentro del rango
     * de fechas correspondiente a la semana consultada.
     *
     * @async
     * @static
     * @param {string} clientId - Id del cliente.
     * @param {string} weekStartDate - Fecha inicial del rango semanal.
     * @param {string} weekEndDate - Fecha final del rango semanal.
     * @returns {Promise<Object|null>} La solicitud encontrada o `null` si no existe.
     */
    static async getCurrentCollectionRequest(clientId, weekStartDate, weekEndDate) {

        // Busca la solicitud del cliente dentro del rango semanal solicitado.
        const currentCollectionRequest = await prisma.solicitudes_recoleccion.findFirst({
            where: {
                id_cliente: clientId,
                fecha: {
                    gte: new Date(weekStartDate),
                    lte: new Date(weekEndDate),
                },
            },
        });

        // Si ya existe una solicitud dentro del rango semanal, se retorna
        return currentCollectionRequest;
    }

    /**
     * Crea una solicitud de recolección inicial con valores por defecto
     * para el FORM-02-03.
     *
     * @async
     * @static
     * @param {string} clientId - Id del cliente.
     * @returns {Promise<Object>} La solicitud inicial creada.
     */
    static async createInitialCollectionRequest(clientId) {

        // Genera una solicitud para que el cliente pueda continuar el flujo del formulario.
        const newCollectionRequest = await prisma.solicitudes_recoleccion.create({
            data: {
                cliente: {
                    connect: {
                    id_cliente: clientId,
                    },
                },
                cubetas_recolectadas: 0,
                cubetas_entregadas: 0,
                total_a_pagar: 0,
                total_pagado: 0,
                fecha: new Date(),
                notas: null,
                quiere_recoleccion: true,
                quiere_productos_extra: true,
                estatus: false,
            },
        });

        return newCollectionRequest;
    }

    /**
     * Guarda la información correspondiente a la primera sección
     * del formulario de solicitud de recolección.
     *
     * @async
     * @static
     * @param {Object} firstSectionData - Datos de la primera sección.
     * @param {number} firstSectionData.requestId - Id de la solicitud.
     * @param {boolean} firstSectionData.wantsCollection - Indica si el cliente desea recolección.
     * @param {boolean} firstSectionData.wantsExtraProducts - Indica si el cliente desea productos extra.
     * @param {number} firstSectionData.collectedBuckets - Cantidad de cubetas que el cliente entregará.
     * @param {number} firstSectionData.deliveredBuckets - Cantidad de cubetas vacías solicitadas.
     * @returns {Promise<Object>} La solicitud actualizada.
     */
    static async saveCollectionRequestFirstSection({
        requestId,
        wantsCollection,
        wantsExtraProducts,
        collectedBuckets,
        deliveredBuckets,
    }) {
        // Actualiza los campos capturados en la primera sección del formulario.
        return await prisma.solicitudes_recoleccion.update({
            where: {
                id_solicitud: requestId,
            },
            data: {
                quiere_recoleccion: wantsCollection,
                quiere_productos_extra: wantsExtraProducts,
                cubetas_recolectadas: collectedBuckets,
                cubetas_entregadas: deliveredBuckets,
            },
        });
    }

    /**
     * Obtiene los productos extra asociados a una solicitud de recolección.
     *
     * @async
     * @static
     * @param {string} idCollection - Id de la recolección.
     * @returns {Promise<Object|null>} Lista con los objetos de los productos extra.
     */
    static async getProductsByCollection(idCollection){
        return await prisma.productos_solicitud.findMany({
            where: {
                id_solicitud: idCollection,
            },
            include: {
                productos_extra: true,
            }
        });
    }
    /*
     * Obtiene todos los productos extra que están activos
     * en la base de datos.
     *
     * @async
     * @function getExtraProducts
     * @returns {Array<Object>} Lista de productos extra disponibles
     */
    static async getExtraProducts() {
        const extraProducts = await prisma.productos_extra.findMany({
            where: {
                estatus: true,
            },
            orderBy:{
                orden: 'asc',
            },
            select: {
                id_producto: true,
                nombre: true,
                precio: true,
                descripcion: true,
                cantidad: true,
                imagen_url: true,
                estatus: true,
                color: true,
            }
        });

        if (!extraProducts || extraProducts.length === 0) {
            throw new Error('PRODUCTOS_EXTRA_NO_ENCONTRADOS');
        }

        return extraProducts;
    };

    /**
     * Guarda la segunda sección de la solicitud de recolección.
     *
     * Flujo:
     * 1. Verifica que la solicitud exista
     * 2. Elimina productos previamente guardados
     * 3. Registra la nueva selección de productos
     *
     * @async
     * @function saveSecondSection
     * @param {string} requestID - ID de la solicitud de recolección
     * @param {Array<Object>} products - Lista de productos seleccionados
     * @param {number} products[].id_producto - ID del producto
     * @param {number} products[].cantidad - Cantidad seleccionada
     * @returns {Object} Mensaje de confirmación del guardado
     */
    static async saveSecondSection(requestID, products) {
        const requestSecondSection = await prisma.solicitudes_recoleccion.findUnique({
            where: { id_solicitud: requestID }
        });

        if (!requestSecondSection) {
            throw new Error('Solicitud no encontrada');
        }

        const deleteProductsRequest = await prisma.productos_solicitud.deleteMany({
            where: { id_solicitud: requestID }
        });

        for (const product of products) {
            await prisma.productos_solicitud.create({
                data: {
                    id_solicitud: requestID,
                    id_producto: product.id_producto,
                    fecha: new Date(),
                    cantidad: product.cantidad,
                }
            });
        }

        return { message: 'Productos guardados correctamente' };
    }

     /**
     * Obtiene el id de la última solicitud creada por el usuario
     *
     * @param {number} idClient - ID del cliente
     * @returns {request} Id de la última solicitud
     * creada por el usuario
     * */
    static async getLastRequestPerClient(idClient) {
        return await prisma.solicitudes_recoleccion.findFirst({
            where: {
                id_cliente : idClient
            },
            orderBy: {
                fecha: 'desc'
            },
            select: {
                id_solicitud: true
            }
            });
    }

    /**
     * Obtiene los productos extra previamente seleccionados
     * para una solicitud específica.
     *
     * @async
     * @function getInfoAboutExtraProuctsSelected
     * @param {string} requestID - ID de la solicitud
     * @returns {Array<Object>} Lista de productos seleccionados con su cantidad
     */
    static async getInfoAboutExtraProuctsSelected(requestID){
        return await prisma.productos_solicitud.findMany({
            where:{
                id_solicitud: requestID,
            },
            select: {
                id_producto: true,
                cantidad: true,
            }
        });
    }

    static async getById(idRequest) {
        return await prisma.solicitudes_recoleccion.findUnique({
            where: {
                id_solicitud: idRequest,
            }
        })
    }

    static async deleteProduct(idProduct, idRequest) {
        return await prisma.productos_solicitud.deleteMany({
            where: {
                id_solicitud: idRequest,
                id_producto: idProduct,
            }
        })
    }

    static async updateCollectionTotal(idRequest, collectionTotal, idPayment, notes) {
        return await prisma.$transaction(async (tx) => {

            const payForm = await tx.formas_pago.findUnique({
                where: {
                    id_pago: idPayment,
                },
                select: {
                    tipo: true,
                },
            });

            const currentRequest = await tx.solicitudes_recoleccion.findUnique({
                where: {
                    id_solicitud: idRequest,
                },
                select: {
                    id_cliente: true,
                    total_pagado: true,
                    total_a_pagar: true,
                },
            });

            let amountToDiscount = 0;

            if (payForm?.tipo === "Saldo") {

                amountToDiscount =
                    collectionTotal - (currentRequest.total_pagado || 0);

                await tx.saldo.update({
                    where: {
                        id_cliente: currentRequest.id_cliente,
                    },
                    data: {
                        saldo: {
                            decrement: amountToDiscount,
                        },
                    },
                });
            }

            const updateData = {
                total_a_pagar: collectionTotal,
                notas: notes,
                estatus: true,
                formas_pago: {
                    connect: {
                        id_pago: idPayment,
                    },
                },
            };

            if (payForm?.tipo === "Saldo") {
                updateData.total_pagado = collectionTotal;
            }

            const updatedRequest = await tx.solicitudes_recoleccion.update({
                where: {
                    id_solicitud: idRequest,
                },
                data: updateData,
            });

            return updatedRequest;
        });
    }
    /**
     * Actualiza el atributo que indica si la solicitud
     * incluye productos extra.
     *
     * @async
     * @function updateWantsRequestAttribute
     * @param {string} requestID - ID de la solicitud
     * @param {boolean} value - Valor a asignar al atributo quiere_productos_extra
     */
    static async updateWantsRequestAttribute(requestID, value){
        return await prisma.solicitudes_recoleccion.update({
            where:{
                id_solicitud: requestID
            },
            data: {
                quiere_productos_extra: value
            }
        })
    }

    /**
     * Descuenta inventario de un producto extra.
     *
     * @async
     * @function substractInventory
     * @param {Object} product - Producto a actualizar
     * @param {number} product.id_producto - ID del producto
     * @param {number} product.cantidad - Cantidad a descontar
     */
    static async substractInventory(product){
        return await prisma.productos_extra.update({
            where : { id_producto : product.id_producto},
            data: {
                cantidad:{
                    decrement: product.cantidad
                }
            }
        })
    }

    /**
     * Regresa inventario de un producto extra.
     *
     * @async
     * @function incrementInventory
     * @param {Object} product - Producto a actualizar
     * @param {number} product.id_producto - ID del producto
     * @param {number} product.cantidad - Cantidad a incrementar
     */
    static async incrementInventory(product){
        return await prisma.productos_extra.update({
            where: { id_producto: product.id_producto},
            data: {
                cantidad: {
                    increment: product.cantidad
                }
            }
        })
    }

    static async updateRequest(requestData, productsData) {

        try {
        return await prisma.$transaction(async (tx) => {

            const requestId = requestData.id_solicitud;

            const productsIds = productsData.map(
                product => product.id_producto
            );

            const productsInfo = await tx.productos_extra.findMany({
                where: {
                    id_producto: {
                        in: productsIds,
                    },
                },
                select: {
                    id_producto: true,
                    precio: true,
                },
            });

            const priceMap = new Map(
                productsInfo.map(product => [
                    product.id_producto,
                    product.precio,
                ])
            );

            const collectionCost = bucketCostMap[requestData.cubetas_entregadas] || 0;
            const productsCost = productsData.reduce(
                (total, product) => {
                    const price = priceMap.get(product.id_producto) || 0;

                    return total + (price * product.cantidad);
                },
                0
            );

            const totalToPay = collectionCost + productsCost;

            let scheduleDate = requestData.horario
                ? new Date(`1970-01-01T${requestData.horario}:00Z`)
                : null;

            if(Number.isNaN(scheduleDate.valueOf())){
                scheduleDate = null;    
            }

            const currentRequest = await tx.solicitudes_recoleccion.findUnique({
                where: {
                    id_solicitud: requestId,
                },
                include: {
                    productos_solicitud: true,
                },
            });

            if (!currentRequest) {
                throw new Error("Solicitud no encontrada");
            }
            const updatedRequest = await tx.solicitudes_recoleccion.update({
                where: {
                    id_solicitud: requestId,
                },
                data: {
                    cubetas_recolectadas:
                        requestData.cubetas_recolectadas,

                    cubetas_entregadas:
                        requestData.cubetas_entregadas,

                    notas:
                        requestData.notas,

                    total_pagado:
                        Number(requestData.total_pagado),

                    total_a_pagar:
                        totalToPay,

                    quiere_productos_extra:
                        requestData.quiere_productos_extra,

                    quiere_recoleccion:
                        requestData.quiere_recoleccion,

                    id_pago:
                        requestData.id_pago,

                    horario:
                        scheduleDate,
                },
            });

            const oldProductsMap = new Map(
                currentRequest.productos_solicitud.map(product => [
                    product.id_producto,
                    product.cantidad
                ])
            );

            const newProductsMap = new Map(
                productsData.map(product => [
                    product.id_producto,
                    product.cantidad
                ])
            );

            const allIds = new Set([
                ...oldProductsMap.keys(),
                ...newProductsMap.keys(),
            ]);

            for (const productId of allIds) {

                const oldQty = oldProductsMap.get(productId) || 0;
                const newQty = newProductsMap.get(productId) || 0;

                const difference = newQty - oldQty;

                if (difference > 0) {
                    await tx.productos_extra.update({
                        where: {
                            id_producto: productId,
                        },
                        data: {
                            cantidad: {
                                decrement: difference,
                            },
                        },
                    });
                }

                if (difference < 0) {
                    await tx.productos_extra.update({
                        where: {
                            id_producto: productId,
                        },
                        data: {
                            cantidad: {
                                increment: Math.abs(difference),
                            },
                        },
                    });
                }
            }

            await tx.productos_solicitud.deleteMany({
                where: {
                    id_solicitud: requestId,
                },
            });

            if (productsData.length > 0) {
                await tx.productos_solicitud.createMany({
                    data: productsData.map(product => ({
                        id_solicitud: requestId,
                        id_producto: product.id_producto,
                        cantidad: product.cantidad,
                        fecha: new Date(),
                    })),
                });
            }

            return updatedRequest;
        });
    } catch (error){
        console.error(error);
        throw new Error('Error al actualizar la solicitud de recolección');
    }
    } 
};