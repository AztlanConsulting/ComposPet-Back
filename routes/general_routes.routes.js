const express = require("express");
const router = express.Router();

const user_routes = require('./user.routes');
const authRoutes = require('./auth/login.routes');
const collectionRequesrRoutes = require('./collectionRequest.routes');
const clientRoutes = require('./client.routes');
const auth = require("../middlewares/auth");

const { authMiddleware } = require('../middlewares/auth')

router.use('/api', authRoutes);

router.use("/user", user_routes);

// Agrega las rutas de solicitudes_rec
router.use('/solicitudes_rec', auth, collectionRequesrRoutes); 

// Agrega las rutas de cliente
router.use('/cliente', auth, clientRoutes);

router.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});


module.exports = router;