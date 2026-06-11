/**
 * Formatea una fecha al formato DD-MM-YY.
 *
 * @param {Date|string|null|undefined} dateValue
 * @returns {string|null}
 */
const formatDate = (dateValue) => {
    if (!dateValue) {
        return null;
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return null;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());

    return `${day}-${month}-${year}`;
};

module.exports = {
    formatDate,
};