const express = require("express");
const router = express.Router();

const user_routes = require('./user.routes');
const authRoutes = require('./auth/login.routes');

const { authMiddleware } = require('../middlewares/auth')

router.use('/api', authRoutes);

router.use("/user", user_routes);

router.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});



module.exports = router;