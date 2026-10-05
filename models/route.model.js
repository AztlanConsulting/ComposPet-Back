const prisma = require("../config/prisma");
const { formatDate } = require("../utils/formatDate");
const { getCollectionWeekMonday } = require("../utils/collectionWeek");

/** Array con los nombres de los días de la semana en español */
const WEEK_DAYS = [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado",
];

const DAY_INDEX = {
    Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3,
    Jueves: 4, Viernes: 5, Sábado: 6,
};

/**
 * De un conjunto de solicitudes de un cliente, selecciona la que pertenece
 * a la semana de recolección solicitada, usando getCollectionWeekMonday
 * en vez de comparar la fecha cruda contra el rango Lunes-Domingo.
 *
 * @param {Array<Object>} requests - Solicitudes del cliente devueltas por Prisma.
 * @param {Date|null} weekStart - Lunes de la semana de recolección filtrada.
 * @returns {Object|null} La solicitud que pertenece a esa semana, o null.
 */
function pickRequestForWeek(requests, weekStart) {
    if (!weekStart || !requests || requests.length === 0) {
        return requests?.[0] ?? null;
    }

    const target = weekStart.getTime();

    const matched = requests.find((r) => {
        if (!r.fecha) return false;
        return getCollectionWeekMonday(new Date(r.fecha)).getTime() === target;
    });

    return matched ?? requests[0] ?? null;
}

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
    const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const today = new Date(nowUtc);

    const day = today.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const currentDay = new Date(today);
    currentDay.setUTCDate(currentDay.getUTCDate() + diffToMonday);

    const lastMonday = new Date(currentDay);
    lastMonday.setUTCDate(lastMonday.getUTCDate() + 7);

    const startMonday = new Date(currentDay);
    startMonday.setUTCDate(startMonday.getUTCDate() - 9 * 7);

    const weeks = [];
    let weekStart = new Date(startMonday);

    while (weekStart <= lastMonday) {
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6); // domingo

        weeks.push({
            weekStart: new Date(weekStart),
            weekEnd: new Date(weekEnd),
            label: `${weekStart.toLocaleDateString("es-MX", { timeZone: "UTC" })} - ${weekEnd.toLocaleDateString("es-MX", { timeZone: "UTC" })}`,
        });

        weekStart.setUTCDate(weekStart.getUTCDate() + 7);
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

    return weeks.findIndex((week) => {
        // week.weekEnd representa el domingo a las 00:00 UTC (inicio del
        // domingo, no su fin), porque también se usa para construir el
        // label legible de la semana. Para la comparación de pertenencia
        // se necesita el límite exclusivo del LUNES SIGUIENTE, de lo
        // contrario cualquier "now" que caiga en domingo después de
        // medianoche queda fuera de todas las semanas del arreglo.
        const exclusiveWeekEnd = new Date(week.weekEnd);
        exclusiveWeekEnd.setUTCDate(exclusiveWeekEnd.getUTCDate() + 1);

        return now >= week.weekStart && now < exclusiveWeekEnd;
    });
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
 * Calcula la fecha de la ruta para un día dado dentro de una semana.
 */
function getRouteDateForDay(diaRuta, weekStart) {
    const dayName = diaRuta?.split(" ")[0];
    const targetDay = DAY_INDEX[dayName];

    if (targetDay === undefined || !weekStart) return null;

    const ws = new Date(weekStart);
    const weekStartDay = ws.getUTCDay();

    const diff = (targetDay - weekStartDay + 7) % 7;
    const date = new Date(ws);
    date.setUTCDate(date.getUTCDate() + diff);

    return date.toISOString().split("T")[0];
}

/**
 * Construye el objeto de datos de una fila de la tabla de rutas
 * a partir de un cliente y una solicitud de recolección (puede ser null).
 *
 * @param {Object} client - Cliente con información de ruta y usuario.
 * @param {Object|null} request - Solicitud de recolección asociada, o null si no existe.
 * @param {Date|null} weekStart - Inicio de la semana seleccionada, usado para calcular
 * la fecha de ruta cuando no hay solicitud.
 * @returns {Object} Fila formateada para la tabla de rutas.
 */
