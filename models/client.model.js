/**
 * Modelo de acceso a datos para el módulo de clientes
 * Encapsula todas las operaciones sobre la tabla `cliente` y `bitacora`
 * relacionadas con el flujo del cliente,
 * de la tabla de cliente y la auditoría necesaria
 *
 * Todas las operaciones son realizadas mediante el cliente Prisma configurado
 * en `config/prisma`
 *
 * @namespace Client
 */

const prisma = require("../config/prisma");

module.exports = class Client {
    /**
     * Obtiene el cliente asociado al id de usuario proporcionado.
     *
     * @async
     * @static
     * @param {string} userId - Id del usuario.
     * @returns {Promise<Object|null>} Objeto con el id del cliente o `null` si no existe.
     */
    static async getClientByUserId(userId) {
        //obtiene el cliente dependiendo del id de usuario
        const client = await prisma.cliente.findUnique({
            where: {
                id_usuario: userId,
            },
        });

        return client;
    }

    /**
     * Crea un nuevo registro de cliente en la base de datos vinculado a un usuario existente.
     * Los campos `mascotas`, `familia` y `notas` son opcionales; si no se proporcionan.
     *
     * @param {number} id_usuario - Identificador del usuario al que se asocia el cliente.
     * @param {number} id_ruta - Identificador de la ruta de reparto asignada al cliente.
     * @param {string|null} pets - Información sobre las mascotas del cliente. Opcional.
     * @param {string|null} family - Información sobre el grupo familiar del cliente. Opcional.
     * @param {string} address - Dirección de entrega del cliente.
     * @param {string|null} notes - Notas adicionales sobre el cliente. Opcional.
     * @returns {Promise<Object>} Objeto con los datos del cliente recién creado.
     * @see User.createNewUser
     * @see Credit.createInitialCredit
     */
    static async createNewClient(id_usuario, id_ruta, pets, family, address, notes) {
        const newClient = await prisma.cliente.create({
            data: {
                id_usuario: id_usuario,
                id_ruta: id_ruta,
                mascotas: pets || null,
                familia: family || null,
                direccion: address,
                notas: notes || null,
                fecha_entrada: new Date(),
            },
        });

        return newClient;
    }

};