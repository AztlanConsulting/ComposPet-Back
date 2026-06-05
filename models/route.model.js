const prisma = require("../config/prisma");

/** Array con los nombres de los días de la semana en español */
const WEEK_DAYS = [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado",
];

/**
 * Genera un arreglo de semanas comprendidas en los últimos dos meses hasta la fecha actual.
 * Cada semana incluye su fecha de inicio, fecha de fin y una etiqueta legible en formato
 * `dd/mm/aaaa - dd/mm/aaaa`.
 *
 * @param {Date} [now=new Date()] - Fecha de referencia para el cálculo. Por defecto es la fecha actual.
 * @returns {Array<{ weekStart: Date, weekEnd: Date, label: string }>}
 * Arreglo de semanas ordenadas de la más antigua a la más reciente.
 */
function getLastTwoMonthsWeeks(now = new Date()) {
    const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const today = new Date(nowUtc);

    const day = today.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const currentDay = new Date(today);
    currentDay.setUTCDate(currentDay.getUTCDate() + diffToMonday);

    const startMonday = new Date(currentDay);
    startMonday.setUTCDate(startMonday.getUTCDate() - 9 * 7);

    const weeks = [];
    let weekStart = new Date(startMonday);

    while (weekStart <= currentDay) {
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6); // domingo

        weeks.push({
            weekStart: new Date(weekStart),
            weekEnd: new Date(weekEnd),
            label: `${weekStart.toLocaleDateString("es-MX", { timeZone: "UTC" })} - ${weekEnd.toLocaleDateString("es-MX", { timeZone: "UTC" })}`,
        });

        weekStart.setUTCDate(weekStart.getUTCDate() + 7); // siguiente lunes
    }

    return weeks;
}

/**
 * Obtiene el índice de la semana actual dentro del arreglo de semanas disponibles.
 *
 * @param {Date} [now=new Date()] - Fecha de referencia para calcular la semana actual.
 * @returns {number} Índice de la semana actual, o -1 si no se encuentra dentro del rango.
 */
function getCurrentWeekIndex(now = new Date()) {
    const weeks = getLastTwoMonthsWeeks(now);
    return weeks.findIndex(
        (week) => now >= week.weekStart && now < week.weekEnd
    );
}

/**
 * Formatea un horario al formato HH:mm.
 * Maneja valores tipo Date y string.
 *
 * @param {Date|string|null} schedule - Horario a formatear.
 * @returns {string} Horario en formato HH:mm, o " " si no existe o no tiene formato válido.
 */
const formattedTime = (schedule) => {
    if (!schedule) return " ";

    if (schedule instanceof Date) return schedule.toISOString().substring(11, 16);

    if (typeof schedule === "string") return schedule.substring(0, 5);

    return " ";
};

/**
 * Formatea la información de rutas obtenida desde la base de datos
 * al formato requerido por la vista.
 *
 * @param {Array<Object>} routeInfo - Arreglo de clientes con información de ruta, solicitud,
 * productos extra y forma de pago.
 * @returns {Array<Object>} Arreglo de rutas formateadas para su visualización en la tabla.
 */
