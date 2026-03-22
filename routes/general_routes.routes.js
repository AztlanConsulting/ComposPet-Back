const express = require("express");
const router = express.Router();

const user_routes = require('./user.routes');

router.use("/user", user_routes);

router.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});


module.exports = router;