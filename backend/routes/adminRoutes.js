const express = require('express');
const router = express.Router();
const { getAdminStats, getAllUsers, getAllWeddings, makeAdmin } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getAdminStats);
router.get('/users', protect, getAllUsers);
router.get('/weddings', protect, getAllWeddings);
router.put('/make-admin/:id', protect, makeAdmin);

module.exports = router;
