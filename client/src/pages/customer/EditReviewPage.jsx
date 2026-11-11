import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Save } from 'lucide-react';
import { toast } from 'sonner';
import { reviewApi } from '../../api/endpoints';
import { PageTransition } from '../../components/PageTransition';
import { StarRatingInput } from '../../components/StarRating';
import { ErrorState } from '../../components/EmptyState';
import {
  FALLBACK_RESTAURANT_IMAGE,
  extractErrorMessage,
} from '../../utils/formatters';

export function EditReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    reviewApi
      .getById(id)
      .then(({ data }) => {
        if (!active) return;
        setReview(data.review);
        setRating(data.review.rating);
        setComment(data.review.comment || '');
      })
      .catch((err) => {
        if (!active) return;
        setError(extractErrorMessage(err, 'Unable to load review'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFormError('Please select a star rating from 1 to 5.');
      return;
    }
    const trimmed = comment.trim();
    if (!trimmed) {
      setFormError('Review comment cannot be empty.');
      return;
    }
    if (trimmed.length > 1000) {
      setFormError('Review comment cannot exceed 1000 characters.');
      return;
    }

    setSaving(true);
    try {
      await reviewApi.update(id, { rating, comment: trimmed });
      toast.success('Review updated successfully');
      if (review?.restaurant?._id) {
        navigate(`/restaurants/${review.restaurant._id}`);
      } else {
        navigate('/my-reviews');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to update review');
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="card-surface h-72 animate-pulse bg-stone-100/70" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <ErrorState message={error || 'Review not found'} />
        <div className="mt-4 text-center">
          <Link to="/my-reviews" className="btn-secondary">
            <ArrowLeft size={15} />
            Back to My Reviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-5">
        <Link
          to="/my-reviews"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft size={16} />
          Back to My Reviews
        </Link>
      </div>

      <div className="card-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Edit Your Review
        </h1>

        {review.restaurant && (
          <div className="mt-4 flex items-center gap-3.5 rounded-xl border border-stone-200/80 bg-surface-bg p-3.5 dark:border-stone-800">
            <img
              src={review.restaurant.image || FALLBACK_RESTAURANT_IMAGE}
              alt={review.restaurant.name}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
              }}
              className="h-14 w-14 rounded-xl object-cover"
            />
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">{review.restaurant.name}</p>
              <p className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                <MapPin size={12} className="text-brand-500" />
                {review.restaurant.location}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Rating
            </label>
            <StarRatingInput value={rating} onChange={setRating} disabled={saving} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                Review Comment
              </label>
              <span className="text-xs text-stone-400 dark:text-stone-500">{comment.length}/1000</span>
            </div>
            <textarea
              rows={5}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input-field resize-y"
              disabled={saving}
            />
          </div>

          {formError && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{formError}</p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
            <Link to="/my-reviews" className="btn-secondary">
              Cancel
            </Link>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              disabled={saving}
              className="btn-primary"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
