const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, inventoryController.getInventory);
router.post('/', verifyToken, authorizeRoles('admin'), inventoryController.addItem);

module.exports = router;