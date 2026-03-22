// Importamos el modelo
const User = require('../models/user.model');

// Controlador para obtener todos los usuarios
const getAllUsers = (req, res) => {

    // Llamamos al modelo para obtener los usuarios
    const users = User.getAllUsers();

    // Respondemos con status 200 y los usuarios en formato JSON
    res.status(200).json(users);
};

// Exportamos el método para usarlo en rutas
module.exports = {
    getAllUsers
};