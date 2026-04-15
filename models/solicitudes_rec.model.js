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

        const solicitudRecActual = await prisma.solicitudes_recoleccion.findFirst({
            where: {
                id_cliente: idCliente,
                fecha: {
                    gte: new Date(fechaInicioSemana),
                    lte: new Date(fechaFinSemana),
                },
            },
        });

        // Si ya existe una solicitud dentro del rango semanal, se retorna
        return solicitudRecActual;
    }

    /**
     * Crea una solicitud de recolección inicial con valores por defecto para el FORM-02-03
     *
     * @async
     * @static
     * @param {number} idCliente - Id del cliente.
     */
    static async crearSolicitudRecInicial(idCliente) {

        const nuevaSolicitudRecActual = await prisma.solicitudes_recoleccion.create({
            data: {
                cliente: {
                    connect: {
                    id_cliente: idCliente,
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
        return await prisma.solicitudes_recoleccion.update({
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

    static async obtenerProductosExtra() {
        const productosExtra = await prisma.productos_extra.findMany({
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

        if (!productosExtra || productosExtra.length === 0) {
            throw new Error('PRODUCTOS_EXTRA_NO_ENCONTRADOS');
        }

        return productosExtra;
    };

    static async guardarSolicitudRecSegundaSeccion(idSolicitud, productos) {
        const solicitud = await prisma.solicitudes_recoleccion.findUnique({
            where: { id_solicitud: idSolicitud }
        });

        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }

        await prisma.productos_solicitud.deleteMany({
            where: { id_solicitud: idSolicitud }
        });

        for (const producto of productos) {
            await prisma.productos_solicitud.create({
                data: {
                    id_solicitud: idSolicitud,
                    id_producto: producto.id_producto,
                    fecha: new Date(),
                    cantidad: producto.cantidad,
                }
            });
        }

        return { message: 'Productos guardados correctamente' };
    }

    static async cancelarSolicitud(idSolicitud) {
        const solicitud = await prisma.solicitudes_recoleccion.findUnique({
            where: { id_solicitud: idSolicitud }
        });

        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }

        await prisma.solicitudes_recoleccion.update({
            where: { id_solicitud: idSolicitud },
            data: {
                cubetas_entregadas: null,
                cubetas_recolectadas: null,
                total_a_pagar: null,
                total_pagado: null,
                fecha: null,
                horario: null,
                notas: null,
                quiere_recoleccion: null,
                quiere_productos_extra: null,
                id_pago: null,
            }
        });

        await prisma.productos_solicitud.deleteMany({
            where: { id_solicitud: idSolicitud }
        });

        return { message: 'Solicitud cancelada correctamente' };
    }

    static async obtenerUltimaSolicitudPorCliente(idCliente) {
        console.log("Obteniendo última solicitud para cliente con id:", idCliente);
        const solicitud = await prisma.solicitudes_recoleccion.findFirst({
            where: {
                id_cliente : idCliente
            },
            orderBy: {
                fecha: 'desc'
            },
            select: {
                id_solicitud: true
            }
            });

        console.log("Solicitud obtenida:", solicitud);

        return solicitud;
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
};