const { User } = require('../models/User');
const { Restaurant } = require('../models/Restaurant');
const { Review } = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/regex');
const {
  getPlatformRatingStats,
  getBatchRestaurantRatingStats,
} = require('../services/ratingService');

const getDashboard = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalRestaurants,
    ratingStats,
    recentReviews,
    recentUsers,
    recentRestaurants,
  ] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    getPlatformRatingStats(),
    Review.find()
      .populate('customer', 'name email')
      .populate('restaurant', 'name location')
      .sort({ createdAt: -1 })
      .limit(5),
    User.find().select('-password').sort({ createdAt: -1 }).limit(5),
    Restaurant.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.status(200).json({
    success: true,
    kpis: {
      totalUsers,
      totalRestaurants,
      totalReviews: ratingStats.totalReviews,
      averagePlatformRating: ratingStats.averagePlatformRating,
    },
    ratingDistribution: ratingStats.ratingDistribution,
    recentReviews,
    recentUsers,
    recentRestaurants,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { search = '', role = '', status = '', page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  if (role && ['ADMIN', 'CUSTOMER', 'RESTAURANT_OWNER'].includes(role)) {
    filter.role = role;
  }

  if (status === 'active') {
    filter.isActive = true;
  } else if (status === 'inactive') {
    filter.isActive = false;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

const getUserDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const [reviewCount, assignedRestaurant] = await Promise.all([
    Review.countDocuments({ customer: user._id }),
    Restaurant.findOne({ owner: user._id }).select('name location isActive'),
  ]);

  res.status(200).json({
    success: true,
    user: {
      ...user.toObject(),
      reviewCount,
      assignedRestaurant,
    },
  });
});

const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (req.user._id.equals(id)) {
    return next(new AppError('You cannot deactivate your own admin account', 400));
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Account ${isActive ? 'activated' : 'deactivated'} successfully`,
    user,
  });
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (req.user._id.equals(id)) {
    return next(new AppError('You cannot delete your own admin account', 400));
  }

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.role === 'ADMIN') {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount <= 1) {
      return next(new AppError('Cannot delete the only administrator account', 400));
    }
  }

  await Promise.all([
    Review.deleteMany({ customer: user._id }),
    Restaurant.updateMany({ owner: user._id }, { $set: { owner: null } }),
  ]);

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

const getAdminRestaurants = asyncHandler(async (req, res) => {
  const {
    search = '',
    location = '',
    cuisine = '',
    status = '',
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search && search.trim()) {
    filter.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }
  if (location && location.trim() && location.trim().toLowerCase() !== 'all') {
    filter.location = {
      $regex: `^${escapeRegex(location.trim())}$`,
      $options: 'i',
    };
  }
  if (cuisine && cuisine.trim() && cuisine.trim().toLowerCase() !== 'all') {
    filter.cuisine = {
      $elemMatch: {
        $regex: `^${escapeRegex(cuisine.trim())}$`,
        $options: 'i',
      },
    };
  }
  if (status === 'active') {
    filter.isActive = true;
  } else if (status === 'inactive') {
    filter.isActive = false;
  }

  const [restaurants, total, allLocations, allCuisines] = await Promise.all([
    Restaurant.find(filter)
      .populate('owner', 'name email isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Restaurant.countDocuments(filter),
    Restaurant.distinct('location'),
    Restaurant.distinct('cuisine'),
  ]);

  const statsMap = await getBatchRestaurantRatingStats(
    restaurants.map((r) => r._id)
  );

  const enriched = restaurants.map((r) => {
    const stats = statsMap.get(r._id.toString()) || {
      averageRating: null,
      totalReviews: 0,
    };
    return {
      ...r.toObject(),
      ...stats,
    };
  });

  res.status(200).json({
    success: true,
    restaurants: enriched,
    filters: {
      locations: allLocations.filter(Boolean).sort((a, b) => a.localeCompare(b)),
      cuisines: allCuisines.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

const getAdminReviews = asyncHandler(async (req, res) => {
  const { search = '', rating = '', restaurantId = '', page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (rating && ['1', '2', '3', '4', '5'].includes(String(rating))) {
    filter.rating = Number(rating);
  }
  if (restaurantId && /^[a-fA-F0-9]{24}$/.test(restaurantId)) {
    filter.restaurant = restaurantId;
  }

  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    const [matchingUsers, matchingRestaurants] = await Promise.all([
      User.find({
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ],
      }).select('_id'),
      Restaurant.find({
        name: { $regex: safeSearch, $options: 'i' },
      }).select('_id'),
    ]);

    filter.$or = [
      { comment: { $regex: safeSearch, $options: 'i' } },
      { customer: { $in: matchingUsers.map((u) => u._id) } },
      { restaurant: { $in: matchingRestaurants.map((r) => r._id) } },
    ];
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('customer', 'name email isActive role')
      .populate('restaurant', 'name location cuisine')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

const deleteAdminReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Review removed successfully',
  });
});

const getOwners = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = { role: 'RESTAURANT_OWNER' };
  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const [owners, total, assignedRestaurants] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
    Restaurant.find({ owner: { $ne: null } }).select('name location owner isActive'),
  ]);

  const ownerRestaurantMap = new Map();
  for (const r of assignedRestaurants) {
    if (r.owner) {
      ownerRestaurantMap.set(r.owner.toString(), {
        _id: r._id,
        name: r.name,
        location: r.location,
        isActive: r.isActive,
      });
    }
  }

  const enrichedOwners = owners.map((owner) => ({
    ...owner.toObject(),
    assignedRestaurant: ownerRestaurantMap.get(owner._id.toString()) || null,
  }));

  res.status(200).json({
    success: true,
    owners: enrichedOwners,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

const createOwner = asyncHandler(async (req, res, next) => {
  const { name, email, password, restaurantId } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('An account with this email already exists', 409));
  }

  let targetRestaurant = null;
  if (restaurantId) {
    targetRestaurant = await Restaurant.findById(restaurantId);
    if (!targetRestaurant) {
      return next(new AppError('Selected restaurant not found', 404));
    }
  }

  const owner = await User.create({
    name,
    email,
    password,
    role: 'RESTAURANT_OWNER',
    isActive: true,
    isEmailVerified: true,
  });

  if (targetRestaurant) {
    targetRestaurant.owner = owner._id;
    await targetRestaurant.save();
  }

  const safeOwner = await User.findById(owner._id).select('-password');

  res.status(201).json({
    success: true,
    message: 'Restaurant owner account created successfully',
    owner: {
      ...safeOwner.toObject(),
      assignedRestaurant: targetRestaurant
        ? {
            _id: targetRestaurant._id,
            name: targetRestaurant.name,
            location: targetRestaurant.location,
          }
        : null,
    },
  });
});

const updateOwner = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, isActive, restaurantId } = req.body;

  const owner = await User.findOne({ _id: id, role: 'RESTAURANT_OWNER' }).select(
    '-password'
  );
  if (!owner) {
    return next(new AppError('Restaurant owner not found', 404));
  }

  if (email && email.toLowerCase() !== owner.email) {
    const conflict = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: owner._id },
    });
    if (conflict) {
      return next(new AppError('An account with this email already exists', 409));
    }
    owner.email = email.toLowerCase();
  }

  if (name !== undefined) {
    owner.name = name;
  }
  if (typeof isActive === 'boolean') {
    owner.isActive = isActive;
  }

  await owner.save();

  if (restaurantId !== undefined) {
    await Restaurant.updateMany({ owner: owner._id }, { $set: { owner: null } });
    if (restaurantId) {
      const targetRestaurant = await Restaurant.findById(restaurantId);
      if (!targetRestaurant) {
        return next(new AppError('Selected restaurant not found', 404));
      }
      targetRestaurant.owner = owner._id;
      await targetRestaurant.save();
    }
  }

  const assignedRestaurant = await Restaurant.findOne({ owner: owner._id }).select(
    'name location isActive'
  );

  res.status(200).json({
    success: true,
    message: 'Restaurant owner updated successfully',
    owner: {
      ...owner.toObject(),
      assignedRestaurant,
    },
  });
});

const assignOwnerToRestaurant = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { ownerId } = req.body;

  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  if (!ownerId) {
    restaurant.owner = null;
    await restaurant.save();
    return res.status(200).json({
      success: true,
      message: 'Restaurant owner unassigned successfully',
      restaurant,
    });
  }

  const owner = await User.findById(ownerId).select('-password');
  if (!owner) {
    return next(new AppError('Owner user not found', 404));
  }

  if (owner.role !== 'RESTAURANT_OWNER') {
    return next(
      new AppError('Selected user must have the RESTAURANT_OWNER role', 400)
    );
  }

  const existingAssignment = await Restaurant.findOne({
    owner: owner._id,
    _id: { $ne: restaurant._id },
  });

  if (existingAssignment) {
    return next(
      new AppError(
        `This owner is already assigned to "${existingAssignment.name}"`,
        409
      )
    );
  }

  restaurant.owner = owner._id;
  await restaurant.save();

  const updated = await Restaurant.findById(restaurant._id).populate(
    'owner',
    'name email'
  );

  res.status(200).json({
    success: true,
    message: 'Owner assigned to restaurant successfully',
    restaurant: updated,
  });
});

module.exports = {
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
};
