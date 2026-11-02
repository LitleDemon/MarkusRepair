const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, authorizeRoles('admin'), statsController.getStats);

module.exports = router;