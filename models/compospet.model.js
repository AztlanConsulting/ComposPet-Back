const prisma = require("../config/prisma");

/**
 * Modelo de acceso a datos para la configuración general de la empresa.
 *
 * @namespace Compospet
 */
module.exports = class Compospet {

    /**
     * Obtiene el identificador de la empresa registrada en el sistema.
     * Se asume que la tabla `compospet` contiene un único registro global.
     *
     * @returns {Promise<number|null>} Identificador de la empresa.
     * @see postRegisterClient
     */
    static async getId() {
        const cp = await prisma.compospet.findFirst();
        return cp?.id_cp ?? null;
    }
};