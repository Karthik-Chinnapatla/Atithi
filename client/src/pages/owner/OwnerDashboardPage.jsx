import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  MessageSquare,
  Star,
  Store,
  TrendingUp,
} from 'lucide-react';
import { ownerApi } from '../../api/endpoints';
import { PageTransition } from '../../components/PageTransition';
import { StarRatingDisplay } from '../../components/StarRating';
import { RatingDistributionBars } from '../../components/RatingDistributionBars';
import { DashboardSkeleton } from '../../components/Skeletons';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import {
  extractErrorMessage,
  formatDate,
  formatRating,
} from '../../utils/formatters';

export function OwnerDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ownerApi.getDashboard();
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load owner dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboard} />;
  }

  if (!data?.assigned || !data?.restaurant) {
    return (
      <PageTransition>
        <EmptyState
          icon={Store}
          title="No Restaurant Assigned Yet"
          description="Your restaurant owner account has not been linked to a restaurant yet. Please ask an administrator to assign your restaurant."
        />
      </PageTransition>
    );
  }

  const { restaurant, stats, recentReviews = [] } = data;
  const counts = stats?.ratingCounts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Restaurant Overview
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
            {restaurant.name}
          </h1>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">{restaurant.location}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/owner/restaurant/edit" className="btn-secondary">
            Edit Details
          </Link>
          <Link to="/owner/reviews" className="btn-primary">
            All Reviews
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Restaurant Name
            </span>
            <Store size={18} className="text-brand-600 dark:text-brand-400" />
          </div>
          <p className="mt-3 truncate font-display text-xl font-bold text-stone-900 dark:text-stone-100">
            {restaurant.name}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {restaurant.isActive ? 'Active & visible to diners' : 'Inactive listing'}
          </p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Average Rating
            </span>
            <TrendingUp size={18} className="text-brand-600 dark:text-brand-400" />
          </div>
          <p className="mt-3 font-display text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {stats?.averageRating !== null && stats?.averageRating !== undefined
              ? `${formatRating(stats.averageRating)} / 5.0`
              : 'No ratings yet'}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Calculated live from verified reviews
          </p>
        </div>

        <div className="card-surface p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Total Reviews
            </span>
            <MessageSquare size={18} className="text-brand-600 dark:text-brand-400" />
          </div>
          <p className="mt-3 font-display text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {stats?.totalReviews ?? 0}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Customer feedback submissions</p>
        </div>
      </div>

      {/* 5-star through 1-star breakdown cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[5, 4, 3, 2, 1].map((star) => (
          <motion.div
            key={star}
            whileHover={{ y: -2 }}
            className="card-surface p-4 text-center"
          >
            <div className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              <span>{star}-Star</span>
              <Star size={11} className="fill-brand-500 text-brand-500" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              {counts[star] ?? 0}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">ratings</p>
          </motion.div>
        ))}
      </div>

      {/* Distribution & Recent Reviews */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
            Rating Distribution
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Share of 1-star through 5-star customer ratings
          </p>
          <div className="mt-5">
            <RatingDistributionBars
              distribution={stats?.ratingDistribution || []}
              totalReviews={stats?.totalReviews || 0}
            />
          </div>
        </div>

        <div className="card-surface p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
              Recent Customer Reviews
            </h2>
            <Link
              to="/owner/reviews"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all
            </Link>
          </div>

          {recentReviews.length === 0 ? (
            <p className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500 dark:bg-stone-800/60 dark:text-stone-400">
              No customer reviews have been submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {recentReviews.map((rev) => (
                <div key={rev._id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {rev.customer?.name || 'Customer'}
                    </span>
                    <div className="flex items-center gap-2">
                      <StarRatingDisplay rating={rev.rating} size={13} />
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-stone-600 dark:text-stone-300">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
