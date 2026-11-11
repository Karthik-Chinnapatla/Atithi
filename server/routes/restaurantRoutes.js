const express = require('express');
const {
  getRestaurantFilters,
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require('../controllers/restaurantController');
const {
  protect,
  optionalAuth,
  authorizeRoles,
} = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const {
  mongoIdParamValidator,
  createRestaurantValidator,
  updateRestaurantValidator,
} = require('../validators/restaurantValidator');

const router = express.Router();

router.get('/filters', getRestaurantFilters);
router.get('/', optionalAuth, getRestaurants);
router.get(
  '/:id',
  optionalAuth,
  mongoIdParamValidator('id'),
  validateRequest,
  getRestaurantById
);

router.post(
  '/',
  protect,
  authorizeRoles('ADMIN'),
  createRestaurantValidator,
  validateRequest,
  createRestaurant
);

router.put(
  '/:id',
  protect,
  authorizeRoles('ADMIN'),
  mongoIdParamValidator('id'),
  updateRestaurantValidator,
  validateRequest,
  updateRestaurant
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('ADMIN'),
  mongoIdParamValidator('id'),
  validateRequest,
  deleteRestaurant
);

module.exports = router;
