const crypto = require('crypto');
const { User } = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
  signAuthToken,
  generateCsrfToken,
  setAuthCookies,
  setCsrfCookie,
  clearAuthCookies,
} = require('../utils/tokenUtils');
const {
  sendVerificationOtpEmail,
  sendRegistrationLoginSuccessEmail,
} = require('../services/emailService');

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));

const hashOtp = (otp) =>
  crypto.createHash('sha256').update(String(otp)).digest('hex');

const verifyOtpHash = (otp, expectedHash) => {
  const actualBuf = Buffer.from(hashOtp(otp));
  const expectedBuf = Buffer.from(expectedHash);
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
};

const getCsrfToken = asyncHandler(async (req, res) => {
  const csrfToken = req.cookies?.['XSRF-TOKEN'] || generateCsrfToken();
  setCsrfCookie(res, csrfToken);
  res.status(200).json({
    success: true,
    csrfToken,
  });
});

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && existingUser.isEmailVerified) {
    return next(new AppError('An account with this email already exists', 409));
  }

  const otp = generateOtpCode();
  const otpHash = hashOtp(otp);
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  let user;
  if (existingUser) {
    existingUser.name = name;
    existingUser.password = password;
    existingUser.emailOtpHash = otpHash;
    existingUser.emailOtpExpiresAt = otpExpiresAt;
    existingUser.emailOtpAttempts = 0;
    existingUser.emailOtpLastSentAt = new Date();
    user = await existingUser.save();
  } else {
    // Self-registration is strictly scoped to CUSTOMER role & requires OTP verification
    user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: 'CUSTOMER',
      isActive: true,
      isEmailVerified: false,
      emailOtpHash: otpHash,
      emailOtpExpiresAt: otpExpiresAt,
      emailOtpAttempts: 0,
      emailOtpLastSentAt: new Date(),
    });
  }

  await sendVerificationOtpEmail({
    to: user.email,
    name: user.name,
    otp,
  });

  res.status(201).json({
    success: true,
    requiresVerification: true,
    email: user.email,
    expiresInMinutes: 10,
    message: 'Verification OTP has been sent to your email address.',
  });
});

const verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+emailOtpHash +emailOtpExpiresAt +emailOtpAttempts'
  );

  if (!user) {
    return next(new AppError('Account not found for this email address', 404));
  }

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified. Please sign in.', 400));
  }

  if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
    return next(
      new AppError('No active verification OTP found. Please request a new code.', 400)
    );
  }

  if (user.emailOtpExpiresAt < new Date()) {
    return next(
      new AppError('Verification OTP has expired. Please click Resend OTP.', 400)
    );
  }

  if ((user.emailOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    return next(
      new AppError(
        'Too many invalid OTP attempts. Please request a new verification OTP.',
        429
      )
    );
  }

  if (!verifyOtpHash(otp, user.emailOtpHash)) {
    user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
    await user.save();
    return next(new AppError('Invalid verification OTP. Please try again.', 400));
  }

  user.isEmailVerified = true;
  user.emailOtpHash = null;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = null;
  await user.save();

  const token = signAuthToken(user);
  const csrfToken = generateCsrfToken();
  setAuthCookies(res, token, csrfToken);

  try {
    await sendRegistrationLoginSuccessEmail({
      to: user.email,
      name: user.name,
    });
  } catch (mailError) {
    console.error('[Atithi Welcome Email Error]', mailError.message);
  }

  const safeUser = await User.findById(user._id).select('-password');

  res.status(200).json({
    success: true,
    message: 'Email verified! You have successfully logged into Atithi.',
    user: safeUser,
    csrfToken,
  });
});

const resendOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+emailOtpLastSentAt'
  );

  if (!user) {
    return next(new AppError('Account not found for this email address', 404));
  }

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified. Please sign in.', 400));
  }

  if (user.emailOtpLastSentAt) {
    const elapsed = Date.now() - new Date(user.emailOtpLastSentAt).getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
      return next(
        new AppError(
          `Please wait ${retryAfterSeconds}s before requesting another OTP.`,
          429,
          null,
          { retryAfterSeconds }
        )
      );
    }
  }

  const otp = generateOtpCode();
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = new Date();
  await user.save();

  await sendVerificationOtpEmail({
    to: user.email,
    name: user.name,
    otp,
  });

  res.status(200).json({
    success: true,
    message: 'A new 6-digit verification OTP has been sent to your email.',
    expiresInMinutes: 10,
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(
      new AppError('Your account has been deactivated. Please contact an administrator.', 403)
    );
  }

  if (!user.isEmailVerified) {
    return next(
      new AppError(
        'Please verify your email address with the OTP sent to your inbox before logging in.',
        403,
        null,
        { requiresVerification: true, email: user.email }
      )
    );
  }

  const token = signAuthToken(user);
  const csrfToken = generateCsrfToken();
  setAuthCookies(res, token, csrfToken);

  const safeUser = await User.findById(user._id).select('-password');

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: safeUser,
    csrfToken,
  });
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

const getMe = asyncHandler(async (req, res) => {
  const csrfToken = req.cookies?.['XSRF-TOKEN'] || generateCsrfToken();
  setCsrfCookie(res, csrfToken);

  res.status(200).json({
    success: true,
    user: req.user,
    csrfToken,
  });
});

const updateProfile = asyncHandler(async (req, res, next) => {
  const forbiddenKeys = ['role', 'isActive', 'password', 'email', 'isEmailVerified'];
  for (const key of forbiddenKeys) {
    if (req.body[key] !== undefined) {
      return next(new AppError(`You cannot modify '${key}' from profile settings`, 403));
    }
  }

  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.name = req.body.name;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

module.exports = {
  getCsrfToken,
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
