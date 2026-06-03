const bcrypt = require('bcrypt');
const crypto = require('crypto');

const Client = require('../../models/client.model');
const Compospet = require('../../models/compospet.model');
const Route = require('../../models/route.model');
const User = require('../../models/user.model');
const Role =  require('../../models/role.model');
const Credit = require('../../models/credit.model');

/**
 * Convierte cualquier valor recibido a string
 * y elimina los espacios del inicio y final.
 */
const normalizeText = (value = '') =>
    String(value).trim();

/**
 * Valida que el texto contenga únicamente:
 * - Letras mayúsculas/minúsculas
 * - Letras acentuadas
 * - Ñ/ñ
 * - 1 Espacio entre palabras (no permite espacios al inicio o final)
 *
 * No acepta guiones, números, ni caracteres especiales.
 */
const isOnlyLetters = (value) =>
    /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$/.test(value);

/**
 * Valida números telefónicos con:
 * - Opcional signo +
 * - Entre 10 y 15 dígitos
 */
const isValidPhone = (value) =>
    /^\+?\d{10,15}$/.test(value);

/**
 *  Valida formato básico de correo electrónico.
 *
 * Ejemplos válidos:
 * correo@test.com
 * nombre.apellido@mail.mx
 *
 * Nota:
 * No garantiza que el correo exista,
 * únicamente valida formato.
 */
const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Verifica que el valor recibido sea:
 * - Número entero
 * - Mayor que cero
 *
 * Ejemplos válidos:
 * 1, 25, "10"
 *
 * Inválidos:
 * 0, -5, 2.5, "abc"
 */
const isPositiveInteger = (value) =>
    Number.isInteger(Number(value)) && Number(value) > 0;

const validateRegisterClient = (body) => {
    const errors = {};

    const name = normalizeText(body.name);
    const lastName = normalizeText(body.lastName);
    const phone = normalizeText(body.phone);
    const email = normalizeText(body.email).toLowerCase();
    const address = normalizeText(body.address);
    const id_ruta = Number(body.id_ruta);

    const pets = normalizeText(body.pets);
    const family = normalizeText(body.family);
    const notes = normalizeText(body.notes);

    if (!name || name.length < 1 || name.length > 100 || !isOnlyLetters(name)) {
        errors.name = 'Nombre inválido.';
    }

    if (!lastName || lastName.length < 1 || lastName.length > 200 || !isOnlyLetters(lastName)) {
        errors.lastName = 'Apellido inválido.';
    }

    if (!isValidPhone(phone)) {
        errors.phone = 'El teléfono debe tener 10 dígitos.';
    }

    if (!email || email.length > 150 || !isValidEmail(email)) {
        errors.email = 'Correo inválido.';
    }

    if (!address || address.length < 5 || address.length > 255) {
        errors.address = 'Dirección inválida.';
    }

    if (!isPositiveInteger(id_ruta)) {
        errors.id_ruta = 'Ruta inválida.';
    }

    if (pets.length > 50) {
        errors.pets = 'Mascotas es demasiado largo.';
    }

    if (family.length > 50) {
        errors.family = 'Familia es demasiado largo.';
    }

    if (notes.length > 500) {
        errors.notes = 'Notas es demasiado largo.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        data: {
            name,
            lastName,
            phone,
            email,
            address,
            id_ruta,
            pets,
            family,
            notes
        },
    };
};

/**
 * Obtiene los datos necesarios para renderizar el formulario de registro de un nuevo cliente.
 * Consulta en paralelo el catálogo de días de ruta.
 * Si alguno de los catálogos está vacío, se interrumpe la respuesta con un error 404
 * para evitar que el formulario se presente con información incompleta.
 *
 * @returns {Promise<void>} Responde con un JSON que contiene los catálogos necesarios,
 * o un mensaje de error si alguno no está disponible.
 * @throws {Error} Responde con status 500 si ocurre un fallo inesperado al consultar la base de datos.
 * @see Route.findAllDaysOfRoute
 */
const getRegisterClient = async (req, res) => {

    try {
        const daysOfRoutes = await Route.findAllDaysOfRoute();

        if(!daysOfRoutes || daysOfRoutes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron días de ruta.',
            });
        }

        return res.status(200).json({
            success: true,
            data: { daysOfRoutes },
        });

    } catch (error) {
        console.error('Error en getRegisterClient:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener datos para registrar un nuevo cliente',
        })
    }
};

/**
 * Registra un nuevo cliente en el sistema junto con su usuario, ruta asignada y crédito inicial.
 * El proceso sigue este orden: validación de campos, verificación de duplicado por correo,
 * resolución del rol, búsqueda de ruta por día, obtención de la empresa,
 * creación del usuario con contraseña temporal, creación del cliente y apertura del crédito.
 * La contraseña temporal se genera con un UUID aleatorio hasheado con bcrypt,
 * por lo que el usuario deberá establecer su contraseña mediante el flujo de recuperación.
 *
 * @param {string} req.body.name - Nombre del cliente.
 * @param {string} req.body.lastName - Apellido del cliente.
 * @param {string} req.body.phone - Teléfono de contacto del cliente.
 * @param {string} req.body.email - Correo electrónico del cliente. Debe ser único en el sistema.
 * @param {string} req.body.address - Dirección de entrega del cliente.
 * @param {number} req.body.dayOfRoute - Identificador del día de ruta asignado al cliente.
 * @param {string} [req.body.pets] - Información opcional sobre las mascotas del cliente.
 * @param {string} [req.body.family] - Información opcional sobre el grupo familiar del cliente.
 * @param {string} [req.body.notes] - Notas adicionales opcionales sobre el cliente.
 * @see User.findByEmail
 * @see Role.findRoleByName
 * @see Compospet.getId
 * @see User.createNewUser
 * @see Client.createNewClient
 * @see Credit.createInitialCredit
 */
const postRegisterClient = async (req, res) => {
    try{
        const validation = validateRegisterClient(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Los datos enviados no son válidos.',
                errors: validation.errors,
            });
        }

        const {
            name,
            lastName,
            phone,
            email,
            address,
            id_ruta,
            pets,
            family,
            notes,
        } = validation.data;


        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un usuario registrado con este correo.',
            });
        }

        const roleName = await Role.findRoleByName('Cliente');
        if (!roleName) {
            return res.status(404).json({
                success: false,
                message: 'No se encontro rol de cliente.',
            });
        }

        const id_cp = await Compospet.getId();
        if (!id_cp) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la configuración de la empresa.',
            });
        }

        const tempPassword = await bcrypt.hash(crypto.randomUUID(), 10);
        const newUser = await User.createNewUser(
            name, 
            lastName, 
            phone, 
            email, 
            tempPassword,
            roleName.id_rol,
            id_cp

        );

        const newClient = await Client.createNewClient(
            newUser.id_usuario,
            parseInt(id_ruta),
            pets,
            family,
            address,
            notes,
        );

        const newCredit = await Credit.createInitialCredit(
            newClient.id_cliente
        );

        return res.status(200).json({
            success: true,
            message: 'Cliente registrado exitosamente.',
            data: {
                userId: newUser.id_usuario,
                clientId: newClient.id_cliente,
                email: newUser.correo,
                credit: newCredit.saldo,
            },
        });

    } catch (error) {
        console.error('Error en getRegisterClient:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener datos para registrar un nuevo cliente',
        })
    }
}

module.exports = {
    getRegisterClient,
    postRegisterClient,
};