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

    /**
     * Crea una nueva sesión activa para el usuario.
     * Calcula la fecha de expiración de manera dinámica según el rol del usuario
     * (8 horas para Administrador, 5 horas para Cliente u otros).
     *
     * @param {number} id_usuario - Identificador del usuario que inicia sesión.
     * @param {string} refresh_token - Token de refresco generado para la sesión.
     * @param {string} rol - Nombre del rol del usuario para determinar el tiempo de vida de la sesión.
     * @param {string} ip - Dirección IP desde la cual se origina la petición.
     * @returns {Promise<object>} Registro de la sesión creada.
     */
    createSession: async (id_usuario, refresh_token, rol, ip) => {
        const timeouts = {
            'Cliente': 5 * 60 * 60 * 1000,
            'Administrador': 8 * 60 * 60 * 1000,
        };
        const expires_at = new Date(Date.now() + (timeouts[rol] ?? timeouts['Cliente']));

        return await prisma.sesiones.create({
            data: {
                id_usuario,
                refresh_token,
                expira_en: expires_at,
                ip,
            }
        });
    },

    /**
     * Busca una sesión activa a través de su refresh token.
     * Incluye los datos del usuario dueño de la sesión junto con su rol respectivo.
     *
     * @param {string} refresh_token - Token de refresco asociado a la sesión.
     * @returns {Promise<object|null>} Datos de la sesión y el usuario, o `null` si no se encuentra o está inactiva.
     */
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

    /**
     * Actualiza el token de refresco, extiende el tiempo de expiración y registra
     * la última actividad de una sesión específica.
     *
     * @param {string} refresh_token - Token de refresco actual (sirve como identificador).
     * @param {string} new_token - Nuevo token de refresco que reemplazará al anterior.
     * @param {string} rol - Rol del usuario para recalcular el tiempo de expiración.
     * @returns {Promise<object>} Registro de la sesión actualizada.
     */
    updateSession: async (refresh_token, new_token, rol) => {
        const timeouts = {
            'Cliente': 5 * 60 * 60 * 1000,
            'Administrador': 8 * 60 * 60 * 1000,
        };
        const expires_at = new Date(Date.now() + (timeouts[rol] ?? timeouts['Cliente']));

        const session = await prisma.sesiones.findUnique({
            where: { refresh_token }
        });

        if (!session) {
            throw new Error('Sesión no encontrada o token inválido');
        }

        return await prisma.sesiones.update({
            where: { refresh_token },
            data: {
                refresh_token: new_token,
                ultima_actividad: new Date(),
                expira_en: expires_at,
            }
        });
    },

    /**
     * Cierra de manera lógica una sesión invalidando su token de refresco.
     * Cambia el estado `activa` a false.
     *
     * @param {string} refresh_token - Token de refresco de la sesión a cerrar.
     * @returns {Promise<object>} Objeto de Prisma con el conteo de registros actualizados.
     */
    closeSession: async (refresh_token) => {
        return await prisma.sesiones.updateMany({
            where: { refresh_token },
            data: { activa: false }
        });
    },

    /**
     * Cuenta la cantidad total de sesiones actualmente activas para un usuario específico.
     * Útil para implementar políticas de concurrencia de sesiones.
     *
     * @param {number} id_usuario - Identificador del usuario.
     * @returns {Promise<number>} Número total de sesiones activas.
     */
    countActiveSessions: async (id_usuario) => {
        return await prisma.sesiones.count({
            where: { id_usuario, activa: true }
        });
    },

    /**
     * Identifica y cierra la sesión activa más antigua de un usuario basándose
     * en la fecha de inicio (`iniciada_en`).
     *
     * @param {number} id_usuario - Identificador del usuario.
     * @returns {Promise<object|null>} Registro de la sesión desactivada, o `null` si el usuario no tenía sesiones activas.
     */
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