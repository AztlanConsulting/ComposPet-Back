jest.mock("../../../config/prisma", () => ({}));

const {
    getLastTwoMonthsWeeks,
    getCurrentWeekIndex,
} = require("../../../models/route.model");

describe('getCurrentWeekIndex - caso borde domingo', () => {

    it('Debe encontrar la semana correcta cuando "now" es domingo después de medianoche UTC', () => {
        // Domingo 4-oct-2026, bien entrada la tarde en UTC — el caso que
        // producía -1 antes del fix.
        const sundayAfternoon = new Date('2026-10-04T15:00:00Z');
        const weeks = getLastTwoMonthsWeeks(sundayAfternoon);
        const index = getCurrentWeekIndex(sundayAfternoon);

        expect(index).toBeGreaterThanOrEqual(0);
        expect(sundayAfternoon >= weeks[index].weekStart).toBe(true);
        // El domingo debe seguir perteneciendo a la semana que inició el
        // lunes anterior (28-sep), no a la semana siguiente.
        expect(weeks[index].weekStart).toEqual(new Date('2026-09-28T00:00:00.000Z'));
    });

    it('Debe seguir funcionando igual para "now" a la medianoche exacta del domingo', () => {
        const sundayMidnight = new Date('2026-10-04T00:00:00Z');
        const index = getCurrentWeekIndex(sundayMidnight);

        expect(index).toBeGreaterThanOrEqual(0);
    });

    it('Debe funcionar correctamente para "now" un lunes (inicio de semana)', () => {
        const monday = new Date('2026-09-28T10:00:00Z');
        const weeks = getLastTwoMonthsWeeks(monday);
        const index = getCurrentWeekIndex(monday);

        expect(index).toBeGreaterThanOrEqual(0);
        expect(weeks[index].weekStart).toEqual(new Date('2026-09-28T00:00:00.000Z'));
    });

    it('Debe funcionar correctamente para "now" un sábado (fin de semana laboral)', () => {
        const saturday = new Date('2026-10-03T10:00:00Z');
        const weeks = getLastTwoMonthsWeeks(saturday);
        const index = getCurrentWeekIndex(saturday);

        expect(index).toBeGreaterThanOrEqual(0);
        expect(weeks[index].weekStart).toEqual(new Date('2026-09-28T00:00:00.000Z'));
    });
});