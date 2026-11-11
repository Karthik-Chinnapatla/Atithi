import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, MapPin, Phone, Star, Store } from 'lucide-react';
import { ownerApi } from '../../api/endpoints';
import { PageTransition } from '../../components/PageTransition';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import {
  FALLBACK_RESTAURANT_IMAGE,
  extractErrorMessage,
  formatRating,
} from '../../utils/formatters';

export function OwnerRestaurantPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRestaurant = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ownerApi.getRestaurant();
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load restaurant details'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  if (loading) {
    return <div className="card-surface h-80 animate-pulse bg-stone-100/70" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadRestaurant} />;
  }

  if (!data?.assigned || !data?.restaurant) {
    return (
      <EmptyState
        icon={Store}
        title="No Restaurant Assigned"
        description="Contact a platform administrator to assign a restaurant to your owner profile."
      />
    );
  }

  const { restaurant, stats } = data;

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            My Restaurant
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Review your public restaurant listing and keep information up to date.
          </p>
        </div>

        <Link to="/owner/restaurant/edit" className="btn-primary">
          <Edit3 size={15} />
          Edit Restaurant Info
        </Link>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div className="h-64 bg-stone-100 dark:bg-stone-800 lg:col-span-2 lg:h-auto">
            <img
              src={restaurant.image || FALLBACK_RESTAURANT_IMAGE}
              alt={restaurant.name}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
              }}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-8 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    restaurant.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {restaurant.isActive ? 'Active Listing' : 'Inactive'}
                </span>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  {restaurant.priceRange}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-800 dark:text-stone-100">
                <Star size={15} className="fill-brand-500 text-brand-500" />
                {stats?.averageRating !== null && stats?.averageRating !== undefined
                  ? `${formatRating(stats.averageRating)} (${stats.totalReviews} reviews)`
                  : 'No ratings yet'}
              </div>
            </div>

            <h2 className="mt-3 font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              {restaurant.name}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {restaurant.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {(restaurant.cuisine || []).map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-stone-200 bg-surface-muted px-3 py-1 text-xs font-medium text-stone-700 dark:border-stone-700 dark:text-stone-300"
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-stone-100 pt-5 text-sm dark:border-stone-800 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  Location &amp; Address
                </p>
                <p className="mt-1 flex items-start gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-brand-500" />
                  <span>
                    {restaurant.location}
                    <br />
                    <span className="font-normal text-stone-500 dark:text-stone-400">
                      {restaurant.address}
                    </span>
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  Phone Number
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                  <Phone size={15} className="shrink-0 text-brand-500" />
                  {restaurant.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
