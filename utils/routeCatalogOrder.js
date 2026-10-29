const WEEK_DAYS = [
    'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
];

/** Reconoce el día como palabra, sin exigir un formato de nombre de ruta. */
function getRouteDayIndex(name) {
    const words = String(name ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .match(/[a-z]+/g) ?? [];
    const day = words.find(word => WEEK_DAYS.includes(word));
    return day === undefined ? WEEK_DAYS.length : WEEK_DAYS.indexOf(day);
}

/**
 * Ordena únicamente el catálogo: lunes a domingo y prioridad explícita.
 * Los días desconocidos quedan al final. No modifica el arreglo recibido.
 * `orden` es obligatorio y único en la base de datos.
 */
function sortRouteCatalog(routes) {
    return [...routes].sort((a, b) =>
        getRouteDayIndex(a.dia_ruta) - getRouteDayIndex(b.dia_ruta)
        || a.orden - b.orden
    );
}

module.exports = { sortRouteCatalog };
