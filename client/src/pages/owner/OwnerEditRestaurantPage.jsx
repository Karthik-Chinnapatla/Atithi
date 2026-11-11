import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Store } from 'lucide-react';
import { toast } from 'sonner';
import { ownerApi } from '../../api/endpoints';
import { PageTransition } from '../../components/PageTransition';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import {
  FALLBACK_RESTAURANT_IMAGE,
  extractErrorMessage,
} from '../../utils/formatters';

export function OwnerEditRestaurantPage() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      description: '',
      phone: '',
      location: '',
      address: '',
      cuisineText: '',
      image: '',
      priceRange: '$$',
    },
  });

  const watchedImage = watch('image');
  const watchedCuisineText = watch('cuisineText');

  useEffect(() => {
    let active = true;
    setLoading(true);
    ownerApi
      .getRestaurant()
      .then(({ data }) => {
        if (!active) return;
        setRestaurant(data.restaurant || null);
        if (data.restaurant) {
          reset({
            description: data.restaurant.description || '',
            phone: data.restaurant.phone || '',
            location: data.restaurant.location || '',
            address: data.restaurant.address || '',
            cuisineText: (data.restaurant.cuisine || []).join(', '),
            image: data.restaurant.image || '',
            priceRange: data.restaurant.priceRange || '$$',
          });
        }
      })
      .catch((err) => {
        if (active) {
          setError(extractErrorMessage(err, 'Failed to load restaurant'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reset]);

  const onSubmit = async (values) => {
    const cuisineList = values.cuisineText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (cuisineList.length === 0) {
      toast.error('Please specify at least one cuisine');
      return;
    }

    try {
      await ownerApi.updateRestaurant({
        description: values.description.trim(),
        phone: values.phone.trim(),
        location: values.location.trim(),
        address: values.address.trim(),
        cuisine: cuisineList,
        image: values.image.trim(),
        priceRange: values.priceRange,
      });
      toast.success('Restaurant details updated');
      navigate('/owner/restaurant');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update restaurant'));
    }
  };

  if (loading) {
    return (
      <div className="card-surface h-96 animate-pulse bg-stone-100/70 dark:bg-stone-800/70" />
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!restaurant) {
    return (
      <EmptyState
        icon={Store}
        title="No Restaurant Assigned"
        description="You cannot edit restaurant details until an administrator assigns a restaurant to your account."
      />
    );
  }

  const previewCuisines = (watchedCuisineText || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          to="/owner/restaurant"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft size={16} />
          Back to My Restaurant
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Edit {restaurant.name}
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Update permitted listing details. Ownership and restaurant name are managed by
          administrators.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card-surface p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Restaurant Name (Read-Only)
            </label>
            <input type="text" value={restaurant.name} disabled className="input-field" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Price Range
            </label>
            <select className="input-field" {...register('priceRange')}>
              <option value="$">$ · Budget Friendly</option>
              <option value="$$">$$ · Moderate</option>
              <option value="$$$">$$$ · Upscale</option>
              <option value="$$$$">$$$$ · Fine Dining</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300">
            Description
          </label>
          <textarea
            rows={4}
            className="input-field resize-y"
            {...register('description', {
              required: 'Description is required',
              minLength: {
                value: 10,
                message: 'Description must be at least 10 characters',
              },
              maxLength: {
                value: 1500,
                message: 'Description cannot exceed 1500 characters',
              },
            })}
          />
          {errors.description && (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Location (City / Area)
            </label>
            <input
              type="text"
              className="input-field"
              {...register('location', {
                required: 'Location is required',
                minLength: { value: 2, message: 'Location is too short' },
              })}
            />
            {errors.location && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {errors.location.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Phone Number
            </label>
            <input
              type="text"
              className="input-field"
              {...register('phone', {
                required: 'Phone number is required',
                minLength: { value: 7, message: 'Phone number is too short' },
              })}
            />
            {errors.phone && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300">
            Street Address
          </label>
          <input
            type="text"
            className="input-field"
            {...register('address', {
              required: 'Address is required',
              minLength: { value: 5, message: 'Address must be at least 5 characters' },
            })}
          />
          {errors.address && (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.address.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300">
            Cuisines (comma separated)
          </label>
          <input
            type="text"
            placeholder="Italian, Wood-Fired, Wine Bar"
            className="input-field"
            {...register('cuisineText', {
              required: 'At least one cuisine is required',
            })}
          />
          {errors.cuisineText && (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.cuisineText.message}
            </p>
          )}
          {previewCuisines.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {previewCuisines.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Restaurant Image URL
            </label>
            <input
              type="url"
              className="input-field"
              {...register('image', {
                required: 'Image URL is required',
                pattern: {
                  value: /^https?:\/\/.+/i,
                  message: 'Must be a valid http:// or https:// image URL',
                },
              })}
            />
            {errors.image && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {errors.image.message}
              </p>
            )}
          </div>

          <div className="h-20 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800">
            <img
              src={watchedImage || FALLBACK_RESTAURANT_IMAGE}
              alt="Preview"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
              }}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-5 dark:border-stone-800">
          <Link to="/owner/restaurant" className="btn-secondary">
            Cancel
          </Link>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            disabled={isSubmitting}
            className="btn-primary"
          >
            <Save size={15} />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </form>
    </PageTransition>
  );
}
