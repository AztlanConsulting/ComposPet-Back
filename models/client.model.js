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
     * Obtiene el saldo del cliente con su id.
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
        })

        return balance
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
                cantidad_familia: true,
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
                    zona: {
                    select: {
                        descripcion: true,
                    }
                    }
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
            familySize: client.cantidad_familia,
            address: client.direccion,
            notes: client.notas,

            name: client.usuarios_cp.nombre + ' ' + client.usuarios_cp.apellido,
            cellphone: client.usuarios_cp.telefono,
            status: client.usuarios_cp.estatus,

            zone: client.ruta.zona.descripcion,

            balance: client.saldo.saldo,

            lastRequest: 
                client.solicitudes_recoleccion[0]?.fecha.toISOString().slice(0,10) 
                ?? null,
        }))

        return clientList
    }

}