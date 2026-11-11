const mongoose = require('mongoose');

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      minlength: [2, 'Restaurant name must be at least 2 characters'],
      maxlength: [120, 'Restaurant name must not exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1500, 'Description must not exceed 1500 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location must not exceed 100 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [250, 'Address must not exceed 250 characters'],
    },
    cuisine: {
      type: [String],
      required: [true, 'At least one cuisine is required'],
      validate: {
        validator: (arr) =>
          Array.isArray(arr) &&
          arr.length > 0 &&
          arr.every((item) => typeof item === 'string' && item.trim().length > 0),
        message: 'At least one valid cuisine tag is required',
      },
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [30, 'Phone number must not exceed 30 characters'],
    },
    priceRange: {
      type: String,
      enum: {
        values: PRICE_RANGES,
        message: 'Price range must be $, $$, $$$, or $$$$',
      },
      default: '$$',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
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

restaurantSchema.index({ name: 1 });
restaurantSchema.index({ location: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ isActive: 1, createdAt: -1 });

restaurantSchema.pre('save', function normalizeCuisine(next) {
  if (Array.isArray(this.cuisine)) {
    const unique = [];
    const seen = new Set();
    for (const item of this.cuisine) {
      const cleaned = item.trim();
      if (cleaned && !seen.has(cleaned.toLowerCase())) {
        seen.add(cleaned.toLowerCase());
        unique.push(cleaned);
      }
    }
    this.cuisine = unique;
  }
  next();
});

module.exports = {
  Restaurant: mongoose.model('Restaurant', restaurantSchema),
  PRICE_RANGES,
};
