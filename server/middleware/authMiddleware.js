const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const extractToken = (req) => {
  if (req.cookies && req.cookies.token) {
    return { token: req.cookies.token, source: 'cookie' };
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      return { token, source: 'bearer' };
    }
  }
  return { token: null, source: null };
};

const protect = asyncHandler(async (req, _res, next) => {
  const { token, source } = extractToken(req);

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    return next(new AppError('User account no longer exists.', 401));
  }

  if (!user.isActive) {
    return next(
      new AppError('Your account has been deactivated. Please contact support.', 403)
    );
  }

  req.user = user;
  req.authSource = source;
  next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const { token, source } = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) {
      req.user = user;
      req.authSource = source;
    } else {
      req.user = null;
    }
  } catch (_err) {
    req.user = null;
  }

  next();
});

const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError('Forbidden: you do not have permission to perform this action.', 403)
    );
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  authorizeRoles,
};
