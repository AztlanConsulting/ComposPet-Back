const prisma = require('../../config/prisma')

const AuthModel = {

    findUserByEmail: async (correo) => {
        return await prisma.usuarios_cp.findUnique({
            where: {
                correo: correo.trim(),
                estatus: true,
            },
            include: {
                roles: {
                    select: { nombre: true }
                }
            }
        });
    },

    updateLoginTry: async (id_usuario, intentos_fallidos) => {
        return await prisma.usuarios_cp.update({
            where: { id_usuario },
            data: { intentos_fallidos }
        });
    },

    lockAccount: async (id_usuario) => {
        const bloqueado_hasta = new Date(Date.now() + 15 * 60 * 1000);
        return await prisma.usuarios_cp.update({
            where: { id_usuario },
            data: {
                bloqueado_hasta,
                intentos_fallidos: 0,
            }
        });
    },

    resetLoginTry: async (id_usuario) => {
        return await prisma.usuarios_cp.update({
            where: { id_usuario },
            data: {
                intentos_fallidos: 0,
                bloqueado_hasta: null,
            }
        });
    },

    addLog: async (app_user_id, accion, detalle = null) => {
        return await prisma.bitacora.create({
            data: {
                origen: 'API',
                accion,
                tabla_afectada: 'usuarios_cp',
                app_user_id,
                db_user: 'app_user',
                detalle,
            }
        });
    },
};

module.exports = AuthModel;