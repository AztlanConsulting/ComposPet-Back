const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');

router.get('/', userController.getAllUsers);

//Ejemplo de ruta para obtener todos los niveles desde la base de datos usando Prisma
router.get('/db', userController.getAllUsers2);
router.post('/auth/google', userController.googleLogin);
router.post('/sheets', userController.sendSheets);
router.post('/send-email',  userController.sendEmail);

module.exports = router;