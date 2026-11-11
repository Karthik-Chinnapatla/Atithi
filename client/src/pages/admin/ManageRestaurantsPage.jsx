import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Edit3,
  Plus,
  Search,
  Star,
  Store,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, restaurantApi } from '../../api/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { PageTransition } from '../../components/PageTransition';
import { FilterSelect } from '../../components/FilterSelect';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { TableSkeleton } from '../../components/Skeletons';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import {
  FALLBACK_RESTAURANT_IMAGE,
  extractErrorMessage,
  formatRating,
} from '../../utils/formatters';

export function ManageRestaurantsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [locationFilter, setLocationFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [restaurants, setRestaurants] = useState([]);
  const [filterMeta, setFilterMeta] = useState({ locations: [], cuisines: [] });
  const [owners, setOwners] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create / Edit Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  // Assign Owner Modal
  const [assignModalRestaurant, setAssignModalRestaurant] = useState(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Delete Confirm
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.getRestaurants({
        search: debouncedSearch.trim(),
        location: locationFilter,
        cuisine: cuisineFilter,
        page,
        limit: 10,
      });
      setRestaurants(data.restaurants || []);
      setFilterMeta(data.filters || { locations: [], cuisines: [] });
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load restaurants'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, locationFilter, cuisineFilter, page]);

  const loadOwners = useCallback(async () => {
    try {
      const { data } = await adminApi.getOwners({ limit: 100 });
      setOwners(data.owners || []);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  const openCreateModal = () => {
    setEditingRestaurant(null);
    reset({
      name: '',
      description: '',
      location: '',
      address: '',
      cuisineText: '',
      image: '',
      phone: '',
      priceRange: '$$',
      owner: '',
      isActive: true,
    });
    setFormModalOpen(true);
  };

  const openEditModal = (restaurant) => {
    setEditingRestaurant(restaurant);
    reset({
      name: restaurant.name || '',
      description: restaurant.description || '',
      location: restaurant.location || '',
      address: restaurant.address || '',
      cuisineText: (restaurant.cuisine || []).join(', '),
      image: restaurant.image || '',
      phone: restaurant.phone || '',
      priceRange: restaurant.priceRange || '$$',
      owner: restaurant.owner?._id || '',
      isActive: Boolean(restaurant.isActive),
    });
    setFormModalOpen(true);
  };

  const onSubmitRestaurant = async (values) => {
    const cuisineArray = values.cuisineText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!cuisineArray.length) {
      toast.error('Please enter at least one cuisine');
      return;
    }

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      location: values.location.trim(),
      address: values.address.trim(),
      cuisine: cuisineArray,
      image: values.image.trim(),
      phone: values.phone.trim(),
      priceRange: values.priceRange,
      owner: values.owner || null,
      isActive: Boolean(values.isActive),
    };

    try {
      if (editingRestaurant) {
        await restaurantApi.update(editingRestaurant._id, payload);
        toast.success('Restaurant updated successfully');
      } else {
        await restaurantApi.create(payload);
        toast.success('Restaurant created successfully');
      }
      setFormModalOpen(false);
      await Promise.all([loadRestaurants(), loadOwners()]);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to save restaurant'));
    }
  };

  const handleToggleActive = async (restaurant) => {
    try {
      await restaurantApi.update(restaurant._id, {
        isActive: !restaurant.isActive,
      });
      toast.success(
        `"${restaurant.name}" ${!restaurant.isActive ? 'activated' : 'deactivated'}`
      );
      loadRestaurants();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update status'));
    }
  };

  const openAssignModal = (restaurant) => {
    setAssignModalRestaurant(restaurant);
    setSelectedOwnerId(restaurant.owner?._id || '');
  };

  const handleAssignOwner = async (e) => {
    e.preventDefault();
    if (!assignModalRestaurant) return;
    setAssigning(true);
    try {
      await adminApi.assignOwner(assignModalRestaurant._id, selectedOwnerId || null);
      toast.success('Restaurant owner assignment updated');
      setAssignModalRestaurant(null);
      await Promise.all([loadRestaurants(), loadOwners()]);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to assign owner'));
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!restaurantToDelete) return;
    setDeleting(true);
    try {
      await restaurantApi.remove(restaurantToDelete._id);
      toast.success('Restaurant deleted successfully');
      setRestaurantToDelete(null);
      await Promise.all([loadRestaurants(), loadOwners()]);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete restaurant'));
    } finally {
      setDeleting(false);
    }
  };

  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    ...filterMeta.locations.map((loc) => ({ value: loc, label: loc })),
  ];

  const cuisineOptions = [
    { value: 'all', label: 'All Cuisines' },
    ...filterMeta.cuisines.map((c) => ({ value: c, label: c })),
  ];

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            Manage Restaurants
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Create listings, update metadata, assign owners, and toggle visibility.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          onClick={openCreateModal}
          className="btn-primary"
        >
          <Plus size={16} />
          Add Restaurant
        </motion.button>
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
            placeholder="Search by restaurant name..."
            className="input-field pl-10"
          />
        </div>

        <div className="sm:col-span-3">
          <FilterSelect
            value={locationFilter}
            onChange={(val) => {
              setLocationFilter(val);
              setPage(1);
            }}
            options={locationOptions}
          />
        </div>

        <div className="sm:col-span-3">
          <FilterSelect
            value={cuisineFilter}
            onChange={(val) => {
              setCuisineFilter(val);
              setPage(1);
            }}
            options={cuisineOptions}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRestaurants} />
      ) : restaurants.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No restaurants found"
          description="Try resetting your filters or add a new restaurant."
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-400">
                <tr>
                  <th className="px-5 py-3.5">Restaurant</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Owner</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {restaurants.map((r) => (
                  <tr key={r._id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.image || FALLBACK_RESTAURANT_IMAGE}
                          alt={r.name}
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
                          }}
                          className="h-11 w-14 shrink-0 rounded-lg object-cover bg-stone-100 dark:bg-stone-800"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-stone-900 dark:text-stone-100">
                            {r.name}
                          </p>
                          <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                            {r.location} · {(r.cuisine || []).slice(0, 2).join(', ')}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {r.averageRating !== null && r.averageRating !== undefined ? (
                        <div className="inline-flex items-center gap-1 font-semibold text-stone-800 dark:text-stone-200">
                          <Star size={13} className="fill-brand-500 text-brand-500" />
                          {formatRating(r.averageRating)}
                          <span className="text-xs font-normal text-stone-400 dark:text-stone-500">
                            ({r.totalReviews})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 dark:text-stone-500">No ratings yet</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {r.owner ? (
                        <div>
                          <p className="font-medium text-stone-800 dark:text-stone-200">{r.owner.name}</p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">{r.owner.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 dark:text-stone-500">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(r)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                          r.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                        }`}
                      >
                        {r.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAssignModal(r)}
                          title="Assign Owner"
                          className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 hover:text-brand-600 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-brand-400"
                        >
                          <UserCheck size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          title="Edit Restaurant"
                          className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestaurantToDelete(r)}
                          title="Delete Restaurant"
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

      {/* Create / Edit Restaurant Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingRestaurant ? 'Edit Restaurant' : 'Create Restaurant'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit(onSubmitRestaurant)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
                Restaurant Name
              </label>
              <input
                type="text"
                className="input-field"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
                Location (City / Neighborhood)
              </label>
              <input
                type="text"
                placeholder="Jubilee Hills, Hyderabad"
                className="input-field"
                {...register('location', { required: 'Location is required' })}
              />
              {errors.location && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.location.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Street Address
            </label>
            <input
              type="text"
              className="input-field"
              {...register('address', {
                required: 'Address is required',
                minLength: { value: 5, message: 'At least 5 characters' },
              })}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Description
            </label>
            <textarea
              rows={3}
              className="input-field"
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'At least 10 characters' },
              })}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
                Cuisines (comma separated)
              </label>
              <input
                type="text"
                placeholder="Italian, Wood-Fired"
                className="input-field"
                {...register('cuisineText', { required: 'Cuisines are required' })}
              />
              {errors.cuisineText && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cuisineText.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 40 2355 0100"
                className="input-field"
                {...register('phone', {
                  required: 'Phone is required',
                  minLength: { value: 7, message: 'Phone is too short' },
                })}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
                Image URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="input-field"
                {...register('image', {
                  required: 'Image URL is required',
                  pattern: {
                    value: /^https?:\/\/.+/i,
                    message: 'Enter a valid HTTP/HTTPS URL',
                  },
                })}
              />
              {errors.image && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.image.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
                Price Range
              </label>
              <select className="input-field" {...register('priceRange')}>
                <option value="$">$</option>
                <option value="$$">$$</option>
                <option value="$$$">$$$</option>
                <option value="$$$$">$$$$</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-center">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
                Assign Owner (Optional)
              </label>
              <select className="input-field" {...register('owner')}>
                <option value="">Unassigned</option>
                {owners.map((owner) => {
                  const busyElsewhere =
                    owner.assignedRestaurant &&
                    owner.assignedRestaurant._id !== editingRestaurant?._id;
                  return (
                    <option
                      key={owner._id}
                      value={owner._id}
                      disabled={busyElsewhere}
                    >
                      {owner.name} ({owner.email})
                      {busyElsewhere
                        ? ` — Assigned to ${owner.assignedRestaurant.name}`
                        : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 sm:mt-5">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 dark:border-stone-600 dark:bg-stone-800"
                {...register('isActive')}
              />
              Active listing (visible to customers)
            </label>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-stone-100 pt-4 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting
                ? 'Saving...'
                : editingRestaurant
                  ? 'Save Changes'
                  : 'Create Restaurant'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Owner Modal */}
      <Modal
        isOpen={Boolean(assignModalRestaurant)}
        onClose={() => setAssignModalRestaurant(null)}
        title="Assign Restaurant Owner"
        subtitle={assignModalRestaurant?.name}
      >
        <form onSubmit={handleAssignOwner} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Select Restaurant Owner
            </label>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="input-field"
            >
              <option value="">Unassigned (No Owner)</option>
              {owners.map((owner) => {
                const busyElsewhere =
                  owner.assignedRestaurant &&
                  owner.assignedRestaurant._id !== assignModalRestaurant?._id;
                return (
                  <option
                    key={owner._id}
                    value={owner._id}
                    disabled={busyElsewhere}
                  >
                    {owner.name} ({owner.email})
                    {busyElsewhere
                      ? ` — Assigned to ${owner.assignedRestaurant.name}`
                      : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setAssignModalRestaurant(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={assigning} className="btn-primary">
              {assigning ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(restaurantToDelete)}
        onClose={() => setRestaurantToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Restaurant?"
        message={`Deleting "${restaurantToDelete?.name}" will permanently remove the listing and all associated customer reviews.`}
        confirmText="Delete Restaurant"
        loading={deleting}
      />
    </PageTransition>
  );
}
