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
     * Cuenta la cantidad de sesiones activas (Refresh Tokens) que tiene un usuario.
     * Se utiliza para validar el límite de sesiones simultáneas permitido.
     *
     * @param {string} id_usuario - UUID del usuario.
     * @returns {Promise<number>} Cantidad de registros encontrados en `refresh_tokens`.
     */
    countActiveSessions: async (id_usuario) => {
        return await prisma.refresh_tokens.count({
            where: { id_usuario }
        });
    },

    /**
     * Identifica y elimina la sesión más antigua de un usuario específico.
     * Busca el registro con la fecha de creación (`created_at`) más lejana 
     * para liberar espacio para una nueva sesión.
     *
     * @param {string} id_usuario - UUID del usuario.
     * @returns {Promise<object|null>} Registro eliminado o null si no existían sesiones.
     */
    deleteOldestSession: async (id_usuario) => {
        const oldest = await prisma.refresh_tokens.findFirst({
            where: { id_usuario },
            orderBy: { created_at: 'asc' },
            select: { id: true }
        });

        if (oldest) {
            return await prisma.refresh_tokens.delete({
                where: { id: oldest.id }
            });
        }
        return null;
    },

    /**
     * Almacena un nuevo Refresh Token en la base de datos asociado a un usuario.
     * Esto permite el control "stateful" de las sesiones JWT.
     *
     * @param {string} id_usuario - UUID del usuario.
     * @param {string} token_hash - El JWT de refresco generado.
     * @returns {Promise<object>} Registro del token creado en la base de datos.
     */
    saveRefreshToken: async (id_usuario, token_hash) => {
        return await prisma.refresh_tokens.create({
            data: {
                id_usuario,
                token_hash
            }
        });
    },

    /**
     * Elimina de forma permanente un Refresh Token de la base de datos.
     * Se invoca durante el flujo de logout para invalidar la sesión en el servidor.
     *
     * @param {string} token_hash - El token que se desea invalidar.
     * @returns {Promise<void>}
     */
    removeRefreshToken: async (token_hash) => {
        await prisma.refresh_tokens.deleteMany({
            where: { token_hash }
        });
    },

    /**
     * Verifica la existencia de un Refresh Token en la base de datos.
     * Esencial para el endpoint de /refresh, asegurando que la sesión no haya sido
     * revocada por el límite de dispositivos o por un cierre de sesión previo.
     *
     * @param {string} token_hash - El token a buscar.
     * @returns {Promise<object|null>} Datos del token si existe y es válido.
     */
    findRefreshToken: async (token_hash) => {
        return await prisma.refresh_tokens.findFirst({
            where: { token_hash }
        });
    },
};

module.exports = AuthModel;