const AdminProfile = require('../../models/adminProfile.model');

const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const validateProfileFields = ({
    name,
    phone,
    email,
    accountHolder,
    accountNumber,
}) => {
    const errors = {};

    if (!name || typeof name !== "string" || name.trim().length < 3) {
        errors.name = "El nombre es obligatorio y debe tener al menos 3 caracteres.";
    } else if (!nameRegex.test(name.trim())) {
        errors.name = "El nombre solo puede contener letras y espacios.";
    }
    
    if (name && name.trim().length > 60) {
        errors.name = "El nombre no puede exceder 60 caracteres.";
    }

    if (!phone || typeof phone !== "string") {
        errors.phone = "El teléfono es obligatorio.";
    } else if (!/^\d{10,15}$/.test(phone.trim())) {
        errors.phone = "El teléfono debe contener entre 10 y 15 dígitos.";
    }

    if (!email || typeof email !== "string") {
        errors.email = "El correo es obligatorio.";
    } else if (!emailRegex.test(email.trim())) {
        errors.email = "El correo no tiene un formato válido.";
    }

    if (
        !accountHolder ||
        typeof accountHolder !== "string" ||
        accountHolder.trim().length < 3
    ) {
        errors.accountHolder = "El titular de la cuenta es obligatorio.";
    } else if (!nameRegex.test(accountHolder.trim())) {
        errors.accountHolder = "El titular de la cuenta solo puede contener letras y espacios.";
    }
    
    if (accountHolder && accountHolder.trim().length > 60) {
        errors.accountHolder = "El titular de la cuenta no puede exceder 60 caracteres.";
    }

    if (!accountNumber || typeof accountNumber !== "string") {
        errors.accountNumber = "El número de cuenta es obligatorio.";
    } else if (!/^\d{10,20}$/.test(accountNumber.trim())) {
        errors.accountNumber = "El número de cuenta debe contener entre 10 y 20 dígitos.";
    }

    return errors;
};

const splitFullName = (fullName) => {
    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const parts = cleanName.split(" ");

    const nombre = parts[0];
    const apellido = parts.slice(1).join(" ") || "";

    return { nombre, apellido };
};

const getProfileInformation = async (req, res) => {
    try {
        const { userId } = req.user;

        const profile = await AdminProfile.getProfileInformation(userId);

        res.status(200).json({ data: profile });
    } catch (error) {
        console.error("Error al obtener información de perfil del administrador:", error);

        res.status(500).json({
            msg: "Error del servidor, inténtalo más tarde.",
        });
    }
};

const updateProfileInformation = async (req, res) => {
    try {
        const { userId } = req.user;

        const {
            name,
            phone,
            email,
            accountHolder,
            accountNumber,
        } = req.body;

        const errors = validateProfileFields({
            name,
            phone,
            email,
            accountHolder,
            accountNumber,
        });

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Hay errores en los datos enviados.",
                errors,
            });
        }

        const { nombre, apellido } = splitFullName(name);

        const updatedProfile = await AdminProfile.updateProfileInformation(userId, {
            nombre,
            apellido,
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            accountHolder: accountHolder.trim(),
            accountNumber: accountNumber.trim(),
        });

        return res.status(200).json({
            success: true,
            message: "Perfil actualizado exitosamente.",
            data: updatedProfile,
        });

    } catch (error) {
        console.error("Error al actualizar perfil del administrador:", error);

        return res.status(500).json({
            success: false,
            message: "Error del servidor al actualizar el perfil.",
        });
    }
};

module.exports = {
    getProfileInformation,
    updateProfileInformation,
};