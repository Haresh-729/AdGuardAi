const express = require('express');
const { 
  register, 
  login, 
  logout,
  checkUser,
  sendOtp,
  resendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword
} = require('../controllers/auth');

const router = express.Router();

// Authentication routes
router.post('/check-user', checkUser);
router.post('/register', register);
router.post('/send-otp', sendOtp);
router.post('/resend-otp', resendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;