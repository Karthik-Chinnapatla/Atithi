import { useCallback, useEffect, useState } from 'react';
import { Eye, MessageSquare, Search, Store, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../api/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { PageTransition } from '../../components/PageTransition';
import { StarRatingDisplay } from '../../components/StarRating';
import { FilterSelect } from '../../components/FilterSelect';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { TableSkeleton } from '../../components/Skeletons';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { extractErrorMessage, formatDate } from '../../utils/formatters';

export function ManageReviewsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [inspectedReview, setInspectedReview] = useState(null);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.getReviews({
        search: debouncedSearch.trim(),
        rating,
        page,
        limit: 10,
      });
      setReviews(data.reviews || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, rating, page]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteReview(reviewToDelete._id);
      toast.success('Review removed successfully');
      setReviewToDelete(null);
      loadReviews();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to remove review'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Manage Reviews
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Moderate customer reviews, inspect author and restaurant details, and remove
          inappropriate content.
        </p>
      </div>

      {/* Filters */}
      <div className="card-surface grid grid-cols-1 gap-3 p-4 sm:grid-cols-12">
        <div className="relative sm:col-span-8">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search reviews by comment, customer, or restaurant..."
            className="input-field pl-10"
          />
        </div>

        <div className="sm:col-span-4">
          <FilterSelect
            value={rating}
            onChange={(val) => {
              setRating(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Star Ratings' },
              { value: '5', label: '5 Stars' },
              { value: '4', label: '4 Stars' },
              { value: '3', label: '3 Stars' },
              { value: '2', label: '2 Stars' },
              { value: '1', label: '1 Star' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReviews} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No matching reviews"
          description="No customer reviews match your current search or rating filter."
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-400">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Restaurant</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Comment</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {reviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-900 dark:text-stone-100">
                        {rev.customer?.name || 'Customer'}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {rev.customer?.email || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-800 dark:text-stone-200">
                        {rev.restaurant?.name || 'Restaurant'}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {rev.restaurant?.location || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StarRatingDisplay rating={rev.rating} size={14} showValue />
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      <p className="line-clamp-2 text-xs text-stone-600 dark:text-stone-300">
                        {rev.comment}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs text-stone-500 dark:text-stone-400">
                      {formatDate(rev.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectedReview(rev)}
                          title="Inspect Details"
                          className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewToDelete(rev)}
                          title="Remove Review"
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 pb-5">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Inspect Review Modal */}
      <Modal
        isOpen={Boolean(inspectedReview)}
        onClose={() => setInspectedReview(null)}
        title="Review Details"
      >
        {inspectedReview && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-stone-200/80 p-3.5 dark:border-stone-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  <User size={13} />
                  Customer
                </div>
                <p className="mt-1 font-semibold text-stone-900 dark:text-stone-100">
                  {inspectedReview.customer?.name}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {inspectedReview.customer?.email}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200/80 p-3.5 dark:border-stone-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  <Store size={13} />
                  Restaurant
                </div>
                <p className="mt-1 font-semibold text-stone-900 dark:text-stone-100">
                  {inspectedReview.restaurant?.name}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {inspectedReview.restaurant?.location}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800/70">
              <div className="flex items-center justify-between">
                <StarRatingDisplay
                  rating={inspectedReview.rating}
                  size={16}
                  showValue
                />
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {formatDate(inspectedReview.createdAt)}
                </span>
              </div>
              <p className="mt-3 leading-relaxed text-stone-700 dark:text-stone-300">
                {inspectedReview.comment}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleDeleteReview}
        title="Remove Inappropriate Review?"
        message={`Remove ${
          reviewToDelete?.customer?.name || 'this customer'
        }'s review for "${
          reviewToDelete?.restaurant?.name || 'this restaurant'
        }"? This immediately updates the restaurant's average rating.`}
        confirmText="Remove Review"
        loading={deleting}
      />
    </PageTransition>
  );
}
