import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing found',
  description = 'Try adjusting your filters or search criteria.',
  action = null,
}) {
  return (
    <div className="card-surface flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-stone-500 dark:text-stone-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Could not load data',
  message = 'An unexpected error occurred. Please try again.',
  onRetry = null,
}) {
  return (
    <div className="card-surface flex flex-col items-center justify-center border-red-200/80 bg-red-50/30 px-6 py-12 text-center dark:border-red-900/60 dark:bg-red-950/20">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-stone-300">{message}</p>
      {onRetry && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="btn-secondary mt-5"
        >
          <RefreshCw size={15} />
          Try Again
        </motion.button>
      )}
    </div>
  );
}
