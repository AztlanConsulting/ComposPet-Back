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
     * Obtiene la información cliente asociado al id de usuario proporcionado,
     * incluyendo el dia de ruta asignada al cliente
     *
     * @async
     * @static
     * @param {string} userId - Id del usuario.
     * @returns {Promise<Object|null>} Objeto con el id del cliente o `null` si no existe.
     */
    static async getClientByUserId(userId) {
        //obtiene la información del cliente dependiendo del id de usuario
        const client = await prisma.cliente.findUnique({
            where: {
                id_usuario: userId,
            },
            select: {
                id_cliente: true,
                id_ruta: true,
                ruta: {
                    select: {
                        dia_ruta: true,
                    },
                },
            }
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
            orderBy: [
                {
                    usuarios_cp: {
                        estatus: "desc",
                    }
                },
                {
                    usuarios_cp: {
                        nombre: "desc",
                    }
                }
            ],
            select: {
                id_cliente: true,
                mascotas: true,
                familia: true,
                direccion: true,
                notas: true,

                usuarios_cp: {
                select: {
                    id_usuario: true,
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
                    id_ruta: true,
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
            userId: client.usuarios_cp.id_usuario,
            pets: client.mascotas,
            family: client.familia,
            address: client.direccion,
            notes: client.notas,

            name: client.usuarios_cp.nombre + ' ' + client.usuarios_cp.apellido,
            cellphone: client.usuarios_cp.telefono,
            status: client.usuarios_cp.estatus,

            routeId: client.ruta.id_ruta,
            route: client.ruta ? client.ruta.dia_ruta : null,

            balance: client.saldo ? client.saldo.saldo: null,

            lastRequest: 
                client.solicitudes_recoleccion[0]?.fecha.toISOString().slice(0,10) 
                ?? null,
        }))

        return clientList
    }

    /** Actualiza la información del usuario
     *
     * @async
     * @static
     * @param {string} userId - Id del usuario.
     * @param {string} clientId - Id del cliente.
     * @param {Object} userData - Objeto con la información del usuario.
     * @param {Object} clientData - Objeto con la información del cliente.
     * @param {Object} balanceData - Objeto con la información del saldo del cliente.
     * @returns {Promise<Boolean>} - success
     */
    static async updateClient(
        userId, 
        clientId, 
        userData, 
        clientData, 
        balanceData,
    ){
        try {
            await prisma.$transaction(async (tx) => {

                if(Object.keys(userData).length){
                    await tx.usuarios_cp.update({
                        where: {
                            id_usuario: userId,
                        },
                        data: userData,
                    });
                }

                if(Object.keys(clientData).length){
                    await tx.cliente.update({
                        where: {
                            id_cliente: clientId,
                        },
                        data: clientData,
                    })
                }

                if(Object.keys(balanceData).length){
                    await tx.saldo.update({
                        where: {
                            id_cliente: clientId,
                        },
                        data: balanceData,
                    })
                }

            })
        } catch(error){
            console.log(error)
        } finally {
            return true;
        }
    }

};
