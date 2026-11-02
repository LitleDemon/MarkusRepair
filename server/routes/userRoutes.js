const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Доступно только админу
router.get('/masters', verifyToken, authorizeRoles('admin'), userController.getMasters);

module.exports = router;