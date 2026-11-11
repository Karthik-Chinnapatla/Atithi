const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validateRequest = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const formattedErrors = result.array({ onlyFirstError: true }).map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  return next(
    new AppError(
      formattedErrors[0]?.message || 'Validation failed',
      400,
      formattedErrors
    )
  );
};

module.exports = { validateRequest };
