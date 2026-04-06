/**
 * Modelo de acceso a datos para el módulo de solicitudes de recolección
 * Encapsula todas las operaciones sobre la tabla `solicitud_recoleccion` y `bitacora`
 * relacionadas con el flujo del formulario de recolección,
 * de la tabla de solicitudes de recolección y la auditoría necesaria
 *
 * Todas las operaciones son realizadas mediante el cliente Prisma configurado
 * en `config/prisma`
 *
 * @namespace SolicitudesRec
 */

const prisma = require("../config/prisma");

module.exports = class SolicitudesRec {

    /**
     * Obtiene la solicitud de recolección actual del cliente dentro del rango de fechas
     * correspondiente a la semana consultada. Si no existe una solicitud en ese rango,
     * crea una solicitud inicial y la retorna
     *
     * @async
     * @static
     * @param {number} idCliente - Id del cliente
     * @param {string} fechaInicioSemana - Fecha inicial del rango semanal
     * @param {string} fechaFinSemana - Fecha final del rango semanal
     */
    static async obtenerSolicitudRecActual(idCliente, fechaInicioSemana, fechaFinSemana) {

        const solicitudRecActual = await prisma.solicitud_recoleccion.findFirst({
            where: {
                id_cliente: idCliente,
                fecha: {
                    gte: new Date(fechaInicioSemana),
                    lte: new Date(fechaFinSemana),
                },
            },
        });

        // Si ya existe una solicitud dentro del rango semanal, se retorna
        if (solicitudRecActual) {
            return solicitudRecActual;
        } else {

             // Si no existe una solicitud, se crea una nueva solicitud
            return this.crearSolicitudRecInicial(idCliente);
        }
    }

    /**
     * Crea una solicitud de recolección inicial con valores por defecto para el FORM-02-03
     *
     * @async
     * @static
     * @param {number} idCliente - Id del cliente.
     */
    static async crearSolicitudRecInicial(idCliente) {

        const nuevaSolicitudRecActual = await prisma.solicitud_recoleccion.create({
            data: {
                id_cliente: idCliente,
                quiere_recoleccion: false,
                quiere_productos_extra: false,
                cubetas_recolectadas: 0,
                cubetas_entregadas: 0,
                total_a_pagar: 0,
                total_pagado: 0,
                fecha: new Date(),
                notas: null,

            },
        });
        return nuevaSolicitudRecActual;
    }

    /**
     * Guarda la información correspondiente a la primera sección del formulario
     * de solicitud de recolección.
     *
     * @async
     * @static
     * @param {Object} datosFormulario - Datos de la primera sección
     * @param {number} datosFormulario.idSolicitud - Id de la solicitud
     * @param {boolean} datosFormulario.quiereRecoleccion - Indica si el cliente desea recolección
     * @param {boolean} datosFormulario.quiereProductosExtra - Indica si el cliente desea productos extra
     * @param {number} datosFormulario.cubetasRecolectadas - Cantidad de cubetas que el cliente entregara
     * @param {number} datosFormulario.cubetasEntregadas - Cantidad de cubetas vacías solicitadas
     */
    static async guardarSolicitudRecPrimeraSeccion({
        idSolicitud,
        quiereRecoleccion,
        quiereProductosExtra,
        cubetasRecolectadas,
        cubetasEntregadas,
    }) {
        return await prisma.solicitud_recoleccion.update({
            where: {
                id_solicitud: idSolicitud,
            },
            data: {
                quiere_recoleccion: quiereRecoleccion,
                quiere_productos_extra: quiereProductosExtra,
                cubetas_recolectadas: cubetasRecolectadas,
                cubetas_entregadas: cubetasEntregadas,
            },
        });
    }
};