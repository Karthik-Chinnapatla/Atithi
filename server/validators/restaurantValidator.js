const { body, param } = require('express-validator');
const { PRICE_RANGES } = require('../models/Restaurant');

const mongoIdParamValidator = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} identifier`),
];

const parseCuisineField = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
};

const isValidImageUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed.startsWith('/')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const createRestaurantValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Restaurant name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Restaurant name must be between 2 and 120 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1500 })
    .withMessage('Description must be between 10 and 1500 characters'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 250 })
    .withMessage('Address must be between 5 and 250 characters'),
  body('cuisine')
    .customSanitizer(parseCuisineField)
    .isArray({ min: 1, max: 10 })
    .withMessage('At least one cuisine (up to 10) is required'),
  body('cuisine.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Cuisine tags cannot be empty')
    .isLength({ max: 40 })
    .withMessage('Cuisine tag cannot exceed 40 characters'),
  body('image')
    .trim()
    .notEmpty()
    .withMessage('Image URL is required')
    .custom((value) => {
      if (!isValidImageUrl(value)) {
        throw new Error('Please provide a valid HTTP/HTTPS image URL');
      }
      return true;
    }),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 7, max: 30 })
    .withMessage('Phone number must be between 7 and 30 characters'),
  body('priceRange')
    .optional()
    .isIn(PRICE_RANGES)
    .withMessage('Price range must be $, $$, $$$, or $$$$'),
  body('owner')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      if (!/^[a-fA-F0-9]{24}$/.test(String(value))) {
        throw new Error('Invalid owner identifier');
      }
      return true;
    }),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const updateRestaurantValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Restaurant name cannot be empty')
    .isLength({ min: 2, max: 120 })
    .withMessage('Restaurant name must be between 2 and 120 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 10, max: 1500 })
    .withMessage('Description must be between 10 and 1500 characters'),
  body('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty')
    .isLength({ min: 5, max: 250 })
    .withMessage('Address must be between 5 and 250 characters'),
  body('cuisine')
    .optional()
    .customSanitizer(parseCuisineField)
    .isArray({ min: 1, max: 10 })
    .withMessage('At least one cuisine (up to 10) is required'),
  body('cuisine.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Cuisine tags cannot be empty'),
  body('image')
    .optional()
    .trim()
    .custom((value) => {
      if (!isValidImageUrl(value)) {
        throw new Error('Please provide a valid HTTP/HTTPS image URL');
      }
      return true;
    }),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .isLength({ min: 7, max: 30 })
    .withMessage('Phone number must be between 7 and 30 characters'),
  body('priceRange')
    .optional()
    .isIn(PRICE_RANGES)
    .withMessage('Price range must be $, $$, $$$, or $$$$'),
  body('owner')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      if (!/^[a-fA-F0-9]{24}$/.test(String(value))) {
        throw new Error('Invalid owner identifier');
      }
      return true;
    }),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const ownerUpdateRestaurantValidator = [
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 10, max: 1500 })
    .withMessage('Description must be between 10 and 1500 characters'),
  body('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty')
    .isLength({ min: 5, max: 250 })
    .withMessage('Address must be between 5 and 250 characters'),
  body('cuisine')
    .optional()
    .customSanitizer(parseCuisineField)
    .isArray({ min: 1, max: 10 })
    .withMessage('At least one cuisine (up to 10) is required'),
  body('cuisine.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Cuisine tags cannot be empty'),
  body('image')
    .optional()
    .trim()
    .custom((value) => {
      if (!isValidImageUrl(value)) {
        throw new Error('Please provide a valid HTTP/HTTPS image URL');
      }
      return true;
    }),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .isLength({ min: 7, max: 30 })
    .withMessage('Phone number must be between 7 and 30 characters'),
  body('priceRange')
    .optional()
    .isIn(PRICE_RANGES)
    .withMessage('Price range must be $, $$, $$$, or $$$$'),
];

module.exports = {
  mongoIdParamValidator,
  createRestaurantValidator,
  updateRestaurantValidator,
  ownerUpdateRestaurantValidator,
};
