const mongoose = require('mongoose');
const { Review } = require('../models/Review');

const RATINGS = [5, 4, 3, 2, 1];

const buildDistribution = (rawDistribution = [], totalReviews = 0) => {
  const countsMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  for (const bucket of rawDistribution) {
    if (bucket && typeof bucket._id === 'number' && countsMap[bucket._id] !== undefined) {
      countsMap[bucket._id] = bucket.count;
    }
  }

  const ratingDistribution = RATINGS.map((rating) => {
    const count = countsMap[rating];
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { rating, count, percentage };
  });

  return { ratingDistribution, ratingCounts: countsMap };
};

const getRestaurantRatingStats = async (restaurantId) => {
  const objectId = new mongoose.Types.ObjectId(restaurantId);

  const [aggregated] = await Review.aggregate([
    { $match: { restaurant: objectId } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
        ],
        distribution: [
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const summary = aggregated?.summary?.[0] || null;
  const totalReviews = summary ? summary.totalReviews : 0;
  const averageRating =
    totalReviews > 0 && summary.averageRating !== null
      ? Number(summary.averageRating.toFixed(1))
      : null;

  const { ratingDistribution, ratingCounts } = buildDistribution(
    aggregated?.distribution || [],
    totalReviews
  );

  return {
    averageRating,
    totalReviews,
    ratingDistribution,
    ratingCounts,
  };
};

const getBatchRestaurantRatingStats = async (restaurantIds = []) => {
  const statsMap = new Map();
  if (!restaurantIds.length) {
    return statsMap;
  }

  const objectIds = restaurantIds.map((id) => new mongoose.Types.ObjectId(id));

  const results = await Review.aggregate([
    { $match: { restaurant: { $in: objectIds } } },
    {
      $group: {
        _id: '$restaurant',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  for (const row of results) {
    statsMap.set(row._id.toString(), {
      averageRating:
        row.totalReviews > 0 && row.averageRating !== null
          ? Number(row.averageRating.toFixed(1))
          : null,
      totalReviews: row.totalReviews,
    });
  }

  return statsMap;
};

const getPlatformRatingStats = async () => {
  const [aggregated] = await Review.aggregate([
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
        ],
        distribution: [
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const summary = aggregated?.summary?.[0] || null;
  const totalReviews = summary ? summary.totalReviews : 0;
  const averagePlatformRating =
    totalReviews > 0 && summary.averageRating !== null
      ? Number(summary.averageRating.toFixed(1))
      : null;

  const { ratingDistribution, ratingCounts } = buildDistribution(
    aggregated?.distribution || [],
    totalReviews
  );

  return {
    totalReviews,
    averagePlatformRating,
    ratingDistribution,
    ratingCounts,
  };
};

module.exports = {
  buildDistribution,
  getRestaurantRatingStats,
  getBatchRestaurantRatingStats,
  getPlatformRatingStats,
};
