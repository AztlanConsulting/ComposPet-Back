const AdminProfile = require('../../models/adminProfile.model');

const getProfileInformation = async (req, res) => {
    try {
        const profile = await AdminProfile.getProfileInformation();
        res.status(200).json({ data: adminProfile });
    } catch (error) {
        console.error("Error al obtener información de perfil del administrador:", error);
        res.status(500).json({ msg: "Error del servidor, inténtalo más tarde." });
    }
}

module.exports = {
    getProfileInformation,
};
