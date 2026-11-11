import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export function StarRatingDisplay({ rating = 0, size = 16, showValue = false }) {
  const numericRating = Number(rating) || 0;
  const filledCount = Math.round(numericRating);

  return (
    <div className="inline-flex items-center gap-1" aria-label={`Rated ${numericRating} out of 5`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= filledCount;
          return (
            <Star
              key={star}
              size={size}
              className={
                isFilled
                  ? 'fill-brand-500 text-brand-500'
                  : 'fill-stone-100 text-stone-300 dark:fill-stone-800 dark:text-stone-600'
              }
            />
          );
        })}
      </div>
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-stone-800 dark:text-stone-100">
          {numericRating > 0 ? numericRating.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
}

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Exceptional',
};

export function StarRatingInput({ value = 0, onChange, disabled = false, error = '' }) {
  const [hovered, setHovered] = useState(0);
  const activeRating = hovered || Number(value) || 0;

  return (
    <div>
      <div
        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
        onMouseLeave={() => setHovered(0)}
        role="radiogroup"
        aria-label="Select rating from 1 to 5 stars"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= activeRating;
          const isSelected = star === Number(value);
          return (
            <motion.button
              key={star}
              type="button"
              disabled={disabled}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => !disabled && setHovered(star)}
              whileHover={disabled ? undefined : { scale: 1.18 }}
              whileTap={disabled ? undefined : { scale: 0.9 }}
              animate={
                isSelected
                  ? { scale: [1, 1.24, 1], transition: { duration: 0.25 } }
                  : { scale: 1 }
              }
              className="rounded-md p-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed"
            >
              <Star
                size={24}
                className={`transition-colors duration-150 ${
                  isActive
                    ? 'fill-brand-500 text-brand-500'
                    : 'fill-white text-stone-300 hover:text-brand-300 dark:fill-stone-800 dark:text-stone-600'
                }`}
              />
            </motion.button>
          );
        })}

        <span className="ml-2 min-w-[82px] text-xs font-medium text-stone-600 dark:text-stone-300">
          {activeRating ? `${activeRating}/5 · ${RATING_LABELS[activeRating]}` : 'Select rating'}
        </span>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
