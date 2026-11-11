import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Search, Store } from 'lucide-react';
import { ownerApi } from '../../api/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { PageTransition } from '../../components/PageTransition';
import { StarRatingDisplay } from '../../components/StarRating';
import { FilterSelect } from '../../components/FilterSelect';
import { Pagination } from '../../components/Pagination';
import { TableSkeleton } from '../../components/Skeletons';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { extractErrorMessage, formatDate } from '../../utils/formatters';

export function OwnerReviewsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [rating, setRating] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ownerApi.getReviews({
        search: debouncedSearch.trim(),
        rating,
        sort,
        page,
        limit: 8,
      });
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, rating, sort, page]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  if (!loading && data && !data.assigned) {
    return (
      <EmptyState
        icon={Store}
        title="No Restaurant Assigned"
        description="Once an administrator assigns a restaurant to your account, customer reviews will appear here."
      />
    );
  }

  const reviews = data?.reviews || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Restaurant Reviews
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Read customer feedback for {data?.restaurant?.name || 'your restaurant'}.
          Customer reviews cannot be edited or deleted by owners.
        </p>
      </div>

      {/* Filters */}
      <div className="card-surface grid grid-cols-1 gap-3 p-4 sm:grid-cols-12">
        <div className="relative sm:col-span-6">
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
            placeholder="Search by customer name or review text..."
            className="input-field pl-10"
          />
        </div>

        <div className="sm:col-span-3">
          <FilterSelect
            value={rating}
            onChange={(val) => {
              setRating(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Ratings' },
              { value: '5', label: '5 Stars' },
              { value: '4', label: '4 Stars' },
              { value: '3', label: '3 Stars' },
              { value: '2', label: '2 Stars' },
              { value: '1', label: '1 Star' },
            ]}
          />
        </div>

        <div className="sm:col-span-3">
          <FilterSelect
            value={sort}
            onChange={(val) => {
              setSort(val);
              setPage(1);
            }}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'highest', label: 'Highest Rated' },
              { value: 'lowest', label: 'Lowest Rated' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReviews} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews found"
          description="No customer reviews match your current search or rating filter."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev._id} className="card-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                    {rev.customer?.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {rev.customer?.name || 'Customer'}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      {formatDate(rev.createdAt)}
                    </p>
                  </div>
                </div>
                <StarRatingDisplay rating={rev.rating} size={15} showValue />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {rev.comment}
              </p>
            </div>
          ))}

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </PageTransition>
  );
}
