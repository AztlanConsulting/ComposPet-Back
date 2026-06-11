const priceOptions = require("./bucketPriceOptions");

/**
 * Validaciones de datos para la modificación de clientes y solicitudes de recolección
 * @returns {Boolean} -  valor válido / no válido
 */

const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

const containsEmoji = (value = '') =>
    emojiRegex.test(value);

const isValidPhone = (value) =>
    /^\+?\d{10,15}$/.test(value);

const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidAddress = (value) =>
    /^(?=.*[A-Za-zÀ-ÿ])[A-Za-zÀ-ÿ0-9.,#\-\s]{5,150}$/.test(value);

const isValidSchedule = (value) =>
    /^(0?[1-9]|1[0-2]):[0-5]\d$/.test(value);

const normalizeText = (value = '') =>
    String(value).trim();

const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const isPositiveInteger = (value) =>
    Number.isInteger(Number(value)) && Number(value) > 0;

const optionalText = (body, key) =>
    body[key] !== undefined && body[key] !== null
        ? normalizeText(body[key])
        : null;

const validateEditClient = (body) => {
    const errors = {};

    const cellphone = optionalText(body, 'cellphone');
    const email     = optionalText(body, 'email');
    const address   = optionalText(body, 'address');
    const pets      = optionalText(body, 'pets');
    const family    = optionalText(body, 'family');
    const notes     = optionalText(body, 'notes');
    const routeId   = body.routeId !== undefined ? Number(body.routeId) : null;
    const priceType = body.priceType;

    if (cellphone !== null) {
        if (!cellphone) {
            errors.cellphone = 'El campo teléfono es requerido.';
        } else if (!isValidPhone(cellphone)) {
            errors.cellphone = 'El campo teléfono debe ser válido.';
        }
    }

    if (priceType !== null){
        if (!priceType) {
            errors.priceType = 'El tipo de precio es requerido';
        } else if (!Object.values(priceOptions).includes(priceType)) {
            errors.priceType = 'El tipo de precio es inválido';
        }
    }

    if (email !== null) {
        if (!email) {
            errors.email = 'El campo correo electrónico es requerido.';
        } else if (!isValidEmail(email.toLowerCase())) {
            errors.email = 'El campo correo electrónico debe ser válido.';
        }
    }
    
    if (address !== null) {
        if (!address) {
            errors.address = 'El campo dirección es requerido.';
        } else if (containsEmoji(address)) {
            errors.address = 'El campo dirección no puede contener emojis.';
        } else if (!isValidAddress(address)) {
            errors.address = 'El campo dirección debe ser válido.';
        }
    }
    
    if (body.pets !== undefined && body.pets !== null) {
        if (body.pets !== '' && String(body.pets).trim() === '') {
            errors.pets = 'El campo mascotas no puede contener solo espacios.';
        } else if (containsEmoji(pets)) {
            errors.pets = 'El campo mascotas no puede contener emojis.';
        } else if (pets.length > 100) {
            errors.pets = 'El campo mascotas es demasiado largo.';
        }
    }
    
    if (body.family !== undefined && body.family !== null) {
        if (body.family !== '' && String(body.family).trim() === '') {
            errors.family = 'El campo familia no puede contener solo espacios.';
        } else if (containsEmoji(family)) {
            errors.family = 'El campo familia no puede contener emojis.';
        } else if (family.length > 100) {
            errors.family = 'El campo familia es demasiado largo.';
        }
    }

    if (notes !== null) {
        if (containsEmoji(notes)) {
            errors.notes = 'Las notas no pueden contener emojis.';
        } else if (notes.length > 500) {
            errors.notes = 'Ingresa máximo 500 caracteres.';
        }
    }

    if (routeId !== null && !isPositiveInteger(routeId)) {
        errors.routeId = 'Ruta inválida.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        data: {
            cellphone: cellphone !== null ? escapeHtml(cellphone) : undefined,
            email:     email     !== null ? email.toLowerCase()   : undefined,
            address:   address   !== null ? escapeHtml(address)   : undefined,
            pets:      pets      !== null ? escapeHtml(pets)      : undefined,
            family:    family    !== null ? escapeHtml(family)    : undefined,
            notes:     notes     !== null ? escapeHtml(notes)     : undefined,
            routeId:   routeId   !== null ? routeId               : undefined,
        },
    };
};

const validateRequestUpdate = (data) => {
    const errors = {};

    const collectedBuckets = Number(data.collectedBuckets);
    const deliveredBuckets = Number(data.deliveredBuckets);
    const totalPaid = Number(data.totalPaid);

    const notes = normalizeText(data.notes);
    const schedule = normalizeText(data.schedule);

    if (
        data.collectedBuckets === null ||
        data.collectedBuckets === undefined
    ) {
        errors.collectedBuckets = 'Las cubetas son obligatorias.';
    } else if (isNaN(collectedBuckets)) {
        errors.collectedBuckets =
            'El número de cubetas debe de ser un número.';
    } else if (collectedBuckets > 100) {
        errors.collectedBuckets =
            'Las cubetas recolectadas no pueden ser más de 100.';
    }

    if (
        data.deliveredBuckets === null ||
        data.deliveredBuckets === undefined
    ) {
        errors.deliveredBuckets = 'Las cubetas son obligatorias.';
    } else if (isNaN(deliveredBuckets)) {
        errors.deliveredBuckets =
            'El número de cubetas debe de ser un número.';
    } else if (deliveredBuckets < 0) {
        errors.deliveredBuckets =
            'El número de cubetas debe de ser positivo.';
    } else if (deliveredBuckets > 20) {
        errors.deliveredBuckets =
            'Las cubetas a entregar no pueden ser más de 20.';
    }

    if (data.totalPaid !== undefined && data.totalPaid !== null) {
        if (isNaN(totalPaid)) {
            errors.totalPaid = 'El total pagado debe de ser un número.';
        } else if (totalPaid < 0) {
            errors.totalPaid = 'El total pagado debe de ser positivo.';
        } else if (totalPaid > 1000000) {
            errors.totalPaid = 'Ingrese un valor real.';
        }
    }

    if (notes) {
        if (containsEmoji(notes)) {
            errors.notes = 'Las notas no pueden contener emojis.';
        } else if (notes.length > 500) {
            errors.notes = 'Ingresa máximo 500 caracteres.';
        }
    }

    if (schedule) {
        if (containsEmoji(schedule)) {
            errors.schedule = 'El horario no puede contener emojis.';
        } else if (!isValidSchedule(schedule)) {
            errors.schedule = 'Ingresa un horario con el formato HH:MM (12 hrs.)';
        }
    }

    if (
        data.extraProductsArray &&
        typeof data.extraProductsArray === 'object'
    ) {
        Object.entries(data.extraProductsArray).forEach(
            ([productId, quantity]) => {
                const parsedQuantity = Number(quantity);

                if (isNaN(parsedQuantity)) {
                    errors[`extraProductsArray.${productId}`] =
                        'La cantidad debe de ser un número.';
                } else if (parsedQuantity < 0) {
                    errors[`extraProductsArray.${productId}`] =
                        'La cantidad no puede ser negativa.';
                }
            }
        );
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitizedData: {
            ...data,
            notes: escapeHtml(notes),
            schedule: escapeHtml(schedule),
        },
    };
};

module.exports = {
    validateEditClient,
    validateRequestUpdate,
};