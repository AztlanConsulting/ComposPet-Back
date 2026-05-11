const prisma = require('../../config/prisma')

/**
 * Modelo de acceso a datos para el módulo de autenticación.
 * Encapsula todas las operaciones sobre la tabla `usuarios_cp` y `bitacora`
 * relacionadas con el flujo de inicio de sesión, bloqueo de cuentas y auditoría.
 *
 * Todas las operaciones son realizadas mediante el cliente Prisma configurado
 * en `config/prisma`.
 *
 * @namespace AuthModel
 */
const AuthModel = {

    /**
     * Busca un usuario activo por su correo electrónico.
     * Solo retorna usuarios con `estatus: true`. Los usuarios inactivos
     * se tratan como inexistentes para efectos del login.
     * Incluye el nombre del rol asociado al usuario.
     *
     * @param {string} correo - Correo electrónico a buscar. Se aplica `trim()` antes de la consulta.
     * @returns {Promise<object|null>} Datos del usuario con su rol, o `null` si no existe o está inactivo.
     */
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

    /**
     * Actualiza el contador de intentos fallidos de un usuario.
     * El valor debe calcularse en el controlador antes de llamar a este método.
     *
     * @param {number} id_usuario - Identificador del usuario.
     * @param {number} intentos_fallidos - Nuevo valor del contador de intentos fallidos.
     * @returns {Promise<object>} Usuario actualizado por Prisma.
     */
    updateLoginTry: async (id_usuario, intentos_fallidos) => {
        return await prisma.usuarios_cp.update({
            where: { id_usuario },
            data: { intentos_fallidos }
        });
    },

    /**
     * Bloquea la cuenta de un usuario por `LOCK_MINUTES` minutos (15 min).
     * Calcula la fecha de desbloqueo a partir del momento actual y reinicia
     * el contador de intentos fallidos a 0.
     *
     * @param {number} id_usuario - Identificador del usuario a bloquear.
     * @returns {Promise<object>} Usuario actualizado por Prisma.
     */
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

    /**
     * Restablece el estado de seguridad del usuario tras un login exitoso.
     * Reinicia el contador de intentos fallidos y elimina la fecha de bloqueo.
     *
     * @param {number} id_usuario - Identificador del usuario.
     * @returns {Promise<object>} Usuario actualizado por Prisma.
     */
    resetLoginTry: async (id_usuario) => {
        return await prisma.usuarios_cp.update({
            where: { id_usuario },
            data: {
                intentos_fallidos: 0,
                bloqueado_hasta: null,
            }
        });
    },

    /**
     * Registra un evento de auditoría en la tabla `bitacora`.
     * Se invoca en cada punto relevante del flujo de autenticación
     * para garantizar trazabilidad completa de accesos y errores.
     *
     * @param {number|null} app_user_id - ID del usuario involucrado. `null` si el usuario no fue identificado.
     * @param {string} accion - Código de la acción registrada (e.g. `'LOGIN_EXITOSO'`, `'INTENTO_LOGIN_FALLIDO'`).
     * @param {string|null} [detalle=null] - Información adicional sobre el evento (e.g. número de intentos, correo buscado).
     * @returns {Promise<object>} Registro de bitácora creado por Prisma.
     */
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
    createSession: async (id_usuario, refresh_token, rol, ip) => {
        const timeouts = {
            'cliente': 5 * 60 * 60 * 1000,
            'Administrador': 8 * 60 * 60 * 1000,
        };
        const expires_at = new Date(Date.now() + (timeouts[rol] ?? timeouts['cliente']));

        return await prisma.sesiones.create({
            data: {
                id_usuario,
                refresh_token,
                expira_en: expires_at,
                ip,
            }
        });
    },

    findSession: async (refresh_token) => {
        return await prisma.sesiones.findFirst({
            where: { refresh_token, activa: true },
            include: {
                usuarios_cp: {
                    include: { roles: { select: { nombre: true } } }
                }
            }
        });
    },

    updateSession: async (refresh_token, new_token, rol) => {
        const timeouts = {
            'cliente': 5 * 60 * 60 * 1000,
            'Administrador': 8 * 60 * 60 * 1000,
        };
        const expires_at = new Date(Date.now() + (timeouts[rol] ?? timeouts['cliente']));

        return await prisma.sesiones.update({
            where: { refresh_token },
            data: {
                refresh_token: new_token,
                ultima_actividad: new Date(),
                expira_en: expires_at,
            }
        });
    },

    closeSession: async (refresh_token) => {
        return await prisma.sesiones.updateMany({
            where: { refresh_token },
            data: { activa: false }
        });
    },

    countActiveSessions: async (id_usuario) => {
        return await prisma.sesiones.count({
            where: { id_usuario, activa: true }
        });
    },

    closeOldestSession: async (id_usuario) => {
        const oldest = await prisma.sesiones.findFirst({
            where: { id_usuario, activa: true },
            orderBy: { iniciada_en: 'asc' },
        });
        if (oldest) {
            return await prisma.sesiones.update({
                where: { id: oldest.id },
                data: { activa: false }
            });
        }
        return null;
    },
};

module.exports = AuthModel;