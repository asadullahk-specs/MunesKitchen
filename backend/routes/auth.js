const express = require('express');
const router = express.Router();
const { login, getMe, logout, changePassword, getAllAdmins, createAdmin, updateAdmin, deleteAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

// Admin CRUD (Security Tab)
router.get('/admins', protect, getAllAdmins);
router.post('/admins', protect, createAdmin);
router.put('/admins/:id', protect, updateAdmin);
router.delete('/admins/:id', protect, deleteAdmin);

module.exports = router;