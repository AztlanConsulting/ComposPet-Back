/**
 * Registra un evento en bitácora únicamente si el usuario tiene rol de administrador.
 * Evita generar registros innecesarios para usuarios sin privilegios elevados.
 *
 * @param {object|null} user - Usuario autenticado. Si es `null` o no tiene rol, no se registra nada.
 * @param {string} accion - Código de la acción a registrar (e.g. `'LOGIN_EXITOSO'`).
 * @param {string|null} [detalle=null] - Información adicional sobre el evento.
 * @returns {Promise<void>}
 * @see AuthModel.addLog
 */

const logIfAdmin = async (user, accion, detalle = null) => {
    if (user && user.roles?.nombre === 'administrador') {
        await AuthModel.addLog(user.id_usuario, accion, detalle);
    }
};

module.exports = {logIfAdmin};