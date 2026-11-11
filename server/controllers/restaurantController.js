const { Restaurant } = require('../models/Restaurant');
const { Review } = require('../models/Review');
const { User } = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/regex');
const { getRestaurantRatingStats } = require('../services/ratingService');

const getRestaurantFilters = asyncHandler(async (_req, res) => {
  const [locations, cuisines] = await Promise.all([
    Restaurant.distinct('location', { isActive: true }),
    Restaurant.distinct('cuisine', { isActive: true }),
  ]);

  res.status(200).json({
    success: true,
    locations: locations.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    cuisines: cuisines.filter(Boolean).sort((a, b) => a.localeCompare(b)),
  });
});

const getRestaurants = asyncHandler(async (req, res) => {
  const {
    search = '',
    location = '',
    cuisine = '',
    sort = 'popular',
    page = 1,
    limit = 9,
    popular = 'false',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));
  const skip = (pageNum - 1) * limitNum;

  const matchStage = { isActive: true };

  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    matchStage.name = { $regex: safeSearch, $options: 'i' };
  }

  if (location && location.trim() && location.trim().toLowerCase() !== 'all') {
    matchStage.location = {
      $regex: `^${escapeRegex(location.trim())}$`,
      $options: 'i',
    };
  }

  if (cuisine && cuisine.trim() && cuisine.trim().toLowerCase() !== 'all') {
    matchStage.cuisine = {
      $elemMatch: {
        $regex: `^${escapeRegex(cuisine.trim())}$`,
        $options: 'i',
      },
    };
  }

  let sortStage = { hasReviews: -1, averageRatingSort: -1, totalReviews: -1, createdAt: -1 };
  if (popular !== 'true') {
    switch (sort) {
      case 'rating':
        sortStage = { hasReviews: -1, averageRatingSort: -1, totalReviews: -1, name: 1 };
        break;
      case 'reviews':
        sortStage = { totalReviews: -1, averageRatingSort: -1, name: 1 };
        break;
      case 'newest':
        sortStage = { createdAt: -1 };
        break;
      case 'name':
        sortStage = { name: 1 };
        break;
      case 'popular':
      default:
        sortStage = { hasReviews: -1, totalReviews: -1, averageRatingSort: -1, createdAt: -1 };
        break;
    }
  }

  const [aggregated] = await Restaurant.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'restaurant',
        as: 'reviewsList',
      },
    },
    {
      $addFields: {
        totalReviews: { $size: '$reviewsList' },
        rawAverageRating: {
          $cond: [
            { $gt: [{ $size: '$reviewsList' }, 0] },
            { $avg: '$reviewsList.rating' },
            null,
          ],
        },
      },
    },
    {
      $addFields: {
        hasReviews: { $cond: [{ $gt: ['$totalReviews', 0] }, 1, 0] },
        averageRating: {
          $cond: [
            { $ne: ['$rawAverageRating', null] },
            { $round: ['$rawAverageRating', 1] },
            null,
          ],
        },
        averageRatingSort: { $ifNull: ['$rawAverageRating', 0] },
      },
    },
    { $project: { reviewsList: 0, rawAverageRating: 0, __v: 0 } },
    { $sort: sortStage },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limitNum }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ]);

  const rawItems = aggregated?.items || [];
  const total = aggregated?.totalCount?.[0]?.count || 0;

  // Attach logged-in customer's own rating per restaurant when available
  const myRatingsMap = new Map();
  if (req.user && req.user.role === 'CUSTOMER' && rawItems.length > 0) {
    const restaurantIds = rawItems.map((r) => r._id);
    const customerReviews = await Review.find({
      customer: req.user._id,
      restaurant: { $in: restaurantIds },
    }).select('restaurant rating');

    for (const rev of customerReviews) {
      myRatingsMap.set(rev.restaurant.toString(), rev.rating);
    }
  }

  const restaurants = rawItems.map((item) => {
    const { hasReviews, averageRatingSort, ...rest } = item;
    return {
      ...rest,
      myRating: myRatingsMap.has(item._id.toString())
        ? myRatingsMap.get(item._id.toString())
        : null,
    };
  });

  res.status(200).json({
    success: true,
    restaurants,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

const getRestaurantById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const query = req.user?.role === 'ADMIN' ? { _id: id } : { _id: id, isActive: true };

  const restaurant = await Restaurant.findOne(query).populate('owner', 'name email');
  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  const ratingStats = await getRestaurantRatingStats(restaurant._id);

  let myReview = null;
  if (req.user && req.user.role === 'CUSTOMER') {
    myReview = await Review.findOne({
      customer: req.user._id,
      restaurant: restaurant._id,
    }).populate('customer', 'name');
  }

  res.status(200).json({
    success: true,
    restaurant: {
      ...restaurant.toObject(),
      ...ratingStats,
      myReview,
    },
  });
});

const createRestaurant = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    location,
    address,
    cuisine,
    image,
    phone,
    priceRange,
    owner,
    isActive,
  } = req.body;

  let assignedOwnerId = null;
  if (owner) {
    const ownerUser = await User.findById(owner);
    if (!ownerUser) {
      return next(new AppError('Selected owner user does not exist', 404));
    }
    if (ownerUser.role !== 'RESTAURANT_OWNER') {
      return next(
        new AppError('Assigned user must have the RESTAURANT_OWNER role', 400)
      );
    }
    const existingAssignment = await Restaurant.findOne({ owner: ownerUser._id });
    if (existingAssignment) {
      return next(
        new AppError(
          `Owner is already assigned to "${existingAssignment.name}"`,
          409
        )
      );
    }
    assignedOwnerId = ownerUser._id;
  }

  const restaurant = await Restaurant.create({
    name,
    description,
    location,
    address,
    cuisine,
    image,
    phone,
    priceRange: priceRange || '$$',
    owner: assignedOwnerId,
    isActive: typeof isActive === 'boolean' ? isActive : true,
  });

  const populated = await Restaurant.findById(restaurant._id).populate(
    'owner',
    'name email'
  );

  res.status(201).json({
    success: true,
    message: 'Restaurant created successfully',
    restaurant: populated,
  });
});

const updateRestaurant = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  const allowedFields = [
    'name',
    'description',
    'location',
    'address',
    'cuisine',
    'image',
    'phone',
    'priceRange',
    'isActive',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      restaurant[field] = req.body[field];
    }
  }

  if (req.body.owner !== undefined) {
    if (!req.body.owner) {
      restaurant.owner = null;
    } else {
      const ownerUser = await User.findById(req.body.owner);
      if (!ownerUser) {
        return next(new AppError('Selected owner user does not exist', 404));
      }
      if (ownerUser.role !== 'RESTAURANT_OWNER') {
        return next(
          new AppError('Assigned user must have the RESTAURANT_OWNER role', 400)
        );
      }
      const existingAssignment = await Restaurant.findOne({
        owner: ownerUser._id,
        _id: { $ne: restaurant._id },
      });
      if (existingAssignment) {
        return next(
          new AppError(
            `Owner is already assigned to "${existingAssignment.name}"`,
            409
          )
        );
      }
      restaurant.owner = ownerUser._id;
    }
  }

  await restaurant.save();
  const updated = await Restaurant.findById(restaurant._id).populate('owner', 'name email');

  res.status(200).json({
    success: true,
    message: 'Restaurant updated successfully',
    restaurant: updated,
  });
});

const deleteRestaurant = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  await Review.deleteMany({ restaurant: restaurant._id });
  await restaurant.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Restaurant and associated reviews deleted successfully',
  });
});

module.exports = {
  getRestaurantFilters,
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
