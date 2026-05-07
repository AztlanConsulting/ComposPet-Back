const bcrypt = require('bcrypt');
const crypto = require('crypto');

const Client = require('../../models/client.model');
const Compospet = require('../../models/compospet.model');
const Route = require('../../models/route.model');
const User = require('../../models/user.model');
const Role =  require('../../models/role.model');
const Credit = require('../../models/credit.model');

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

        const {
            name: rawName,
            lastName: rawLastName,
            phone,
            email,
            pets: rawPets,
            family: rawFamily,
            address: rawAddress,
            notes: rawNotes,
            id_ruta,
        } = req.body;

        const sanitize = (str) => str?.replace(/[<>"'%;()&+]/g, '').trim() ?? '';

        const name = sanitize(rawName);
        const lastName = sanitize(rawLastName);
        const pets = sanitize(rawPets);
        const family = sanitize(rawFamily);
        const address = sanitize(rawAddress);
        const notes = sanitize(rawNotes);

        if (!name || !lastName || !phone || !email || !address || !id_ruta) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para registrar al cliente.',
            });
        }

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