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
};