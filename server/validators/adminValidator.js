const { body } = require('express-validator');
const { PASSWORD_REGEX, PASSWORD_MSG } = require('./authValidator');

const updateUserStatusValidator = [
  body('isActive')
    .exists({ checkNull: true })
    .withMessage('isActive is required')
    .isBoolean({ strict: true })
    .withMessage('isActive must be a boolean'),
];

const createOwnerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 16 })
    .withMessage('Password must be between 8 and 16 characters')
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_MSG),
  body('restaurantId')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      if (!/^[a-fA-F0-9]{24}$/.test(String(value))) {
        throw new Error('Invalid restaurant identifier');
      }
      return true;
    }),
];

const updateOwnerValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('restaurantId')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      if (!/^[a-fA-F0-9]{24}$/.test(String(value))) {
        throw new Error('Invalid restaurant identifier');
      }
      return true;
    }),
];

const assignOwnerValidator = [
  body('ownerId')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      if (!/^[a-fA-F0-9]{24}$/.test(String(value))) {
        throw new Error('Invalid owner identifier');
      }
      return true;
    }),
];

module.exports = {
  updateUserStatusValidator,
  createOwnerValidator,
  updateOwnerValidator,
  assignOwnerValidator,
};