const buildRow = (client, request, weekStart) => {
    const sortedProducts = [...(request?.productos_solicitud ?? [])]
        .sort((a, b) => (a.productos_extra?.orden || 0) - (b.productos_extra?.orden || 0));

    const extraProducts = sortedProducts
        .map((product) => {
            if (!product.productos_extra) return null;
            return product.cantidad == null
                ? product.productos_extra.nombre
                : `${product.productos_extra.nombre} (${product.cantidad})`;
        })
        .filter(Boolean)
        .join("\n");

    const extraProductsDetail = sortedProducts
        .map((product) => {
            if (!product.productos_extra) return null;
            return {
                text: product.cantidad == null
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

    const name = client.usuarios_cp?.nombre || "";
    const lastName = client.usuarios_cp?.apellido || "";
    const fullName = `${name} ${lastName}`.trim() || " ";

    const requestDate = (() => {
        if (!request?.fecha) return null;
        const collectionWeekMonday = getCollectionWeekMonday(new Date(request.fecha));
        const routeDayDate = getRouteDateForDay(client.ruta?.dia_ruta, collectionWeekMonday);
        return routeDayDate ?? request.fecha.toISOString().split("T")[0];
    })();

    const routeDate = (() => {
        if (requestDate) return null;
        if (!weekStart) return null;

        const calculatedDate = getRouteDateForDay(client.ruta?.dia_ruta, weekStart);
        if (!calculatedDate) return null;

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        if (calculatedDate > todayStr) return null;

        return calculatedDate;
    })();

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
        fecha: requestDate ?? routeDate,
        hasRequest: !!request,
        status: request?.estatus ?? null,
        wantsCollection: request?.quiere_recoleccion ?? null,
        wantsExtraProducts: request?.quiere_productos_extra ?? null,
        extraProductsDetails: extraProductsDetail,
        extraProductsArray: extraProductsArray,
        clientId: client?.id_cliente || null,
        requestId: request?.id_solicitud || null,
    };
}

/**
 * Formatea la información de rutas obtenida desde la base de datos
 * al formato requerido por la vista.
 *
 * @param {Array<Object>} routeInfo - Clientes con sus solicitudes de recolección.
 * @param {boolean} [expandMultiple=false] - Si true, expande múltiples solicitudes por cliente.
 * @param {Date|null} [weekStart=null] - Inicio de la semana seleccionada para calcular fechas.
 * @returns {Array<Object>} Filas formateadas para la tabla de rutas.
 */
const formatRouteInfo = (routeInfo, expandMultiple = false, weekStart = null) => {
    const rows = [];

    for (const client of routeInfo) {
        const requests = client.solicitudes_recoleccion ?? [];

        if (expandMultiple && requests.length > 0) {
            for (const request of requests) {
                rows.push(buildRow(client, request, weekStart));
            }
        } else {
            rows.push(buildRow(client, pickRequestForWeek(requests, weekStart), weekStart));
        }
    }

    if (expandMultiple) {
        rows.sort((a, b) => {
            const dateA = a.fecha ? new Date(a.fecha) : new Date(0);
            const dateB = b.fecha ? new Date(b.fecha) : new Date(0);
            return dateB - dateA;
        });
    }

    return rows.map((row) => ({
        ...row,
        fecha: formatDate(row.fecha),
    }));
};

/**
 * Modelo de acceso a datos para las rutas registradas en el sistema.
 *
 * @namespace Route
 */
module.exports = class Route {

    static async findAllDaysOfRoute(){
        const daysOfRoutes = await prisma.ruta.findMany({
            select: {
                id_ruta: true,
                dia_ruta: true,
            }
        });

        return daysOfRoutes;
    }

    static async getRoutesInfo(dayOffset = 0) {
        try{

            if (!Number.isInteger(dayOffset)) {
                throw new Error(`dayOffset inválido: se esperaba un número entero, se recibió "${dayOffset}"`);
            }

            const now = new Date();

            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + dayOffset);

            const todayName = WEEK_DAYS[targetDate.getDay()];

            const startOfWeek = new Date(targetDate);
            startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            endOfWeek.setHours(0, 0, 0, 0);

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
                        // Orden determinista como salvaguarda: si llegara a
                        // existir más de una solicitud para la misma semana
                        // (no debería ocurrir con las protecciones de
                        // createInitialCollectionRequest), prioriza la
                        // completada/con más avance sobre una abandonada,
                        // en vez de depender del orden no garantizado de
                        // Postgres.
                        orderBy: [
                            { estatus: 'desc' },
                            { fecha: 'desc' },
                        ],
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
        } catch(error){
            console.error('Error in getRoutesInfo:', error);
            throw new Error('Error obteniendo rutas');
        }
    }

    static async getFilteredRoutesInfo({ weekIndex, dayName } = {}) {
        try {
            const now = new Date();
            const weeks = getLastTwoMonthsWeeks(now);

            const isAllWeeks = weekIndex === null || weekIndex === undefined;

            let dateFilter = {};
            let weekStart = null;

            if (!isAllWeeks) {
                if (weekIndex < 0 || weekIndex >= weeks.length)
                    throw new Error(`Index fuera de rango. Válido: 0 - ${weeks.length - 1}`);

                const { weekStart: ws } = weeks[weekIndex];
                weekStart = ws;

                const expandedStart = new Date(ws);
                expandedStart.setUTCDate(expandedStart.getUTCDate() - 2);

                const expandedEnd = new Date(ws);
                expandedEnd.setUTCDate(expandedEnd.getUTCDate() + 5);

                dateFilter = { gte: expandedStart, lt: expandedEnd };
            } else {
                const twoMonthsAgo = weeks[0].weekStart;
                const weekEnd = weeks[weeks.length - 1].weekEnd;
                dateFilter = { gte: twoMonthsAgo, lt: weekEnd };
            }

            const effectiveDay = dayName ?? WEEK_DAYS[now.getDay()];
            const rutaFilter = { dia_ruta: { startsWith: effectiveDay } };

            const routeInfo = await prisma.cliente.findMany({
                where: {
                    usuarios_cp: { is: { estatus: true } },
                    ruta: rutaFilter,
                },
                select: {
                    id_cliente: true,
                    id_ruta: true,
                    orden_horario: true,
                    usuarios_cp: {
                        select: { nombre: true, apellido: true },
                    },
                    ruta: {
                        select: { id_ruta: true, dia_ruta: true },
                    },
                    solicitudes_recoleccion: {
                        where: { fecha: dateFilter },
                        orderBy: [
                            { estatus: 'desc' },
                            { fecha: 'desc' },
                        ],
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
                                select: { id_pago: true, tipo: true },
                            },
                            productos_solicitud: {
                                select: {
                                    id_producto: true,
                                    cantidad: true,
                                    productos_extra: {
                                        select: { nombre: true, orden: true, color: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: [
                    { ruta: { id_ruta: "asc" } },
                    { orden_horario: "asc" },
                ],
            });

            return formatRouteInfo(routeInfo, isAllWeeks, weekStart);

        } catch (error) {
            throw new Error(`Error obteniendo rutas filtradas: ${error.message}`);
        }
    }

    static async getRouteDateForWeekAndClient(weekIndex, clientId) {
        if (weekIndex === null || weekIndex === undefined) {
            throw new Error("Debes seleccionar una semana específica para crear una solicitud manual.");
        }

        const weeks = getLastTwoMonthsWeeks();

        if (weekIndex < 0 || weekIndex >= weeks.length) {
            throw new Error(`Index fuera de rango. Válido: 0 - ${weeks.length - 1}`);
        }

        const { weekStart } = weeks[weekIndex];

        const client = await prisma.cliente.findUnique({
            where: { id_cliente: clientId },
            select: { ruta: { select: { dia_ruta: true } } },
        });

        if (!client?.ruta?.dia_ruta) {
            throw new Error("El cliente no tiene una ruta asignada.");
        }

        const dateStr = getRouteDateForDay(client.ruta.dia_ruta, weekStart);

        if (!dateStr) {
            throw new Error("No se pudo calcular la fecha de ruta.");
        }

        return new Date(dateStr);
    }

    static getCurrentWeekIndex() {
        return getCurrentWeekIndex();
    }

    static getAvailableWeeks(){
        return getLastTwoMonthsWeeks();
    }

    static async generateConfirmationMessages({ weekIndex, dayName } = {}){
        try {
            const filteredRoutes = await this.getFilteredRoutesInfo({ weekIndex, dayName });

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

module.exports.getRouteDateForDay = getRouteDateForDay;
module.exports.getLastTwoMonthsWeeks = getLastTwoMonthsWeeks;
module.exports.getCurrentWeekIndex = getCurrentWeekIndex;