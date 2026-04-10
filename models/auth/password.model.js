const prisma = require('../../config/prisma')

const Password = {
    /**
     * Busca un usuario que esté pendiente de su primer inicio de sesión.
     * Se utiliza para validar que el flujo de creación de contraseña solo sea
     * accesible para usuarios nuevos o reseteados por un administrador.
     * * @param {string} correo - Correo electrónico del usuario.
     * @returns {Promise<object|null>} Datos del usuario si cumple la condición, null en caso contrario.
     */
    findUserForFirstLogin: async (correo) => {
        return await prisma.usuarios_cp.findUnique({
            where: {
                correo: correo.trim(),
                primer_inicio_sesion: true,
            }
        });
    },

    /**
     * Registra el código de verificación y su expiración.
     * @function setVerificationCode
     * @param {number} id_usuario - Identificador único del usuario.
     * @param {string|null} codigo - El código generado para la validación (o null para limpiar).
     * @param {Date|null} expiracion - Objeto Date que representa el momento de caducidad del código.
     * @returns {Promise<Object>} Promesa que resuelve con el objeto del usuario actualizado en Prisma.
     */
    setVerificationCode: async (id_usuario, codigo, expiracion) => {
        return await prisma.usuarios_cp.update({
            where: { id_usuario },
            data: {
                codigo_verificacion: codigo,
                codigo_expiracion: expiracion,
                intentos_fallidos: 0
            }
        });
    },

    /**
     * Finaliza el flujo de "Primer Inicio de Sesión" de manera atómica.
     * @async
     * @function completeFirstLogin
     * @param {number} id_usuario - Identificador único del usuario.
     * @param {string} nuevaContrasena - El hash de la contraseña ya procesado con bcrypt.
     * @returns {Promise<Object>} Promesa con el registro actualizado del usuario.
     */
    completeFirstLogin: async (id_usuario, nuevaContrasena) => {
        return await prisma.usuarios_cp.update({
            where: { id_usuario },
            data: {
                contrasena: nuevaContrasena,
                primer_inicio_sesion: false,
                estatus: true,
                codigo_verificacion: null,
                codigo_expiracion: null,
                intentos_fallidos: 0,
                bloqueado_hasta: null
            }
        });
    },
};

module.exports = Password;