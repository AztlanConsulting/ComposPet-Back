const express = require("express");
const router = express.Router();

const user_routes = require('./user.routes');
const authRoutes = require('./auth/login.routes');
const solicitudesRecRoutes = require('./solicitudes_rec.routes');
const auth = require("../middlewares/auth");

router.use('/', authRoutes);
router.use("/user", user_routes);

// Agrega las rutas de solicitudes_rec
router.use('/solicitudes_rec', solicitudesRecRoutes);
// Agrega las rutas de solicitudes_rec
//router.use('/solicitudes_rec', auth, solicitudesRecRoutes);

router.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});

router.get('/health', (req, res) => {
    res.send("");
});

module.exports = router;