import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, MessageSquare, Star } from 'lucide-react';
import { FALLBACK_RESTAURANT_IMAGE, formatRating } from '../utils/formatters';

export const cardStaggerVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
};

export function RestaurantCard({ restaurant }) {
  const hasRating =
    restaurant.averageRating !== null && restaurant.averageRating !== undefined;

  return (
    <motion.article
      variants={cardStaggerVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card-surface group flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-card-hover"
    >
      <div className="relative h-48 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        <img
          src={restaurant.image || FALLBACK_RESTAURANT_IMAGE}
          alt={restaurant.name}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {restaurant.priceRange && (
            <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-sm backdrop-blur-sm dark:bg-stone-900/90 dark:text-stone-100">
              {restaurant.priceRange}
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          {hasRating ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-stone-900/85 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Star size={12} className="fill-brand-400 text-brand-400" />
              {formatRating(restaurant.averageRating)}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-lg bg-white/95 px-2.5 py-1 text-xs font-medium text-stone-600 shadow-sm backdrop-blur-sm dark:bg-stone-900/90 dark:text-stone-300">
              No ratings yet
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-lg font-bold text-stone-900 transition-colors group-hover:text-brand-600 dark:text-stone-100 dark:group-hover:text-brand-400">
            {restaurant.name}
          </h3>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
          <MapPin size={14} className="shrink-0 text-brand-500" />
          <span className="truncate">{restaurant.location}</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(restaurant.cuisine || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-stone-200/80 bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:border-stone-700 dark:text-stone-300"
            >
              {tag}
            </span>
          ))}
          {restaurant.cuisine?.length > 3 && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              +{restaurant.cuisine.length - 3}
            </span>
          )}
        </div>

        {typeof restaurant.myRating === 'number' && (
          <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/60 dark:text-brand-300">
            <Star size={12} className="fill-brand-500 text-brand-500" />
            Your rating: {restaurant.myRating}/5
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-4 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <MessageSquare size={14} className="text-stone-400 dark:text-stone-500" />
            <span>
              {restaurant.totalReviews || 0}{' '}
              {restaurant.totalReviews === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          <Link
            to={`/restaurants/${restaurant._id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-brand-600"
          >
            View Details
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
