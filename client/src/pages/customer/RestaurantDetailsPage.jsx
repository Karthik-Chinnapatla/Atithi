import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit3,
  MapPin,
  MessageSquarePlus,
  Phone,
  Send,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { restaurantApi, reviewApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { PageTransition } from '../../components/PageTransition';
import { StarRatingDisplay, StarRatingInput } from '../../components/StarRating';
import { RatingDistributionBars } from '../../components/RatingDistributionBars';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RestaurantDetailSkeleton } from '../../components/Skeletons';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { FilterSelect } from '../../components/FilterSelect';
import {
  FALLBACK_RESTAURANT_IMAGE,
  extractErrorMessage,
  formatDate,
  formatRating,
} from '../../utils/formatters';

export function RestaurantDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPagination, setReviewsPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [ratingFilter, setRatingFilter] = useState('');
  const [reviewSort, setReviewSort] = useState('newest');

  // New Review Form State
  const [ratingInput, setRatingInput] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadRestaurant = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await restaurantApi.getById(id);
      setRestaurant(data.restaurant);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load restaurant details'));
    } finally {
      setLoading(false);
    }
  }, [id, user?._id]);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const { data } = await reviewApi.getByRestaurant(id, {
        page: reviewsPage,
        limit: 6,
        rating: ratingFilter,
        sort: reviewSort,
      });
      setReviews(data.reviews || []);
      setReviewsPagination(
        data.pagination || { page: 1, totalPages: 1, total: 0 }
      );
      if (data.ratingStats) {
        setRestaurant((prev) =>
          prev ? { ...prev, ...data.ratingStats } : prev
        );
      }
    } catch {
      // Keep UI clean; primary error handled on details fetch
    } finally {
      setReviewsLoading(false);
    }
  }, [id, reviewsPage, ratingFilter, reviewSort]);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!Number.isInteger(ratingInput) || ratingInput < 1 || ratingInput > 5) {
      setFormError('Please select a star rating between 1 and 5.');
      return;
    }
    const trimmed = commentInput.trim();
    if (!trimmed) {
      setFormError('Please write a review comment.');
      return;
    }
    if (trimmed.length > 1000) {
      setFormError('Review comment cannot exceed 1000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await reviewApi.create({
        restaurant: id,
        rating: ratingInput,
        comment: trimmed,
      });
      toast.success('Thank you! Your review has been published.');
      setRatingInput(0);
      setCommentInput('');
      setRestaurant((prev) =>
        prev
          ? {
              ...prev,
              ...data.ratingStats,
              myReview: data.review,
            }
          : prev
      );
      setReviewsPage(1);
      await loadReviews();
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to submit review');
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMyReview = async () => {
    if (!restaurant?.myReview?._id) return;
    setDeleting(true);
    try {
      const { data } = await reviewApi.remove(restaurant.myReview._id);
      toast.success('Your review was deleted.');
      setDeleteDialogOpen(false);
      setRestaurant((prev) =>
        prev
          ? {
              ...prev,
              ...data.ratingStats,
              myReview: null,
            }
          : prev
      );
      await loadReviews();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete review'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <RestaurantDetailSkeleton />;
  }

  if (error || !restaurant) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ErrorState
          title="Restaurant unavailable"
          message={error || 'Restaurant not found.'}
          onRetry={loadRestaurant}
        />
        <div className="mt-4 text-center">
          <Link to="/" className="btn-secondary">
            <ArrowLeft size={15} />
            Back to Restaurants
          </Link>
        </div>
      </div>
    );
  }

  const hasRating =
    restaurant.averageRating !== null && restaurant.averageRating !== undefined;

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft size={16} />
          Back to Discovery
        </Link>
      </div>

      {/* Hero Card */}
      <div className="card-surface overflow-hidden">
        <div className="relative h-64 w-full bg-stone-100 dark:bg-stone-800 sm:h-80 lg:h-96">
          <img
            src={restaurant.image || FALLBACK_RESTAURANT_IMAGE}
            alt={restaurant.name}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {(restaurant.cuisine || []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
              {restaurant.priceRange && (
                <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  {restaurant.priceRange}
                </span>
              )}
            </div>

            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {restaurant.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-stone-200">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-brand-400" />
                {restaurant.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone size={15} className="text-brand-400" />
                {restaurant.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details & Rating Breakdown */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Overview */}
          <div className="card-surface p-6">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              About {restaurant.name}
            </h2>
            <p className="mt-3 leading-relaxed text-stone-600 dark:text-stone-300">
              {restaurant.description}
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 border-t border-stone-100 pt-4 text-sm text-stone-600 dark:border-stone-800 dark:text-stone-300 sm:grid-cols-2">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  Address
                </span>
                <span className="mt-0.5 block font-medium text-stone-800 dark:text-stone-200">
                  {restaurant.address}
                </span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  Contact Phone
                </span>
                <span className="mt-0.5 block font-medium text-stone-800 dark:text-stone-200">
                  {restaurant.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Review Submission / User's Existing Review */}
          <div className="card-surface p-6">
            {!isAuthenticated ? (
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                    Visited {restaurant.name}?
                  </h3>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Sign in with your customer account to rate your dining experience.
                  </p>
                </div>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="btn-primary shrink-0"
                >
                  Sign In to Review
                </Link>
              </div>
            ) : user?.role !== 'CUSTOMER' ? (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-300">
                Only customer accounts can submit reviews. Signed in as{' '}
                <span className="font-semibold text-stone-900 dark:text-stone-100">{user.role}</span>.
              </div>
            ) : restaurant.myReview ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                      Your Published Review
                    </span>
                    <h3 className="mt-1.5 font-display text-base font-bold text-stone-900 dark:text-stone-100">
                      Thanks for sharing your experience
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/reviews/${restaurant.myReview._id}/edit`}
                      className="btn-secondary py-2 text-xs"
                    >
                      <Edit3 size={14} />
                      Edit Review
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
                    >
                      <Trash2 size={14} />
                      Delete Review
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-stone-200/80 bg-surface-bg p-4 dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <StarRatingDisplay
                      rating={restaurant.myReview.rating}
                      size={17}
                      showValue
                    />
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {formatDate(restaurant.myReview.updatedAt || restaurant.myReview.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                    {restaurant.myReview.comment}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus size={19} className="text-brand-600 dark:text-brand-400" />
                  <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                    Write a Review
                  </h3>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    Your Rating
                  </label>
                  <StarRatingInput
                    value={ratingInput}
                    onChange={setRatingInput}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      Your Review
                    </label>
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {commentInput.length}/1000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Share what stood out — dishes, atmosphere, hospitality..."
                    className="input-field resize-y"
                    disabled={submitting}
                  />
                </div>

                {formError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">{formError}</p>
                )}

                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={submitting}
                    className="btn-primary"
                  >
                    <Send size={15} />
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </motion.button>
                </div>
              </form>
            )}
          </div>

          {/* Customer Reviews List */}
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                Customer Reviews ({restaurant.totalReviews || 0})
              </h2>

              <div className="flex items-center gap-2.5">
                <div className="w-36">
                  <FilterSelect
                    value={ratingFilter}
                    onChange={(val) => {
                      setRatingFilter(val);
                      setReviewsPage(1);
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
                <div className="w-36">
                  <FilterSelect
                    value={reviewSort}
                    onChange={(val) => {
                      setReviewSort(val);
                      setReviewsPage(1);
                    }}
                    options={[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'highest', label: 'Highest Rated' },
                      { value: 'lowest', label: 'Lowest Rated' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card-surface h-28 animate-pulse bg-stone-100/70 dark:bg-stone-800/60" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description={
                  ratingFilter
                    ? 'No reviews match this star rating filter.'
                    : 'Be the first diner to share an honest review for this restaurant.'
                }
              />
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <motion.div
                    key={rev._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-surface p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                          {rev.customer?.name?.charAt(0)?.toUpperCase() || 'D'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {rev.customer?.name || 'Verified Diner'}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">
                            {formatDate(rev.createdAt)}
                            {rev.updatedAt && rev.updatedAt !== rev.createdAt && ' (edited)'}
                          </p>
                        </div>
                      </div>
                      <StarRatingDisplay rating={rev.rating} size={15} showValue />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                      {rev.comment}
                    </p>
                  </motion.div>
                ))}

                <Pagination
                  page={reviewsPagination.page}
                  totalPages={reviewsPagination.totalPages}
                  total={reviewsPagination.total}
                  onPageChange={setReviewsPage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Aggregated Rating Summary */}
        <div className="lg:col-span-1">
          <div className="card-surface sticky top-24 p-6">
            <h3 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
              Rating Summary
            </h3>

            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-surface-bg p-4 dark:border-stone-800">
              {hasRating ? (
                <>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 font-display text-2xl font-extrabold text-white">
                    {formatRating(restaurant.averageRating)}
                  </div>
                  <div>
                    <StarRatingDisplay rating={restaurant.averageRating} size={17} />
                    <p className="mt-1 text-xs font-medium text-stone-500 dark:text-stone-400">
                      Based on {restaurant.totalReviews}{' '}
                      {restaurant.totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200/70 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                    <Star size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-100">No ratings yet</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">0 customer reviews</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Rating Distribution
              </p>
              <RatingDistributionBars
                distribution={restaurant.ratingDistribution || []}
                totalReviews={restaurant.totalReviews || 0}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteMyReview}
        title="Delete Your Review?"
        message="Are you sure you want to permanently remove your review? This will immediately recalculate the restaurant's rating."
        confirmText="Delete Review"
        loading={deleting}
      />
    </PageTransition>
  );
}
