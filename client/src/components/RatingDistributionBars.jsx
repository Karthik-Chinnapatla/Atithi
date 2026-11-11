import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export function RatingDistributionBars({ distribution = [], totalReviews = 0 }) {
  const rows = [5, 4, 3, 2, 1].map((star) => {
    const found = distribution.find((item) => item.rating === star);
    const count = found ? found.count : 0;
    const percentage =
      found && typeof found.percentage === 'number'
        ? found.percentage
        : totalReviews > 0
          ? Math.round((count / totalReviews) * 100)
          : 0;
    return { rating: star, count, percentage };
  });

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.rating} className="flex items-center gap-3 text-sm">
          <div className="flex w-16 shrink-0 items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
            <span>{row.rating}</span>
            <Star size={13} className="fill-brand-500 text-brand-500" />
            <span className="sr-only">Stars</span>
          </div>

          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${row.percentage}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-brand-500"
            />
          </div>

          <div className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-stone-600 dark:text-stone-400">
            {row.count}
          </div>
        </div>
      ))}
    </div>
  );
}
