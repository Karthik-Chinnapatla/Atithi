const express = require('express');
const {
  getOwnerDashboard,
  getOwnerRestaurant,
  updateOwnerRestaurant,
  getOwnerReviews,
} = require('../controllers/ownerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const {
  ownerUpdateRestaurantValidator,
} = require('../validators/restaurantValidator');

const router = express.Router();

router.use(protect, authorizeRoles('RESTAURANT_OWNER'));

router.get('/dashboard', getOwnerDashboard);
router.get('/restaurant', getOwnerRestaurant);
router.put(
  '/restaurant',
  ownerUpdateRestaurantValidator,
  validateRequest,
  updateOwnerRestaurant
);
router.get('/reviews', getOwnerReviews);

module.exports = router;