const formatRouteInfo = (routeInfo) => {
    return routeInfo.map((client) => {
        const request = client.solicitudes_recoleccion?.[0];

        /**
         * Productos extra ordenados según el campo `orden`
         * registrado en la tabla de productos extra.
         */
        const sortedProducts = request?.productos_solicitud
            ?.sort((a, b) => {
                return (a.productos_extra?.orden || 0) - (b.productos_extra?.orden || 0);
            }) || [];

        /**
         * Lista de productos extra en formato de texto.
         * Ejemplo: "Aserrín (1)\nFibra de Coco 50L (1)".
         */
        const extraProducts = sortedProducts
            .map((product) => {
                if (!product.productos_extra) return null;

                if (product.cantidad == null) {
                    return product.productos_extra.nombre;
                }

                return `${product.productos_extra.nombre} (${product.cantidad})`;
            })
            .filter(Boolean)
            .join("\n");

        /**
         * Lista de productos extra con detalle de texto y color.
         * Se utiliza para pintar cada producto individualmente en la vista.
         */
        const extraProductsDetail = sortedProducts
            .map((product) => {
                if (!product.productos_extra) return null;

                return {
                    text:
                        product.cantidad == null
                            ? product.productos_extra.nombre
                            : `${product.productos_extra.nombre} (${product.cantidad})`,
                    color: product.productos_extra.color,
                };
            })
            .filter(Boolean);

        const extraProductsArray = Object.fromEntries(
            sortedProducts
                .filter(p => p.productos_extra)
                .map(p => [p.id_producto, p.cantidad ?? 1])
        );

        // Construye el nombre completo del cliente.
        const name = client.usuarios_cp?.nombre || "";
        const lastName = client.usuarios_cp?.apellido || "";
        const fullName = `${name} ${lastName}`.trim() || " ";

        // Retorna el objeto final con los campos requeridos por la tabla de rutas.
        return {
            nombre: fullName,
            dia_ruta: client.ruta?.dia_ruta || " ",
            recoleccion: request?.cubetas_recolectadas ?? null,
            entrega: request?.cubetas_entregadas ?? null,
            productos_extra: extraProducts || " ",
            horario: formattedTime(request?.horario),
            id_pago: request?.formas_pago?.id_pago || null,
            forma_pago: request?.formas_pago?.tipo || " ",
            total_a_pagar: request?.total_a_pagar || null,
            total_pagado: request?.total_pagado || null,
            notas: request?.notas || " ",

            hasRequest: !!request,

            status: request?.estatus ?? null,
            wantsCollection: request?.quiere_recoleccion ?? null,
            wantsExtraProducts: request?.quiere_productos_extra ?? null,
            extraProductsDetails: extraProductsDetail || [],
            extraProductsArray: extraProductsArray || [],
            clientId: client?.id_cliente || null,
            requestId: request?.id_solicitud || null,

        };
    });
};

/**
 * Modelo de acceso a datos para las rutas registradas en el sistema.
 * Encapsula las operaciones sobre la tabla `ruta` y consultas relacionadas
 * con solicitudes de recolección, productos extra y formas de pago.
 *
 * @namespace Route
 */
