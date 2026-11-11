import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Edit3, Plus, Search, Store, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../api/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { PageTransition } from '../../components/PageTransition';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { TableSkeleton } from '../../components/Skeletons';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import {
  PASSWORD_REGEX,
  extractErrorMessage,
  formatDate,
} from '../../utils/formatters';

export function ManageOwnersPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);

  const [owners, setOwners] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);

  const {
    register: regCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: creating },
  } = useForm();

  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: updating },
  } = useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ownersRes, restRes] = await Promise.all([
        adminApi.getOwners({
          search: debouncedSearch.trim(),
          page,
          limit: 12,
        }),
        adminApi.getRestaurants({ limit: 100 }),
      ]);
      setOwners(ownersRes.data.owners || []);
      setPagination(
        ownersRes.data.pagination || { page: 1, totalPages: 1, total: 0 }
      );
      setRestaurants(restRes.data.restaurants || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load restaurant owners'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    resetCreate({
      name: '',
      email: '',
      password: '',
      restaurantId: '',
    });
    setCreateOpen(true);
  };

  const openEditModal = (owner) => {
    setEditingOwner(owner);
    resetEdit({
      name: owner.name || '',
      email: owner.email || '',
      isActive: Boolean(owner.isActive),
      restaurantId: owner.assignedRestaurant?._id || '',
    });
  };

  const onCreateOwner = async (values) => {
    try {
      await adminApi.createOwner({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        restaurantId: values.restaurantId || null,
      });
      toast.success('Restaurant owner created successfully');
      setCreateOpen(false);
      loadData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to create owner'));
    }
  };

  const onEditOwner = async (values) => {
    if (!editingOwner) return;
    try {
      await adminApi.updateOwner(editingOwner._id, {
        name: values.name.trim(),
        email: values.email.trim(),
        isActive: Boolean(values.isActive),
        restaurantId: values.restaurantId || null,
      });
      toast.success('Owner details updated');
      setEditingOwner(null);
      loadData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update owner'));
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            Manage Restaurant Owners
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Create owner accounts, update details, and assign restaurants.
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
          Create Owner Account
        </motion.button>
      </div>

      {/* Search */}
      <div className="card-surface p-4">
        <div className="relative max-w-md">
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
            placeholder="Search owners by name or email..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : owners.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No restaurant owners found"
          description="Create a restaurant owner account and assign them to a restaurant."
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-400">
                <tr>
                  <th className="px-5 py-3.5">Owner</th>
                  <th className="px-5 py-3.5">Assigned Restaurant</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {owners.map((owner) => (
                  <tr key={owner._id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-900 dark:text-stone-100">{owner.name}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{owner.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      {owner.assignedRestaurant ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                          <Store size={13} />
                          {owner.assignedRestaurant.name}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 dark:text-stone-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          owner.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {owner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-stone-500 dark:text-stone-400">
                      {formatDate(owner.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(owner)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                      >
                        <Edit3 size={13} />
                        Edit
                      </button>
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

      {/* Create Owner Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Restaurant Owner"
        subtitle="Provision a new owner account and optionally link a restaurant."
      >
        <form onSubmit={handleCreateSubmit(onCreateOwner)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              {...regCreate('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'At least 2 characters' },
              })}
            />
            {createErrors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createErrors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              {...regCreate('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Invalid email format',
                },
              })}
            />
            {createErrors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createErrors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Initial Password
            </label>
            <input
              type="password"
              placeholder="8-16 chars, upper, lower, digit, symbol"
              className="input-field"
              {...regCreate('password', {
                required: 'Password is required',
                pattern: {
                  value: PASSWORD_REGEX,
                  message:
                    'Must be 8-16 chars with upper, lower, number, and special character',
                },
              })}
            />
            {createErrors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {createErrors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Assign Restaurant (Optional)
            </label>
            <select className="input-field" {...regCreate('restaurantId')}>
              <option value="">Leave Unassigned</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.location})
                  {r.owner ? ` — Current: ${r.owner.name}` : ' — Unassigned'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-stone-100 pt-4 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? 'Creating...' : 'Create Owner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Owner Modal */}
      <Modal
        isOpen={Boolean(editingOwner)}
        onClose={() => setEditingOwner(null)}
        title="Update Owner Details"
      >
        <form onSubmit={handleEditSubmit(onEditOwner)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              {...regEdit('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'At least 2 characters' },
              })}
            />
            {editErrors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editErrors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              {...regEdit('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Invalid email format',
                },
              })}
            />
            {editErrors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editErrors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">
              Assigned Restaurant
            </label>
            <select className="input-field" {...regEdit('restaurantId')}>
              <option value="">Unassigned</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.location})
                  {r.owner && r.owner._id !== editingOwner?._id
                    ? ` — Current: ${r.owner.name}`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 dark:border-stone-600 dark:bg-stone-800"
              {...regEdit('isActive')}
            />
            Account Active
          </label>

          <div className="flex justify-end gap-2.5 border-t border-stone-100 pt-4 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setEditingOwner(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={updating} className="btn-primary">
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}
