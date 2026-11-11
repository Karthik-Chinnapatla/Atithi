const { body } = require('express-validator');

const validateIntegerRating = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (typeof value === 'boolean' || value === '' || value === null || Number.isNaN(num)) {
    throw new Error('Rating must be an integer between 1 and 5');
  }
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }
  return true;
};

const createReviewValidator = [
  body('restaurant')
    .notEmpty()
    .withMessage('Restaurant ID is required')
    .isMongoId()
    .withMessage('Invalid restaurant ID'),
  body('rating')
    .custom(validateIntegerRating)
    .toInt(),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment cannot be empty')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Review comment must not exceed 1000 characters'),
];

const updateReviewValidator = [
  body('rating')
    .custom(validateIntegerRating)
    .toInt(),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment cannot be empty')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Review comment must not exceed 1000 characters'),
];

module.exports = {
  createReviewValidator,
  updateReviewValidator,
};
