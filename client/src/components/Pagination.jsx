import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function Pagination({ page, totalPages, total, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-stone-200/80 pt-5 dark:border-stone-800 sm:flex-row">
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
        Page <span className="font-semibold text-stone-800 dark:text-stone-100">{page}</span> of{' '}
        <span className="font-semibold text-stone-800 dark:text-stone-100">{totalPages}</span>
        {typeof total === 'number' && ` · ${total} total results`}
      </p>

      <div className="flex items-center gap-1.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          <ChevronLeft size={15} />
          Prev
        </motion.button>

        {pages.map((p) => (
          <motion.button
            key={p}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onPageChange(p)}
            className={`h-9 min-w-[36px] rounded-xl px-2.5 text-xs font-semibold transition-colors ${
              p === page
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            {p}
          </motion.button>
        ))}

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Next
          <ChevronRight size={15} />
        </motion.button>
      </div>
    </div>
  );
}
