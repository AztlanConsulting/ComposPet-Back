const prisma = require('../../config/prisma')

const Password = {
    /**
     * Busca un usuario por correo y filtra por su estado de primer inicio.
     * @param {string} correo 
     * @param {boolean} isFirstLogin - true para nuevos, false para recuperación normal.
     */
    findUserByStatus: async (correo, isFirstLogin) => {
        return await prisma.usuarios_cp.findUnique({
            where: {
                correo: correo.trim(),
                primer_inicio_sesion: isFirstLogin,
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

    /**
     * Actualiza exclusivamente la contraseña de un usuario.
     * Se utiliza en el flujo de recuperación de contraseña para usuarios que 
     * ya tienen su cuenta activa.
     * * @async
     * @function updateOnlyPassword
     * @param {number} id - Identificador único del usuario (id_usuario).
     * @param {string} hashedPassword - Hash de la nueva contraseña ya encriptada.
     * @returns {Promise<Object>} Promesa que resuelve con el objeto del usuario actualizado.
     */
    updateOnlyPassword: async (id, hashedPassword) => {
        return await prisma.usuarios_cp.update({
            where: { id_usuario: id },
            data: { contrasena: hashedPassword }
        });
    },
};

module.exports = Password;