const express = require('express');
const {
  createReview,
  getRestaurantReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { mongoIdParamValidator } = require('../validators/restaurantValidator');
const {
  createReviewValidator,
  updateReviewValidator,
} = require('../validators/reviewValidator');

const router = express.Router();

router.get(
  '/restaurant/:restaurantId',
  mongoIdParamValidator('restaurantId'),
  validateRequest,
  getRestaurantReviews
);

router.get('/my-reviews', protect, authorizeRoles('CUSTOMER'), getMyReviews);

router.post(
  '/',
  protect,
  authorizeRoles('CUSTOMER'),
  createReviewValidator,
  validateRequest,
  createReview
);

router.get(
  '/:id',
  protect,
  authorizeRoles('CUSTOMER', 'ADMIN'),
  mongoIdParamValidator('id'),
  validateRequest,
  getReviewById
);

router.put(
  '/:id',
  protect,
  authorizeRoles('CUSTOMER'),
  mongoIdParamValidator('id'),
  updateReviewValidator,
  validateRequest,
  updateReview
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('CUSTOMER', 'ADMIN'),
  mongoIdParamValidator('id'),
  validateRequest,
  deleteReview
);

module.exports = router;
