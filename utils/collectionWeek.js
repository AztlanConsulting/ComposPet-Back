/**
 * Utilidades de fecha compartidas para la regla de "semana de recolección"
 * (Sábado-Viernes), usada tanto por el modelo de rutas (tabla de rutas)
 * como por el modelo de solicitudes de recolección (formulario del
 * cliente). Centralizar esta lógica aquí evita que ambos modelos queden
 * acoplados entre sí y previene que el criterio de semana vuelva a
 * desincronizarse entre distintas partes del sistema.
 */

/**
 * Calcula el lunes de la semana de recolección (Sábado-Viernes) a la que
 * pertenece una fecha dada.
 *
 * @param {Date} date - Fecha a evaluar.
 * @returns {Date} Lunes (UTC, medianoche) de la semana de recolección correspondiente.
 */
function getCollectionWeekMonday(date) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dow = d.getUTCDay();

    if (dow === 6) { // Sábado -> semana siguiente
        d.setUTCDate(d.getUTCDate() + 2);
        return d;
    }
    if (dow === 0) { // Domingo -> semana siguiente
        d.setUTCDate(d.getUTCDate() + 1);
        return d;
    }
    // Lunes a Viernes: retrocede al lunes de esa misma semana
    d.setUTCDate(d.getUTCDate() - (dow - 1));
    return d;
}

/**
 * Calcula el rango [inicio, fin) de la semana de recolección (Sábado a
 * Sábado siguiente, exclusivo) a la que pertenece una fecha dada.
 *
 * @param {Date} date - Fecha de referencia.
 * @returns {{ weekStart: Date, weekEnd: Date }}
 */
function getCollectionWeekRange(date) {
    const monday = getCollectionWeekMonday(date);

    const weekStart = new Date(monday);
    weekStart.setUTCDate(weekStart.getUTCDate() - 2); // Sábado de esa semana
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(monday);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 5); // Sábado siguiente (exclusivo)
    weekEnd.setUTCHours(0, 0, 0, 0);

    return { weekStart, weekEnd };
}

module.exports = { getCollectionWeekMonday, getCollectionWeekRange };