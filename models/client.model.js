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
const { formatDate } = require("../utils/formatDate");

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
                usuarios_cp: {
                    select: {
                        nombre: true,
                    },
                },
                ruta: {
                    select: {
                        dia_ruta: true,
                    },
                },
            },
        });

        return client;
    }

    /**
     * Obtiene la información cliente asociado al id de cliente proporcionado,
     *
     * @async
     * @static
     * @param {string} clientId - Id del cliente.
     * @returns {Promise<Object|null>} Objeto con el id del cliente o `null` si no existe.
     */
    static async getClientById(clientId) {
        const client = await prisma.cliente.findUnique({
            where: {
                id_cliente: clientId,
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
    static async createNewClient(id_usuario, id_ruta, pets, family, address, notes,  priceType,) {
        const lastClient = await prisma.cliente.findFirst({
            where: {
                id_ruta: id_ruta,
            },
            orderBy: {
                orden_horario: "desc",
            },
            select: {
                orden_horario: true,
            },
        });

        const nextOrder = (lastClient?.orden_horario ?? 0) + 1;

        const newClient = await prisma.cliente.create({
            data: {
                id_usuario: id_usuario,
                id_ruta: id_ruta,
                mascotas: pets || null,
                familia: family || null,
                direccion: address,
                notas: notes || null,
                fecha_entrada: new Date(),
                orden_horario: nextOrder,
                tipo_precio: priceType,
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
                    orden_horario: "asc",
                }
            ],
            select: {
                id_cliente: true,
                mascotas: true,
                familia: true,
                direccion: true,
                notas: true,
                orden_horario: true,
                tipo_precio: true,

                usuarios_cp: {
                select: {
                    id_usuario: true,
                    nombre: true,
                    apellido: true,
                    telefono: true,
                    estatus: true,
                    correo: true,
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

            const clientList = clientListRaw.map(client => {
                const originalDate =
                    client.solicitudes_recoleccion[0]?.fecha;
        
                const formattedDate =
                    formatDate(originalDate);
        
                return {
                    clientId: client.id_cliente,
                    userId: client.usuarios_cp.id_usuario,
                    pets: client.mascotas,
                    family: client.familia,
                    address: client.direccion,
                    notes: client.notas,
                    order: client.orden_horario,
        
                    name:
                        client.usuarios_cp.nombre +
                        ' ' +
                        client.usuarios_cp.apellido,
        
                    cellphone: client.usuarios_cp.telefono,
                    status: client.usuarios_cp.estatus,
                    email: client.usuarios_cp.correo,
        
                    routeId: client.ruta.id_ruta,
                    route: client.ruta
                        ? client.ruta.dia_ruta
                        : null,
                    priceType: client.tipo_precio,

                    balance: client.saldo
                        ? client.saldo.saldo
                        : null,
        
                    lastRequest: formattedDate,
                };
            });
        
            return clientList;
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
            return await prisma.$transaction(async (tx) => {

                const actualClient = await tx.cliente.findUnique({
                    where: {
                        id_cliente: clientId,
                    },
                    select: {
                        id_ruta: true,
                        orden_horario: true,
                        usuarios_cp: {
                            select: {
                                estatus: true,
                            }
                        }
                    }
                })

                if(userData.correo !== undefined){
                    const existingEmails = await tx.usuarios_cp.findFirst({
                        where: {
                            correo: userData.correo,
                            id_usuario: {
                                not: userId,
                            }
                        },
                        select: {
                            id_usuario: true,
                            correo: true,
                        }
                    });

                    if(existingEmails){
                        throw new Error("El correo " + userData.correo + " ya está registrado.");
                    }
                }



                const oldStatus = actualClient.usuarios_cp.estatus;
                const newStatus = userData.estatus;
                const wasDeactivated = oldStatus === true && newStatus === false;

                const newOrder = clientData.orden_horario;
                const oldOrder = actualClient.orden_horario;
                const newRouteId = clientData.id_ruta;
                const oldRouteId = actualClient.id_ruta;

                const orderChanged = clientData.orden_horario !== undefined && newOrder !== oldOrder;
                const routeChanged = clientData.id_ruta !== undefined && newRouteId !== oldRouteId;

                if(wasDeactivated){
                    await this.moveClientToLastOrder(
                        tx,
                        clientId,
                        oldRouteId,
                        oldOrder,
                    );

                    delete clientData.orden_horario;
                }

                if(!wasDeactivated){
                    if(routeChanged){
                        await this.handleRouteChange(
                            tx,
                            clientId,
                            oldRouteId,
                            oldOrder,
                            newRouteId,
                        );

                        delete clientData.orden_horario;
                        delete clientData.id_ruta;
                    }
                    else if(orderChanged) {
                        await this.handleOrderChange(
                            tx,
                            clientId,
                            oldRouteId,
                            oldOrder,
                            newOrder,
                        );
                    }
                }

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

                return true;

            })
        } catch(error){
            console.error(error);
            throw error;
        }
    }

    static async handleOrderChange(
        tx,
        clientId,
        routeId,
        oldOrder,
        newOrder,
    ){
        if(oldOrder == null){
            await tx.cliente.updateMany({
                where: {
                    id_ruta: routeId,
                    id_cliente: {
                        not: clientId,
                    },
                    orden_horario: {
                        gte: newOrder,
                    }
                },
                data: {
                    orden_horario: {
                        increment: 1,
                    }
                }
            });

            return;
        }

        if(newOrder == null){
            return;
        }

        if(newOrder > oldOrder){
            await tx.cliente.updateMany({
                where: {
                    id_ruta: routeId,
                    id_cliente: {
                        not: clientId,
                    },
                    orden_horario: {
                        gt: oldOrder,
                        lte: newOrder,
                    }
                },
                data: {
                    orden_horario: {
                        decrement: 1,
                    }
                }
            });
        }

        if(newOrder < oldOrder){
            await tx.cliente.updateMany({
                where: {
                    id_ruta: routeId,
                    id_cliente: {
                        not: clientId,
                    },
                    orden_horario: {
                        gte: newOrder,
                        lt: oldOrder,
                    }
                },
                data: {
                    orden_horario: {
                        increment: 1,
                    }
                }
            });
        }
    }

    static async handleRouteChange(
        tx,
        clientId,
        oldRouteId,
        oldOrder,
        newRouteId,
    ){

        if (oldOrder != null) {
            await tx.cliente.updateMany({
                where: {
                    id_ruta: oldRouteId,
                    id_cliente: {
                        not: clientId,
                    },
                    orden_horario: {
                        gt: oldOrder,
                    }
                },
                data: {
                    orden_horario: {
                        decrement: 1,
                    }
                }
            });
        }

        await tx.cliente.updateMany({
            where: {
                id_ruta: oldRouteId,
                id_cliente: {
                    not: clientId,
                },
                orden_horario: {
                    gt: oldOrder,
                }
            },
            data: {
                orden_horario: {
                    decrement: 1,
                }
            }
        });

        const lastClient = await tx.cliente.findFirst({
            where: {
                id_ruta: newRouteId,
                id_cliente: {
                    not: clientId,
                },
                orden_horario: {
                    not: null,
                }
            },
            orderBy: {
                orden_horario: "desc"
            },
            select: {
                orden_horario: true,
            }
        });

        const lastOrder =
            (lastClient?.orden_horario ?? 0) + 1;

        await tx.cliente.update({
            where: {
                id_cliente: clientId,
            },
            data: {
                id_ruta: newRouteId,
                orden_horario: lastOrder,
            }
        });
    }

    static async moveClientToLastOrder(
        tx,
        clientId,
        routeId,
        oldOrder,
    ){

        if(oldOrder == null){
            const lastClient = await tx.cliente.findFirst({
                where: {
                    id_ruta: routeId,
                    id_cliente: {
                        not: clientId,
                    },
                },
                orderBy: {
                    orden_horario: "desc",
                },
                select: {
                    orden_horario: true,
                }
            })

            const lastOrder = (lastClient?.orden_horario ?? 0) + 1;

            await tx.cliente.update({
                where: {
                    id_cliente: clientId,
                },
                data: {
                    orden_horario: lastOrder,
                }
            });

            return;
        }

        await tx.cliente.updateMany({
            where: {
                id_ruta: routeId,
                id_cliente: {
                    not: clientId,
                },
                orden_horario: {
                    gt: oldOrder,
                }
            },
            data: {
                orden_horario: {
                    decrement: 1,
                }
            }
        });

        const lastClient = await tx.cliente.findFirst({
            where: {
                id_ruta: routeId,
                id_cliente: {
                    not: clientId,
                },
                orden_horario: {
                    not: null,
                }
            },
            orderBy: {
                orden_horario: "desc"
            },
            select: {
                orden_horario: true,
            }
        });

        const lastOrder =
            (lastClient?.orden_horario ?? 0) + 1;

        await tx.cliente.update({
            where: {
                id_cliente: clientId,
            },
            data: {
                orden_horario: lastOrder,
            }
        });  
    }

    static async getCompostStatus(){
        const compostStatus = await prisma.productos_extra.findMany({
            where:{
                id_producto:{
                    in: [2, 3],
                },
            },
            select:{
                estatus: true,
            },
        });

        if (compostStatus.length !== 2) {
        return false;
    }

        const isEnabled = compostStatus.every(
            product => product.estatus === true
        );

        return isEnabled;
    };

    static async updateCompostStatus(newStatus){
        const updateResult = await prisma.productos_extra.updateMany({
            where:{
                id_producto:{
                    in:[2,3],
                },
            },
            data:{
                estatus: newStatus,
            }
        })
        return updateResult;
    };

    static async getBucketCost(clientId, quantity, tx = prisma) {
        const { tipo_precio } = await tx.cliente.findUnique({
            where: {
                id_cliente: clientId,
            },
            select: {
                tipo_precio: true,
            }
        });

        if (!tipo_precio) {
            throw new Error(
                "El cliente no tiene un tipo de precio establecido"
            );
        }

        const price = await tx.precios_cubetas.findFirst({
            where: {
                cantidad: quantity,
            },
            select: {
                [tipo_precio]: true,
            }
        });

        if (!price) {
            throw new Error(
                "No existe configuración de precio para esta cantidad de cubetas"
            );
        }

        const cost = price[tipo_precio];

        if(cost === null || cost === undefined) {
            throw new Error(
                "El tipo de precio no está definido para la cantidad de cubetas"
            );
        }

        return cost;
    }

};
