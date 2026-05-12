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

    /**
     * Obtiene la información de todas las rutas del día actual.
     * Realiza una consulta compleja a la base de datos filtrando por el día de la semana actual,
     * incluyendo solicitudes de recolección de la semana en curso, productos extra y formas de pago.
     * Los datos son formateados para su presentación en la interfaz.
     *
     * @async
     * @static
     * @returns {Promise<Array<Object>>} Promesa que resuelve con un array de objetos con la información formateada:
     * @returns {string} return[].nombre - Nombre completo del cliente (nombre + apellido).
     * @returns {string} return[].recoleccion - Número de cubetas recolectadas como string (o " " si no hay dato).
     * @returns {string} return[].entrega - Número de cubetas entregadas como string (o " " si no hay dato).
     * @returns {string} return[].productos_extra - Lista de productos extra separados por saltos de línea.
     * @returns {string} return[].horario - Horario de la ruta en formato HH:mm (o " " si no hay dato).
     * @returns {string} return[].forma_pago - Tipo de forma de pago (efectivo, transferencia, etc.).
     * @returns {string} return[].total_a_pagar - Monto total a pagar como string.
     * @returns {string} return[].total_pagado - Monto total pagado como string.
     * @returns {string} return[].notas - Notas adicionales sobre la ruta o cliente.
     * @throws {Error} Lanza un error si ocurre algún problema al consultar la base de datos.
     */ 

    static async getRoutesInfo() {
        try{
            // ==================== CÁLCULO DE FECHAS ====================
            const now = new Date();

             /** Array con los nombres de los días de la semana en español */
            const weekdays = [
                "Domingo",
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
            ];

            /** Nombre del día actual (ej: "Lunes", "Martes", etc.) */
            const todayName = weekdays[now.getDay()];

             /**
             * Inicio de la semana actual (domingo a las 00:00:00).
             * Se usa para filtrar solicitudes de la semana en curso.
             */
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            /**
             * Fin de la semana actual (próximo domingo a las 00:00:00).
             * Se usa como límite superior del filtro de fechas.
             */
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            endOfWeek.setHours(0, 0, 0, 0);

            // ==================== CONSULTA A BASE DE DATOS ====================
        
            /**
             * Consulta todos los clientes con rutas del día actual,
             * incluyendo sus solicitudes de recolección de la semana,
             * productos extra asociados y formas de pago.
             * Ordenado por turno de ruta y orden de horario.
             */
            const routeInfo = await prisma.cliente.findMany({
                where: {
                    usuarios_cp: {
                        is: {
                            estatus: true,
                        },
                    },
                    ruta: {
                        dia_ruta: {
                            startsWith: todayName
                        }, // Filtra por el día actual
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
                            id_ruta: true,
                            dia_ruta: true,
                        },
                    },

                    solicitudes_recoleccion: {
                        where: {
                            fecha: {
                                gte: startOfWeek, // desde el inicio de la semana
                                lt: endOfWeek, // hasta el fin de la semana
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
                                            orden: true, // ordenar los productos
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
                            id_ruta: "asc", // primero por turno
                        },
                    },
                    {
                        orden_horario: "asc", // luego por orden dentro del turno
                    },
                ],
            });

            // ==================== FORMATEO DE DATOS ====================
        
            /**
             * Transforma los datos de la base de datos al formato requerido por la vista.
             * Toma la primera solicitud de cada cliente (la más reciente) y formatea
             * todos los campos para su presentación.
             */
            const formattedRouteInfo = routeInfo.map((client) => {
                // Obtiene la primera (y generalmente única) solicitud de la semana
                const request = client.solicitudes_recoleccion?.[0];

                /**
                 * Formatea la lista de productos extra ordenados por su campo 'orden'.
                 * Incluye la cantidad entre paréntesis si está disponible.
                 * Ejemplo: "Bolsas biodegradables (5)\nShampoo (2)"
                 */
                const extraproducts = request?.productos_solicitud
                    ?.sort((a, b) => {
                        return (a.productos_extra?.orden || 0) - (b.productos_extra?.orden || 0);
                    })
                    .map((product) => {
                        if (!product.productos_extra) return null;
                        if (product.cantidad == null) return product.productos_extra.nombre;
                        return `${product.productos_extra.nombre} (${product.cantidad})`;
                    })
                    .filter(Boolean) // elimina valores null/undefined
                    .join("\n"); // une con saltos de línea

                /**
                 * Formatea el horario a formato HH:mm.
                 * Maneja tanto objetos Date como strings de tiempo.
                 * 
                 * @param {Date|string|null} horario - Horario a formatear
                 * @returns {string} Horario en formato HH:mm o " " si no hay dato
                 */
                const formattedTime = (schedule) =>{
                    if (!schedule) return " ";

                    // Si es un objeto Date, extrae HH:mm 
                    if (schedule instanceof Date) return schedule.toISOString().substring(11,16);

                    // Si es string, toma los primeros 5 caracteres (HH:mm)
                    if (typeof schedule === "string") return schedule.substring(0, 5);

                    return " ";
                }

                // Construye el nombre completo del cliente
                const name = client.usuarios_cp?.nombre || "";
                const lastName = client.usuarios_cp?.apellido || "";
                const fullName = `${name} ${lastName}`.trim() || " ";

                 // ==================== OBJETO FORMATEADO FINAL ====================
                return {
                    nombre: fullName,
                    recoleccion: request?.cubetas_recolectadas?.toString() ?? " ",
                    entrega: request?.cubetas_entregadas?.toString() ?? " ",
                    productos_extra: extraproducts || " ",
                    horario: formattedTime(request?.horario),
                    forma_pago: request?.formas_pago?.tipo || " ",
                    total_a_pagar: request?.total_a_pagar?.toString() ?? " ",
                    total_pagado: request?.total_pagado?.toString() ?? " ",
                    notas: request?.notas || " ",
                };
            });

            return formattedRouteInfo;
        } catch(error){
            throw new Error('Error obteniendo rutas');
        }
    }
}