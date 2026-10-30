const { sortRouteCatalog } = require('../../../utils/routeCatalogOrder');

describe('catálogo de rutas: día y orden', () => {
    const routes = [
        { id_ruta: 12, dia_ruta: 'Domingo', orden: 1 },
        { id_ruta: 8, dia_ruta: 'Miércoles 1 - A', turno_ruta: 'Mañana', orden: 7 },
        { id_ruta: 9, dia_ruta: 'Lunes - Z', turno_ruta: 'Tarde', orden: 3 },
        { id_ruta: 2, dia_ruta: 'Lunes - A', turno_ruta: 'Mañana', orden: 4 },
        { id_ruta: 4, dia_ruta: 'Ruta: MIERCOLES 10', turno_ruta: 'Tarde', orden: 6 },
        { id_ruta: 6, dia_ruta: 'Jueves', orden: 8 },
        { id_ruta: 7, dia_ruta: 'Viernes', orden: 9 },
        { id_ruta: 10, dia_ruta: '  SÁBADO - especial ', orden: 10 },
        { id_ruta: 1, dia_ruta: 'Martes', orden: 5 },
        { id_ruta: 3, dia_ruta: 'Sin día conocido', orden: 2 },
    ];
    const expectedIds = [9, 2, 1, 4, 8, 6, 7, 10, 12, 3];

    it.each([
        ['entrada original', routes],
        ['entrada invertida', [...routes].reverse()],
        ['entrada rotada', [...routes.slice(4), ...routes.slice(0, 4)]],
    ])('ordena lunes a domingo con %s', (_, input) => {
        expect(sortRouteCatalog(input).map(route => route.id_ruta)).toEqual(expectedIds);
    });

    it('prioriza orden sobre ID, turno, nombre y sufijos numéricos', () => {
        const result = sortRouteCatalog(routes);
        expect(result.slice(0, 2).map(route => route.id_ruta)).toEqual([9, 2]);
        expect(result.slice(3, 5).map(route => route.id_ruta)).toEqual([4, 8]);
    });

    it('reconoce acentos compuestos, descompuestos y separadores', () => {
        const input = [
            { dia_ruta: 'DOMINGO', orden: 1 },
            { dia_ruta: 'Especial/Sa\u0301bado-2', orden: 2 },
            { dia_ruta: 'mie\u0301rcoles', orden: 3 },
        ];
        expect(sortRouteCatalog(input)).toEqual([input[2], input[1], input[0]]);
    });

    it('coloca días desconocidos al final, únicamente por orden', () => {
        const input = [
            { dia_ruta: null, orden: 3 },
            { dia_ruta: 'Superlunes', orden: 1 },
            { dia_ruta: 'Domingo', orden: 2 },
        ];
        expect(sortRouteCatalog(input)).toEqual([input[2], input[1], input[0]]);
    });

    it('no modifica el arreglo, los objetos ni sus identificadores', () => {
        const input = Object.freeze(routes.map(route => Object.freeze({ ...route })));
        const snapshot = JSON.stringify(input);
        const result = sortRouteCatalog(input);
        expect(JSON.stringify(input)).toBe(snapshot);
        expect(result).not.toBe(input);
        expect(result.every(route => input.includes(route))).toBe(true);
    });

    it('acepta un catálogo vacío', () => {
        expect(sortRouteCatalog([])).toEqual([]);
    });
});
