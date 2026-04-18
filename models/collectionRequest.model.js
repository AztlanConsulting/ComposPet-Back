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

module.exports = class CollectionRequest {

    /**
     * Obtiene la solicitud de recolección actual del cliente dentro del rango
     * de fechas correspondiente a la semana consultada.
     *
     * @async
     * @static
     * @param {number} clientId - Id del cliente.
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
     * @param {number} clientId - Id del cliente.
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
                quiere_recoleccion: false,
                quiere_productos_extra: false,
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
    static async getExtraProducts() {
        const extraProducts = await prisma.productos_extra.findMany({
            where: {
                estatus: 'true',
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
            }
        });

        if (!extraProducts || extraProducts.length === 0) {
            throw new Error('PRODUCTOS_EXTRA_NO_ENCONTRADOS');
        }

        return extraProducts;
    };

    static async saveSecondSection(requestID, products) {
        console.log("PRODUCTS: ", products)
        const requestSecondSection = await prisma.solicitudes_recoleccion.findUnique({
            where: { id_solicitud: requestID }
        });

        if (!requestSecondSection) {
            throw new Error('Solicitud no encontrada');
        }

        const deleteProductsRequest = await prisma.productos_solicitud.deleteMany({
            where: { id_solicitud: requestID }
        });
        console.log("deleteProductsRequest", deleteProductsRequest);

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

    // Le sirve a Juan para la primera
    // static async cancelarSolicitud(idSolicitud) {
    //     const solicitud = await prisma.solicitudes_recoleccion.findUnique({
    //         where: { id_solicitud: idSolicitud }
    //     });

    //     if (!solicitud) {
    //         throw new Error('Solicitud no encontrada');
    //     }

    //     await prisma.solicitudes_recoleccion.update({
    //         where: { id_solicitud: idSolicitud },
    //         data: {
    //             cubetas_entregadas: null,
    //             cubetas_recolectadas: null,
    //             total_a_pagar: null,
    //             total_pagado: null,
    //             fecha: null,
    //             horario: null,
    //             notas: null,
    //             quiere_recoleccion: null,
    //             quiere_productos_extra: null,
    //             id_pago: null,
    //         }
    //     });

    //     await prisma.productos_solicitud.deleteMany({
    //         where: { id_solicitud: idSolicitud }
    //     });

    //     return { message: 'Solicitud cancelada correctamente' };
    // }

    static async getLastRequestPerClient(idClient) {
        console.log("Obteniendo última solicitud para cliente con id:", idClient);
        const request = await prisma.solicitudes_recoleccion.findFirst({
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

        console.log("Solicitud obtenida:", request);

        return request;
    }

    static async getInfoAboutExtraProuctsSelected(idSolicitud){
        const data = await prisma.productos_solicitud.findMany({
            where:{
                id_solicitud: idSolicitud
            },
            select: {
                id_producto: true,
                cantidad: true,
            }
        });

        return data;
    }

    static async updateWantsRequestAttribute(requestID, value){
        console.log("FALSE", value);
        console.log("Requestid", requestID);
        const data = await prisma.solicitudes_recoleccion.update({
            where:{
                id_solicitud: requestID
            },
            data: {
                quiere_productos_extra: value
            }
        })
    }

    static async substractInventory(product){
        const data = await prisma.productos_extra.update({
            where : { id_producto : product.id_producto},
            data: {
                cantidad:{
                    decrement: product.cantidad
                }
            }
        })
        console.log("DATA 1", data);
    }

    static async incrementInventory(product){
        console.log("PRODUCTOOOOOOOOOOOOOO", product);
        const data = await prisma.productos_extra.update({
            where: { id_producto: product.id_producto},
            data: {
                cantidad: {
                    increment: product.cantidad
                }
            }
        })
        console.log("DATA 2", data);
    }
};