import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit3, ExternalLink, MapPin, MessageSquareText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { reviewApi } from '../../api/endpoints';
import { PageTransition } from '../../components/PageTransition';
import { StarRatingDisplay } from '../../components/StarRating';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import {
  FALLBACK_RESTAURANT_IMAGE,
  extractErrorMessage,
  formatDate,
} from '../../utils/formatters';

export function MyReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMyReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await reviewApi.getMyReviews({ page, limit: 8 });
      setReviews(data.reviews || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load your reviews'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadMyReviews();
  }, [loadMyReviews]);

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    setDeleting(true);
    try {
      await reviewApi.remove(reviewToDelete._id);
      toast.success('Review deleted successfully');
      setReviewToDelete(null);
      loadMyReviews();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete review'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageTransition className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            My Reviews
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            View, update, or remove any restaurant review you have written.
          </p>
        </div>
        <Link to="/" className="btn-secondary">
          Explore Restaurants
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface h-36 animate-pulse bg-stone-100/70 dark:bg-stone-800/60" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadMyReviews} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="You haven't written any reviews yet"
          description="Explore restaurants and share your thoughts on food, ambiance, and service."
          action={
            <Link to="/" className="btn-primary">
              Discover Restaurants
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <motion.div
              key={rev._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-start"
            >
              <Link
                to={`/restaurants/${rev.restaurant?._id}`}
                className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800 sm:w-32"
              >
                <img
                  src={rev.restaurant?.image || FALLBACK_RESTAURANT_IMAGE}
                  alt={rev.restaurant?.name || 'Restaurant'}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
                  }}
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/restaurants/${rev.restaurant?._id}`}
                      className="inline-flex items-center gap-1.5 text-lg font-bold text-stone-900 hover:text-brand-600 dark:text-stone-100 dark:hover:text-brand-400"
                    >
                      {rev.restaurant?.name || 'Restaurant'}
                      <ExternalLink size={14} className="text-stone-400 dark:text-stone-500" />
                    </Link>
                    {rev.restaurant?.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                        <MapPin size={12} className="text-brand-500" />
                        {rev.restaurant.location}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/reviews/${rev._id}/edit`}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      <Edit3 size={13} />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setReviewToDelete(rev)}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <StarRatingDisplay rating={rev.rating} size={15} showValue />
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {formatDate(rev.updatedAt || rev.createdAt)}
                  </span>
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {rev.comment}
                </p>
              </div>
            </motion.div>
          ))}

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Review?"
        message={`Are you sure you want to delete your review for "${
          reviewToDelete?.restaurant?.name || 'this restaurant'
        }"?`}
        confirmText="Delete Review"
        loading={deleting}
      />
    </PageTransition>
  );
}
