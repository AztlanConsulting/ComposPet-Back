const prisma = require("../config/prisma");

/**
 * Modelo que representa las rutas registradas en el sistema.
 * Interactúa con la tabla `ruta` de la base de datos.
 */
module.exports = class Route {
    
    /**
     * Obtiene todos los días de ruta disponibles en el sistema.
     * Consulta la tabla `ruta` y retorna únicamente el identificador y el día asignado.
     * Se utiliza para poblar el catálogo de días de ruta en el formulario de registro de clientes.
     *
     * @returns {Promise<Array<{ id_ruta: number, dia_ruta: string }>>}
     * Arreglo con los registros de ruta disponibles, o un arreglo vacío si no existen.
     * @see Route.findAllDaysOfRoute
     */
    static async findAllDaysOfRoute(){
        const daysOfRoutes = await prisma.ruta.findMany({
            select: {
                id_ruta: true,
                dia_ruta: true,
            }
        });

        return daysOfRoutes;
    }

    static async getRoutesInfo() {
        try{

            const now = new Date();

            const diasSemana = [
                "Domingo",
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
            ];

            const todayName = diasSemana[now.getDay()];

            // Inicio de semana: domingo
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            // Fin de semana: siguiente domingo
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            endOfWeek.setHours(0, 0, 0, 0);

            const routeInfo = await prisma.cliente.findMany({
                where: {
                    ruta: {
                        dia_ruta: todayName,
                    },
                },

                select: {
                    id_cliente: true,
                    id_ruta: true,
                    orden_horario: true,

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

                    solicitudes_recoleccion: {
                        where: {
                            fecha: {
                                gte: startOfWeek,
                                lt: endOfWeek,
                            },
                        },
                        select: {
                            id_solicitud: true,
                            cubetas_recolectadas: true,
                            cubetas_entregadas: true,
                            total_a_pagar: true,
                            total_pagado: true,
                            fecha: true,
                            horario: true,
                            notas: true,

                            formas_pago: {
                                select: {
                                    tipo: true,
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
                        },
                    },
                },

                orderBy: [
                    {
                        ruta: {
                            turno_ruta: "asc",
                        },
                    },
                    {
                        orden_horario: "asc",
                    },
                ],
            });

            const formattedRouteInfo = routeInfo.map((cliente) => {
                const solicitud = cliente.solicitudes_recoleccion?.[0];

                const productosExtra = solicitud?.productos_solicitud
                    ?.sort((a, b) => {
                        return (a.productos_extra?.orden || 0) - (b.productos_extra?.orden || 0);
                    })
                    .map((producto) => {
                        if (!producto.productos_extra) return null;
                        if (producto.cantidad == null) return producto.productos_extra.nombre;
                        return `${producto.productos_extra.nombre} (${producto.cantidad})`;
                    })
                    .filter(Boolean)
                    .join("\n");

                const formattedTime = (horario) =>{
                    if (!horario) return " ";

                    if (horario instanceof Date) return horario.toISOString().substring(11,16);

                    if (typeof horario === "string") return horario.substring(0, 5);

                    return " ";
                }

                const name = cliente.usuarios_cp?.nombre || "";
                const lastName = cliente.usuarios_cp?.apellido || "";
                const fullName = `${name} ${lastName}`.trim() || " ";

                return {
                    nombre: fullName,
                    recoleccion: solicitud?.cubetas_recolectadas?.toString() ?? " ",
                    entrega: solicitud?.cubetas_entregadas?.toString() ?? " ",
                    productos_extra: productosExtra || " ",
                    // ruta: `${cliente.ruta.dia_ruta}`,
                    horario: formattedTime(solicitud?.horario),
                    forma_pago: solicitud?.formas_pago?.tipo || " ",
                    total_a_pagar: solicitud?.total_a_pagar?.toString() ?? " ",
                    total_pagado: solicitud?.total_pagado?.toString() ?? " ",
                    notas: solicitud?.notas || " ",
                };
            });

            return formattedRouteInfo;
        } catch(error){
            throw new Error('Error obteniendo rutas');
        }
    }
    
}