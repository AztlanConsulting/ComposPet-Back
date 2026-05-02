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

    /** Obtiene el saldo del cliente con su id.
     *
     * @async
     * @static
     * @param {string} idClient - Id del cliente.
     * @returns {Promise<Object|null>} Objeto con el saldo del cliente
     */
    
    static async getClientBalance(idClient) {
        const balance = await prisma.saldo.findUnique({
            where: {
                id_cliente: idClient,
            },
        });

        return balance;
    }

    static async getClients(){
        const clientListRaw = await prisma.cliente.findMany({
            orderBy: {
                usuarios_cp: {
                    estatus: "desc"
                }
            },
            select: {
                id_cliente: true,
                mascotas: true,
                familia: true,
                direccion: true,
                notas: true,

                usuarios_cp: {
                select: {
                    nombre: true,
                    apellido: true,
                    telefono: true,
                    estatus: true
                }
                },

                saldo: {
                select: {
                    saldo: true
                }
                },

                ruta: {
                select: {
                    dia_ruta: true,
                    turno_ruta: true,
                }
                },

                solicitudes_recoleccion: {
                orderBy: {
                    fecha: "desc"
                },
                take: 1,
                select: {
                    fecha: true
                }
                }
            }
            })

        const clientList = clientListRaw.map(client => ({
            clientId: client.id_cliente,
            pets: client.mascotas,
            family: client.familia,
            address: client.direccion,
            notes: client.notas,

            name: client.usuarios_cp.nombre + ' ' + client.usuarios_cp.apellido,
            cellphone: client.usuarios_cp.telefono,
            status: client.usuarios_cp.estatus,

            route: client.ruta.dia_ruta + ' ' + client.ruta.turno_ruta,

            balance: client.saldo.saldo,

            lastRequest: 
                client.solicitudes_recoleccion[0]?.fecha.toISOString().slice(0,10) 
                ?? null,
        }))

        return clientList
    }

};
