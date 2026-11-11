import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  Flame,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { restaurantApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { PageTransition, FadeInSection } from '../../components/PageTransition';
import { RestaurantCard } from '../../components/RestaurantCard';
import { RestaurantGridSkeleton } from '../../components/Skeletons';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { FilterSelect } from '../../components/FilterSelect';
import { Pagination } from '../../components/Pagination';
import { extractErrorMessage } from '../../utils/formatters';

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export function HomePage() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);

  const [location, setLocation] = useState('all');
  const [cuisine, setCuisine] = useState('all');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);

  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    cuisines: [],
  });

  const [popularRestaurants, setPopularRestaurants] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);

  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasActiveFilters =
    Boolean(debouncedSearch.trim()) || location !== 'all' || cuisine !== 'all';

  useEffect(() => {
    let active = true;
    restaurantApi
      .getFilters()
      .then(({ data }) => {
        if (!active) return;
        setFilterOptions({
          locations: data.locations || [],
          cuisines: data.cuisines || [],
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setPopularLoading(true);
    restaurantApi
      .list({ popular: 'true', limit: 3 })
      .then(({ data }) => {
        if (!active) return;
        setPopularRestaurants(data.restaurants || []);
      })
      .catch(() => {
        if (active) setPopularRestaurants([]);
      })
      .finally(() => {
        if (active) setPopularLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?._id]);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await restaurantApi.list({
        search: debouncedSearch.trim(),
        location,
        cuisine,
        sort,
        page,
        limit: 9,
      });
      setRestaurants(data.restaurants || []);
      setPagination(
        data.pagination || { page: 1, limit: 9, total: 0, totalPages: 1 }
      );
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load restaurants'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, location, cuisine, sort, page, user?._id]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleResetFilters = () => {
    setSearchInput('');
    setLocation('all');
    setCuisine('all');
    setSort('popular');
    setPage(1);
  };

  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    ...filterOptions.locations.map((loc) => ({ value: loc, label: loc })),
  ];

  const cuisineOptions = [
    { value: 'all', label: 'All Cuisines' },
    ...filterOptions.cuisines.map((c) => ({ value: c, label: c })),
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviewed' },
    { value: 'newest', label: 'Recently Added' },
  ];

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="border-b border-stone-200/80 bg-white dark:border-stone-800/80 dark:bg-stone-950/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800/70 dark:bg-brand-950/60 dark:text-brand-300">
              <Sparkles size={13} />
              Honest Ratings &amp; Diner Insights
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
              Discover standout restaurants worth every reservation.
            </h1>
            <p className="mt-4 text-base text-stone-500 dark:text-stone-400 sm:text-lg">
              Explore curated spots by neighborhood and cuisine, read verified customer
              reviews, and share your own dining experience.
            </p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="mx-auto mt-8 max-w-5xl rounded-2xl border border-stone-200/90 bg-surface-bg p-3.5 shadow-sm dark:border-stone-800 sm:p-4"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="relative md:col-span-5">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search restaurant by name..."
                  aria-label="Search restaurants by name"
                  className="input-field pl-10"
                />
              </div>

              <div className="md:col-span-3">
                <FilterSelect
                  value={location}
                  onChange={(val) => {
                    setLocation(val);
                    setPage(1);
                  }}
                  options={locationOptions}
                  placeholder="All Locations"
                  icon={MapPin}
                />
              </div>

              <div className="md:col-span-2">
                <FilterSelect
                  value={cuisine}
                  onChange={(val) => {
                    setCuisine(val);
                    setPage(1);
                  }}
                  options={cuisineOptions}
                  placeholder="All Cuisines"
                  icon={Utensils}
                />
              </div>

              <div className="md:col-span-2">
                <FilterSelect
                  value={sort}
                  onChange={(val) => {
                    setSort(val);
                    setPage(1);
                  }}
                  options={sortOptions}
                  placeholder="Sort"
                  icon={ArrowUpDown}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/70 pt-3 dark:border-stone-800">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Showing filtered results
                  {debouncedSearch.trim() ? ` for "${debouncedSearch.trim()}"` : ''}
                  {location !== 'all' ? ` in ${location}` : ''}
                  {cuisine !== 'all' ? ` · ${cuisine}` : ''}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/60"
                >
                  <RotateCcw size={13} />
                  Clear Filters
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* Popular Restaurants Section */}
        {!hasActiveFilters && (popularLoading || popularRestaurants.length > 0) && (
          <FadeInSection className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                  <Flame size={17} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                    Popular Restaurants
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Top-rated dining experiences loved by our community
                  </p>
                </div>
              </div>
            </div>

            {popularLoading ? (
              <RestaurantGridSkeleton count={3} />
            ) : (
              <motion.div
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {popularRestaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                ))}
              </motion.div>
            )}
          </FadeInSection>
        )}

        {/* All / Filtered Restaurant Directory */}
        <FadeInSection>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                {hasActiveFilters ? 'Matching Restaurants' : 'All Restaurants'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {loading
                  ? 'Updating listing...'
                  : `${pagination.total} ${
                      pagination.total === 1 ? 'restaurant' : 'restaurants'
                    } available`}
              </p>
            </div>
          </div>

          {loading ? (
            <RestaurantGridSkeleton count={6} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchRestaurants} />
          ) : restaurants.length === 0 ? (
            <EmptyState
              title="No matching restaurants found"
              description="Try broadening your search keyword or resetting the location and cuisine filters."
              action={
                hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn-secondary"
                  >
                    <RotateCcw size={14} />
                    Reset Filters
                  </button>
                )
              }
            />
          ) : (
            <>
              <motion.div
                key={`${page}-${location}-${cuisine}-${sort}-${debouncedSearch}`}
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {restaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                ))}
              </motion.div>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  window.scrollTo({ top: 320, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </FadeInSection>
      </div>
    </PageTransition>
  );
}
