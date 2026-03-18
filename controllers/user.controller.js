const User = require('../models/user.model');

const getAllUsers = (req, res) => {
    const users = User.getAllUsers();
    res.json(users);
};

module.exports = {
    getAllUsers
};