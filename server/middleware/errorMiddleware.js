const env = require('../config/env');
const AppError = require('../utils/AppError');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON request payload';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path || 'identifier'} format`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    const validationErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = validationErrors[0]?.message || 'Validation failed';
    errors = validationErrors;
  } else if (err.code === 11000) {
    statusCode = 409;
    const keyPattern = err.keyPattern || {};
    if (keyPattern.email) {
      message = 'An account with this email already exists';
    } else if (keyPattern.customer && keyPattern.restaurant) {
      message = 'You have already submitted a review for this restaurant';
    } else {
      const fields = Object.keys(keyPattern).join(', ');
      message = fields ? `Duplicate value for ${fields}` : 'Duplicate resource conflict';
    }
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (statusCode >= 500 && env.nodeEnv !== 'test') {
    console.error('[Server Error]', err);
  }

  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  if (err.meta && typeof err.meta === 'object') {
    Object.assign(payload, err.meta);
  }

  if (env.nodeEnv === 'development' && statusCode >= 500) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
