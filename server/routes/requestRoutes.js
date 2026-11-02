const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Клиент
router.post('/', verifyToken, authorizeRoles('client'), upload.single('photo'), requestController.createRequest);
router.get('/my', verifyToken, authorizeRoles('client'), requestController.getMyRequests);

// Мастер
router.get('/master', verifyToken, authorizeRoles('master'), requestController.getMasterRequests);
router.patch('/:id', verifyToken, authorizeRoles('master'), requestController.updateRequest);

// Админ
router.get('/', verifyToken, authorizeRoles('admin'), requestController.getAllRequests);
router.post('/:id/assign', verifyToken, authorizeRoles('admin'), requestController.assignMaster);

module.exports = router;