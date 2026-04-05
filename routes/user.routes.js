const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const userController = require('../controllers/user.controller');

router.get('/', auth, userController.getAllUsers);

//Ejemplo de ruta para obtener todos los niveles desde la base de datos usando Prisma
router.get('/db', userController.getAllUsers2);
router.post('/auth/google', userController.googleLogin);
router.post('/sheets', auth, userController.sendSheets);
router.post('/send-email', auth,  userController.sendEmail);

module.exports = router;