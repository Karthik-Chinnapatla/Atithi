import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  MessageSquare,
  Star,
  Store,
  Users,
} from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { PageTransition } from '../../components/PageTransition';
import { StarRatingDisplay } from '../../components/StarRating';
import { DashboardSkeleton } from '../../components/Skeletons';
import { ErrorState } from '../../components/EmptyState';
import {
  ROLE_LABELS,
  extractErrorMessage,
  formatDate,
  formatRating,
} from '../../utils/formatters';

export function AdminDashboardPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getDashboard();
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load admin dashboard'));
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

  if (error || !data) {
    return <ErrorState message={error} onRetry={loadDashboard} />;
  }

  const {
    kpis,
    ratingDistribution = [],
    recentReviews = [],
    recentUsers = [],
    recentRestaurants = [],
  } = data;

  const chartData = [...ratingDistribution]
    .sort((a, b) => a.rating - b.rating)
    .map((item) => ({
      label: `${item.rating} ★`,
      count: item.count,
      percentage: item.percentage,
    }));

  const kpiCards = [
    {
      label: 'Total Users',
      value: kpis?.totalUsers ?? 0,
      icon: Users,
      sub: 'Customers, owners & admins',
    },
    {
      label: 'Total Restaurants',
      value: kpis?.totalRestaurants ?? 0,
      icon: Store,
      sub: 'Listed dining venues',
    },
    {
      label: 'Total Reviews',
      value: kpis?.totalReviews ?? 0,
      icon: MessageSquare,
      sub: 'Verified customer ratings',
    },
    {
      label: 'Average Platform Rating',
      value:
        kpis?.averagePlatformRating !== null &&
        kpis?.averagePlatformRating !== undefined
          ? `${formatRating(kpis.averagePlatformRating)} / 5`
          : 'No ratings yet',
      icon: Star,
      sub: 'Live MongoDB aggregation',
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Platform Administration
        </span>
        <h1 className="mt-1 font-display text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Real-time metrics across users, restaurants, and customer reviews.
        </p>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {card.label}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                  <Icon size={17} />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Rating Distribution Recharts + Recent Reviews */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
            Rating Distribution
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Platform-wide review counts across 1 to 5 stars
          </p>

          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#292524' : '#E7E5E4'}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: isDark ? '#D6D3D1' : '#57534E' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: isDark ? '#A8A29E' : '#78716C' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(234, 88, 12, 0.12)' : '#FFF7ED' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: isDark ? '1px solid #44403C' : '1px solid #E7E5E4',
                    backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                    color: isDark ? '#F5F5F4' : '#1C1917',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Reviews"
                  fill="#EA580C"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
              Recent Reviews
            </h2>
            <Link
              to="/admin/reviews"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Manage all
            </Link>
          </div>

          {recentReviews.length === 0 ? (
            <p className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500 dark:bg-stone-800/60 dark:text-stone-400">
              No reviews submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {recentReviews.map((rev) => (
                <div key={rev._id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {rev.customer?.name || 'Customer'}{' '}
                      <span className="font-normal text-stone-400 dark:text-stone-500">on</span>{' '}
                      <span className="text-brand-700 dark:text-brand-400">
                        {rev.restaurant?.name || 'Restaurant'}
                      </span>
                    </p>
                    <StarRatingDisplay rating={rev.rating} size={13} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-stone-600 dark:text-stone-400">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Users & Recent Restaurants */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
              Recently Registered Users
            </h2>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentUsers.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {u.name}
                  </p>
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">{u.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  <p className="mt-0.5 text-[11px] text-stone-400 dark:text-stone-500">
                    {formatDate(u.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
              Recently Added Restaurants
            </h2>
            <Link
              to="/admin/restaurants"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentRestaurants.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {r.name}
                  </p>
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">{r.location}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      r.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {r.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <p className="mt-0.5 text-[11px] text-stone-400 dark:text-stone-500">
                    {r.owner ? `Owner: ${r.owner.name}` : 'Unassigned'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
