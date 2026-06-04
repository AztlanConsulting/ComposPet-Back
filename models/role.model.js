const prisma = require("../config/prisma");

/**
 * Modelo de acceso a datos para la gestión de roles del sistema.
 *
 * @namespace Role
 */
module.exports = class Role {

    /**
     * Busca un rol por su nombre exacto en la base de datos.
     *
     * @param {string} name - Nombre exacto del rol a buscar.
     * @returns {Promise<Object|null>} Objeto con los datos del rol encontrado, o `null` si no existe.
     * @see postRegisterClient
     */
    static async findRoleByName(name){
        const roleName =  await prisma.roles.findFirst({
            where: {
                nombre: name,
            },
        });

        return roleName;
    }

};