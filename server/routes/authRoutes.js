const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  sendLoginOtp,
  verifyLoginOtp,
  uploadProfilePhoto,
  verifyRegistrationOtp,
  resendVerificationOtp,
  updateSettings,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

// ── Rate limiters ─────────────────────────────────────────────────────────────

// General auth limiter: 20 requests per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again in 15 minutes.' },
});

// Strict OTP limiter: 5 requests per 15 min per IP (prevents brute-force & email spam)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please wait 15 minutes before trying again.' },
});

// ── Public routes (with rate limiting) ───────────────────────────────────────
router.post('/register', authLimiter, register);
router.post('/verify-registration-otp', otpLimiter, verifyRegistrationOtp);
router.post('/resend-verification-otp', otpLimiter, resendVerificationOtp);
router.post('/login', authLimiter, login);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/send-login-otp', otpLimiter, sendLoginOtp);
router.post('/verify-login-otp', otpLimiter, verifyLoginOtp);

// ── Protected routes ─────────────────────────────────────────────────────────
router.get('/me', protect, getMe);
router.post('/upload-photo', protect, upload.single('photo'), uploadProfilePhoto);
router.put('/settings', protect, updateSettings);

module.exports = router;
