const prisma = require("../config/prisma");

/**
 * Modelo de acceso a datos para la gestión de usuarios del sistema.
 *
 * @namespace User
 */
module.exports = class User {

    /**
     * Busca un usuario por su correo electrónico.
     *
     * @param {string} email - Correo electrónico a buscar.
     * @returns {Promise<Object|null>} Objeto con los datos del usuario encontrado.
     * @see postRegisterClient
     */
    static async findByEmail(email){
        const existingUser = await prisma.usuarios_cp.findUnique({
            where: { 
                correo: email 
            }
        });

        return existingUser;
    }

    /**
     * Crea un nuevo usuario en el sistema con una contraseña temporal hasheada.
     * @param {string} name - Nombre del usuario.
     * @param {string} lastname - Apellido del usuario.
     * @param {string} phone - Teléfono de contacto del usuario.
     * @param {string} email - Correo electrónico del usuario. Debe ser único en el sistema.
     * @param {string} tempPassword - Contraseña temporal previamente hasheada con bcrypt.
     * @param {number} id_rol - Identificador del rol asignado al usuario.
     * @param {number} id_cp - Identificador de la empresa a la que pertenece el usuario.
     * @returns {Promise<Object>} Objeto con los datos del usuario recién creado.
     * @see postRegisterClient
     * @see Role.findRoleByName
     */
    static async createNewUser(name, lastname, phone, email, tempPassword, id_rol, id_cp){
        const newUser = await prisma.usuarios_cp.create({
            data: {
                nombre: name,
                apellido: lastname,
                telefono: phone,
                correo: email,
                contrasena: tempPassword,
                primer_inicio_sesion: true,
                estatus: true,
                id_rol: id_rol,
                id_cp: id_cp,
            }
        });

        return newUser;
    }

};