const express = require('express');
const {
  getCsrfToken,
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const {
  registerValidator,
  verifyOtpValidator,
  resendOtpValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} = require('../validators/authValidator');

const router = express.Router();

router.get('/csrf-token', getCsrfToken);
router.post('/register', registerValidator, validateRequest, register);
router.post('/verify-otp', verifyOtpValidator, validateRequest, verifyOtp);
router.post('/resend-otp', resendOtpValidator, validateRequest, resendOtp);
router.post('/login', loginValidator, validateRequest, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidator, validateRequest, updateProfile);
router.put('/password', protect, changePasswordValidator, validateRequest, changePassword);

module.exports = router;
