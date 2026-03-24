const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');

router.get('/', userController.getAllUsers);
router.post('/auth/google', userController.googleLogin);
router.post('/send-email', userController.sendEmail);
router.post('/sheets', userController.sendSheets);

module.exports = router;