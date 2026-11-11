const { Review } = require('../models/Review');
const { Restaurant } = require('../models/Restaurant');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getRestaurantRatingStats } = require('../services/ratingService');

const createReview = asyncHandler(async (req, res, next) => {
  const { restaurant: restaurantId, rating, comment } = req.body;

  const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true });
  if (!restaurant) {
    return next(new AppError('Restaurant not found or is currently inactive', 404));
  }

  const existingReview = await Review.findOne({
    customer: req.user._id,
    restaurant: restaurant._id,
  });

  if (existingReview) {
    return next(
      new AppError('You have already submitted a review for this restaurant', 409)
    );
  }

  const review = await Review.create({
    customer: req.user._id,
    restaurant: restaurant._id,
    rating: Number(rating),
    comment,
  });

  const populatedReview = await Review.findById(review._id)
    .populate('customer', 'name')
    .populate('restaurant', 'name location image');

  const ratingStats = await getRestaurantRatingStats(restaurant._id);

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    review: populatedReview,
    ratingStats,
  });
});

const getRestaurantReviews = asyncHandler(async (req, res, next) => {
  const { restaurantId } = req.params;
  const { page = 1, limit = 8, rating = '', sort = 'newest' } = req.query;

  const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true });
  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 8));
  const skip = (pageNum - 1) * limitNum;

  const filter = { restaurant: restaurant._id };
  if (rating && ['1', '2', '3', '4', '5'].includes(String(rating))) {
    filter.rating = Number(rating);
  }

  let sortObj = { createdAt: -1 };
  if (sort === 'highest') {
    sortObj = { rating: -1, createdAt: -1 };
  } else if (sort === 'lowest') {
    sortObj = { rating: 1, createdAt: -1 };
  }

  const [reviews, total, ratingStats] = await Promise.all([
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
    reviews,
    ratingStats,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find({ customer: req.user._id })
      .populate('restaurant', 'name location cuisine image priceRange isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments({ customer: req.user._id }),
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

const getReviewById = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('customer', 'name')
    .populate('restaurant', 'name location image cuisine');

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const isOwner = review.customer?._id.equals(req.user._id);
  if (!isOwner && req.user.role !== 'ADMIN') {
    return next(new AppError('Forbidden: you cannot access this review', 403));
  }

  res.status(200).json({
    success: true,
    review,
  });
});

const updateReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  if (!review.customer.equals(req.user._id)) {
    return next(new AppError('Forbidden: you can only edit your own reviews', 403));
  }

  review.rating = Number(req.body.rating);
  review.comment = req.body.comment;
  await review.save();

  const [populatedReview, ratingStats] = await Promise.all([
    Review.findById(review._id)
      .populate('customer', 'name')
      .populate('restaurant', 'name location image'),
    getRestaurantRatingStats(review.restaurant),
  ]);

  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    review: populatedReview,
    ratingStats,
  });
});

const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const isReviewOwner = review.customer.equals(req.user._id);
  const isAdmin = req.user.role === 'ADMIN';

  if (!isReviewOwner && !isAdmin) {
    return next(
      new AppError('Forbidden: you do not have permission to delete this review', 403)
    );
  }

  const restaurantId = review.restaurant;
  await review.deleteOne();

  const ratingStats = await getRestaurantRatingStats(restaurantId);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
    ratingStats,
  });
});

module.exports = {
  createReview,
  getRestaurantReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
