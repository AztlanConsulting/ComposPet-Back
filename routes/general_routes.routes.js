const express = require("express");
const router = express.Router();

const user_routes = require('./user.routes');
const authRoutes = require('./auth/login.routes');
const collectionRequesrRoutes = require('./collectionRequest.routes');
const clientRoutes = require('./client.routes');
const auth = require("../middlewares/auth");

router.use('/', authRoutes);
router.use("/user", user_routes);

// Agrega las rutas de solicitudes-rec
router.use('/solicitudes-rec', /*auth,*/ collectionRequesrRoutes); 

// Agrega las rutas de cliente
router.use('/cliente', auth, clientRoutes);

router.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});

router.get('/health', (req, res) => {
    res.send("");
});

module.exports = router;