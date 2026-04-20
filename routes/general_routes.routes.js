const express = require("express");
const router = express.Router();

const user_routes = require('./user.routes');
const authRoutes = require('./auth/login.routes');
const collectionRequestRoutes = require('./collectionRequest.routes');
const clientRoutes = require('./client.routes');

const { authMiddleware } = require('../middlewares/auth')

router.use('/', authRoutes);

router.use("/user", user_routes);

// Agrega las rutas de solicitudes_rec
router.use('/solicitudes-rec', authMiddleware, collectionRequestRoutes); 

// Agrega las rutas de cliente
router.use('/cliente', authMiddleware, clientRoutes);

router.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});


module.exports = router;