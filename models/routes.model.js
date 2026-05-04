const prisma = require('../config/prisma');

module.exports = class Routes {

    static async getRoutesInfo() {
        // Limitar a que solo me traiga la info del mes pasado
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startActualMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const routeInfo = await prisma.solicitudes_recoleccion.findMany({
            where: {
            fecha: {
                gte: lastMonthStart,
                lt: startActualMonth,
            },
            },

            select: {
                id_solicitud: true,
                id_cliente: true,
                cubetas_recolectadas: true,
                cubetas_entregadas: true,
                total_a_pagar: true,
                total_pagado: true,
                fecha: true,
                horario: true,
                notas: true,

                formas_pago:{
                    select:{
                        tipo:true,
                    },
                },

                productos_solicitud: {
                    select: {
                        id_producto: true,
                        cantidad: true,
                        productos_extra: {
                            select: {
                            nombre: true,
                            orden: true,
                            },
                        },
                    },
                },

                cliente: {
                    select: {
                    id_ruta: true,
                    usuarios_cp: {
                        select: {
                        nombre: true,
                        apellido: true,
                        },
                    },
                    ruta: {
                        select: {
                        dia_ruta: true,
                        turno_ruta: true,
                        },
                    },
                    },
                },
            },

            orderBy: [
                { fecha: "desc" },
                { horario: "asc" },
            ],
        });

        const formattedRouteInfo = routeInfo.map((solicitud) => {
            const productosExtra = solicitud.productos_solicitud
                // se ordenan los productos según el orden que tienen en la base de datos 
                .sort((a, b) => {
                    return (a.productos_extra?.orden || 0) - (b.productos_extra?.orden || 0);
                })
                // transforma en texto los objetos
                .map((producto) => {
                    // si no hay productos extra regresa vacio
                    if (!producto.productos_extra) return " ";
                    // si hay productos extra, agrega la cantidad que se escogía entre parentésis.
                    return `${producto.productos_extra.nombre} (${producto.cantidad})`;
                })
                // elimina los valores falsos
                .filter(Boolean)
                // junta todo en un string separado por saltos de línea
                .join("\n");

            // regresa la información en el siguiente orden
            return {
                nombre: `${solicitud.cliente.usuarios_cp.nombre} ${solicitud.cliente.usuarios_cp.apellido}`,
                "#Recolección": solicitud.cubetas_recolectadas,
                "#Entrega": solicitud.cubetas_entregadas,
                "productos_extra": productosExtra || "No selecciono productos extra",
                ruta: `${solicitud.cliente.ruta.dia_ruta} ${solicitud.cliente.ruta.turno_ruta}`,
                fecha: solicitud.fecha
                    ? solicitud.fecha.toISOString().split("T")[0]
                    : "Sin fecha",
                horario: solicitud.horario
                    ? solicitud.horario.toISOString().substring(11, 16)
                    : "Sin horario",
                "forma_pago": solicitud.formas_pago?.tipo || "N/A",
                total_a_pagar: solicitud.total_a_pagar,
                total_pagado: solicitud.total_pagado,
                notas: solicitud.notas || "N/A",
            };
        });

        return formattedRouteInfo;
    }
}