module.exports = class Route {
    
    /**
     * Obtiene todos los días de ruta disponibles en el sistema.
     * Consulta la tabla `ruta` y retorna únicamente el identificador y el día asignado.
     * Se utiliza para poblar el catálogo de días de ruta en el formulario de registro de clientes.
     *
     * @returns {Promise<Array<{ id_ruta: number, dia_ruta: string }>>}
     * Arreglo con los registros de ruta disponibles, o un arreglo vacío si no existen.
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

            /** Nombre del día actual (ej: "Lunes", "Martes", etc.) */
            const todayName = WEEK_DAYS[now.getDay()];

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
                        },
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
                                gte: startOfWeek,
                                lt: endOfWeek,
                            },
                        },
                        select: {
                            id_solicitud: true,
                            estatus: true,
                            quiere_recoleccion: true,
                            quiere_productos_extra: true,
                            cubetas_recolectadas: true,
                            cubetas_entregadas: true,
                            total_a_pagar: true,
                            total_pagado: true,
                            fecha: true,
                            horario: true,
                            notas: true,

                            formas_pago: {
                                select: {
                                    id_pago: true,
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
                                            color: true,
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
            return formatRouteInfo(routeInfo);
        } catch(error){
            throw new Error('Error obteniendo rutas');
        }
    }

    /**
     * Obtiene la información de rutas filtrada por una semana específica y opcionalmente por día.
     * Las semanas disponibles se calculan mediante `getLastTwoMonthsWeeks` y se acceden por índice.
     * Si no se proporciona `dayName`, se utiliza el día actual de la semana.
     *
     * @param {Object} [params={}] - Parámetros de filtrado.
     * @param {number} params.weekIndex - Índice de la semana dentro del arreglo de semanas disponibles.
     * @param {string} [params.dayName] - Nombre del día a filtrar (ej. `"Lunes"`). Si se omite,
     * se usa el día actual.
     * @returns {Promise<Array<Object>>} Arreglo de clientes con su información de ruta formateada,
     * con la misma estructura que retorna `getRoutesInfo`.
     * @throws {Error} Lanza un error si `weekIndex` está fuera del rango de semanas disponibles.
     * @throws {Error} Lanza un error si ocurre un fallo al consultar la base de datos.
     * @see getLastTwoMonthsWeeks
     * @see Route.getRoutesInfo
     */
    static async getFilteredRoutesInfo({ weekIndex, dayName } = {}) {
        try {

            const now = new Date();

            let dateFilter = {};

            if (weekIndex !== null && weekIndex !== undefined) {
                const weeks = getLastTwoMonthsWeeks(now);
                if (weekIndex < 0 || weekIndex >= weeks.length)
                    throw new Error(`Index fuera de rango`);

                const { weekStart, weekEnd } = weeks[weekIndex];
                dateFilter = { gte: weekStart, lt: weekEnd };
            } else {
                const weeks = getLastTwoMonthsWeeks(now);
                const twoMonthsAgo = weeks[0].weekStart;
                const weekEnd = weeks[weeks.length - 1].weekEnd;
                dateFilter = { gte: twoMonthsAgo, lt: weekEnd };
            }

            const rutaFilter = dayName ? { dia_ruta: { startsWith: dayName } } : {};   

            const routeInfo = await prisma.cliente.findMany({
                where: {
                    usuarios_cp: {
                        is: {
                            estatus: true,
                        },
                    },
                    ruta: rutaFilter,
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
                            fecha: dateFilter 
                        },
                        select: {
                            id_solicitud: true,
                            estatus: true,
                            quiere_recoleccion: true,
                            quiere_productos_extra: true,
                            cubetas_recolectadas: true,
                            cubetas_entregadas: true,
                            total_a_pagar: true,
                            total_pagado: true,
                            fecha: true,
                            horario: true,
                            notas: true,

                            formas_pago: {
                                select: {
                                    id_pago: true,
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
                                            color: true,
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
                            id_ruta: "asc",
                        },
                    },
                    {
                        orden_horario: "asc",
                    },
                ],

            });
            return formatRouteInfo(routeInfo);
        } catch (error) {
            throw new Error(`Error obteniendo rutas filtradas: ${error.message}`);
        }
    }

    /**
     * Retorna el índice de la semana actual dentro del arreglo generado por `getLastTwoMonthsWeeks`.
     * Delega el cálculo a la función utilitaria `getCurrentWeekIndex` del módulo.
     *
     * @returns {number} Índice de la semana actual.
     * @see getLastTwoMonthsWeeks
     * @see getCurrentWeekIndex
     */
    static getCurrentWeekIndex() {
        return getCurrentWeekIndex();
    }

    /**
     * Retorna las semanas disponibles para filtrar rutas, correspondientes a los últimos dos meses.
     *
     * @returns {Array<{ weekStart: Date, weekEnd: Date, label: string }>}
     * Arreglo de semanas ordenadas de la más antigua a la más reciente.
     * @see getLastTwoMonthsWeeks
     */
    static getAvailableWeeks(){
        return getLastTwoMonthsWeeks();
    }


    /**
     * Obtiene las rutas que cuentan con una solicitud válida para generar
     * mensajes de confirmación.
     *
     * Reutiliza la consulta de rutas filtradas por semana y día, 
     * Este método no construye el mensaje final; solo entrega al controlador la información
     * necesaria para generarlo.
     *
     * @async
     * @static
     * @param {Object} [params={}] - Parámetros para filtrar las rutas.
     * @param {number} params.weekIndex - Índice de la semana seleccionada dentro del rango disponible.
     * @param {string} [params.dayName] - Día de ruta seleccionado. Si se omite, se usa el día actual.
     * @returns {Promise<Array<Object>>} Lista de rutas con solicitud y horario válido para generar mensajes.
     * @throws {Error} Lanza un error si falla la consulta de rutas filtradas.
     * @see Route.getFilteredRoutesInfo
     */
    static async generateConfirmationMessages({ weekIndex, dayName } = {}){ 
        try {
            const filteredRoutes = await this.getFilteredRoutesInfo({ weekIndex, dayName });

            //Filtra las rutas que tienen una solicitud válida y horario definido para mensajes de confirmación.
            return filteredRoutes.filter(route => 
                route.hasRequest === true &&
                route.status === true &&
                route.horario &&
                route.horario.trim() !== "" &&
                (
                    route.wantsCollection === true ||
                    route.wantsExtraProducts === true
                )
            );
    
        } catch (error) {
            throw new Error(`Error generando mensajes de confirmación: ${error.message}`);
        
        }
    }
};