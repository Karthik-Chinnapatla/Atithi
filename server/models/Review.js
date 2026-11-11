const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole integer between 1 and 5',
      },
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [1, 'Review comment cannot be empty'],
      maxlength: [1000, 'Review comment must not exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent duplicate reviews by the same customer for the same restaurant
reviewSchema.index({ customer: 1, restaurant: 1 }, { unique: true });
reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });

module.exports = {
  Review: mongoose.model('Review', reviewSchema),
};
