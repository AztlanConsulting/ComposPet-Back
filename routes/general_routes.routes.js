const express = require("express");
const router = express.Router();

const user_routes = require('./user.routes');
const authRoutes = require('./auth/login.routes');
const collectionRequesrRoutes = require('./collectionRequest.routes');
const clientRoutes = require('./client.routes');
const cardRoutes = require('./card.routes')

const { authMiddleware } = require('../middlewares/auth')

router.use('/', authRoutes);

router.use("/user", user_routes);

// Agrega las rutas de solicitudes_rec
router.use('/solicitudes-rec', authMiddleware, collectionRequesrRoutes);

// Agrega las rutas de cliente
router.use('/cliente', authMiddleware, clientRoutes);

// Agrega las rutas de la tarjeta del cliente
router.use('/card', authMiddleware, cardRoutes);

router.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});


module.exports = router;