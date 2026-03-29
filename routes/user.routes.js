const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const userController = require('../controllers/user.controller');

router.get('/', auth, userController.getAllUsers);
router.post('/auth/google', userController.googleLogin);
router.post('/sheets', userController.sendSheets);
router.post('/send-email', auth,  userController.sendEmail);

module.exports = router;