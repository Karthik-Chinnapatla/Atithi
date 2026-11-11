const express = require('express');
const {
  getDashboard,
  getUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getAdminRestaurants,
  getAdminReviews,
  deleteAdminReview,
  getOwners,
  createOwner,
  updateOwner,
  assignOwnerToRestaurant,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { mongoIdParamValidator } = require('../validators/restaurantValidator');
const {
  updateUserStatusValidator,
  createOwnerValidator,
  updateOwnerValidator,
  assignOwnerValidator,
} = require('../validators/adminValidator');

const router = express.Router();

router.use(protect, authorizeRoles('ADMIN'));

router.get('/dashboard', getDashboard);

router.get('/users', getUsers);
router.get('/users/:id', mongoIdParamValidator('id'), validateRequest, getUserDetails);
router.put(
  '/users/:id/status',
  mongoIdParamValidator('id'),
  updateUserStatusValidator,
  validateRequest,
  updateUserStatus
);
router.delete('/users/:id', mongoIdParamValidator('id'), validateRequest, deleteUser);

router.get('/restaurants', getAdminRestaurants);
router.put(
  '/restaurants/:id/assign-owner',
  mongoIdParamValidator('id'),
  assignOwnerValidator,
  validateRequest,
  assignOwnerToRestaurant
);

router.get('/reviews', getAdminReviews);
router.delete(
  '/reviews/:id',
  mongoIdParamValidator('id'),
  validateRequest,
  deleteAdminReview
);

router.get('/owners', getOwners);
router.post('/owners', createOwnerValidator, validateRequest, createOwner);
router.put(
  '/owners/:id',
  mongoIdParamValidator('id'),
  updateOwnerValidator,
  validateRequest,
  updateOwner
);

module.exports = router;
