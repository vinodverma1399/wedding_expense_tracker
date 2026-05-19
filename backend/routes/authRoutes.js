const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, forgotPassword, verifyOTP, resetPassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.put('/update-name', protect, updateProfile);

module.exports = router;

