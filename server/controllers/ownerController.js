const { Restaurant } = require('../models/Restaurant');
const { Review } = require('../models/Review');
const { User } = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/regex');
const { getRestaurantRatingStats } = require('../services/ratingService');

const getOwnerDashboard = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });

  if (!restaurant) {
    return res.status(200).json({
      success: true,
      assigned: false,
      restaurant: null,
      stats: null,
      recentReviews: [],
    });
  }

  const [stats, recentReviews] = await Promise.all([
    getRestaurantRatingStats(restaurant._id),
    Review.find({ restaurant: restaurant._id })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.status(200).json({
    success: true,
    assigned: true,
    restaurant,
    stats,
    recentReviews,
  });
});

const getOwnerRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id }).populate(
    'owner',
    'name email'
  );

  if (!restaurant) {
    return res.status(200).json({
      success: true,
      assigned: false,
      restaurant: null,
      stats: null,
    });
  }

  const stats = await getRestaurantRatingStats(restaurant._id);

  res.status(200).json({
    success: true,
    assigned: true,
    restaurant,
    stats,
  });
});

const updateOwnerRestaurant = asyncHandler(async (req, res, next) => {
  const forbiddenFields = ['owner', 'role', 'isActive', '_id'];
  for (const key of forbiddenFields) {
    if (req.body[key] !== undefined) {
      return next(
        new AppError(
          `Forbidden: restaurant owners cannot modify '${key}'`,
          403
        )
      );
    }
  }

  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) {
    return next(
      new AppError('No restaurant is currently assigned to your account', 404)
    );
  }

  const permittedFields = [
    'description',
    'phone',
    'address',
    'location',
    'cuisine',
    'image',
    'priceRange',
  ];

  for (const field of permittedFields) {
    if (req.body[field] !== undefined) {
      restaurant[field] = req.body[field];
    }
  }

  await restaurant.save();

  const stats = await getRestaurantRatingStats(restaurant._id);

  res.status(200).json({
    success: true,
    message: 'Restaurant details updated successfully',
    restaurant,
    stats,
  });
});

const getOwnerReviews = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });

  if (!restaurant) {
    return res.status(200).json({
      success: true,
      assigned: false,
      reviews: [],
      stats: null,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });
  }

  const { page = 1, limit = 10, rating = '', search = '', sort = 'newest' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = { restaurant: restaurant._id };
  if (rating && ['1', '2', '3', '4', '5'].includes(String(rating))) {
    filter.rating = Number(rating);
  }

  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    const matchingCustomers = await User.find({
      name: { $regex: safeSearch, $options: 'i' },
    }).select('_id');
    const customerIds = matchingCustomers.map((u) => u._id);

    filter.$or = [
      { comment: { $regex: safeSearch, $options: 'i' } },
      { customer: { $in: customerIds } },
    ];
  }

  let sortObj = { createdAt: -1 };
  if (sort === 'highest') {
    sortObj = { rating: -1, createdAt: -1 };
  } else if (sort === 'lowest') {
    sortObj = { rating: 1, createdAt: -1 };
  }

  const [reviews, total, stats] = await Promise.all([
    Review.find(filter)
      .populate('customer', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(filter),
    getRestaurantRatingStats(restaurant._id),
  ]);

  res.status(200).json({
    success: true,
    assigned: true,
    restaurant: {
      _id: restaurant._id,
      name: restaurant.name,
      location: restaurant.location,
    },
    reviews,
    stats,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

module.exports = {
  getOwnerDashboard,
  getOwnerRestaurant,
  updateOwnerRestaurant,
  getOwnerReviews,
};
