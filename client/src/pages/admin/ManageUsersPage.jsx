import { useCallback, useEffect, useState } from 'react';
import { Eye, Search, ShieldCheck, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { PageTransition } from '../../components/PageTransition';
import { FilterSelect } from '../../components/FilterSelect';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { TableSkeleton } from '../../components/Skeletons';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import {
  ROLE_LABELS,
  extractErrorMessage,
  formatDate,
} from '../../utils/formatters';

export function ManageUsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.getUsers({
        search: debouncedSearch.trim(),
        role,
        status,
        page,
        limit: 10,
      });
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, role, status, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleStatus = async (targetUser) => {
    try {
      const nextStatus = !targetUser.isActive;
      await adminApi.updateUserStatus(targetUser._id, nextStatus);
      toast.success(
        `${targetUser.name} ${nextStatus ? 'activated' : 'deactivated'}`
      );
      loadUsers();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update account status'));
    }
  };

  const handleViewDetails = async (targetUser) => {
    setSelectedUser(targetUser);
    setDetailsLoading(true);
    try {
      const { data } = await adminApi.getUserDetails(targetUser._id);
      setSelectedUser(data.user);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not fetch user details'));
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(userToDelete._id);
      toast.success('User deleted successfully');
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete user'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Manage Users
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Search accounts, filter by role, inspect details, or manage access status.
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
            placeholder="Search users by name or email..."
            className="input-field pl-10"
          />
        </div>

        <div className="sm:col-span-3">
          <FilterSelect
            value={role}
            onChange={(val) => {
              setRole(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'CUSTOMER', label: 'Customer' },
              { value: 'RESTAURANT_OWNER', label: 'Restaurant Owner' },
              { value: 'ADMIN', label: 'Administrator' },
            ]}
          />
        </div>

        <div className="sm:col-span-3">
          <FilterSelect
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No matching users"
          description="Try clearing your search or role filters."
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-400">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {users.map((u) => {
                  const isSelf = currentUser?._id === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-stone-900 dark:text-stone-100">{u.name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{u.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500 dark:text-stone-400">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(u)}
                            title="View Details"
                            className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                          >
                            <Eye size={14} />
                          </button>

                          {!isSelf && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(u)}
                                title={u.isActive ? 'Deactivate' : 'Activate'}
                                className={`rounded-lg border p-2 ${
                                  u.isActive
                                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950'
                                }`}
                              >
                                {u.isActive ? (
                                  <UserX size={14} />
                                ) : (
                                  <UserCheck size={14} />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setUserToDelete(u)}
                                title="Delete User"
                                className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* User Details Modal */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="User Account Details"
      >
        {selectedUser && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-4 dark:bg-stone-800/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 font-bold text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                {selectedUser.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">{selectedUser.name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-stone-200/80 p-3 dark:border-stone-800">
                <p className="text-xs text-stone-400 dark:text-stone-500">Role</p>
                <p className="mt-0.5 font-semibold text-stone-900 dark:text-stone-100">
                  {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200/80 p-3 dark:border-stone-800">
                <p className="text-xs text-stone-400 dark:text-stone-500">Status</p>
                <p className="mt-0.5 font-semibold text-stone-900 dark:text-stone-100">
                  {selectedUser.isActive ? 'Active' : 'Deactivated'}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200/80 p-3 dark:border-stone-800">
                <p className="text-xs text-stone-400 dark:text-stone-500">Joined</p>
                <p className="mt-0.5 font-semibold text-stone-900 dark:text-stone-100">
                  {formatDate(selectedUser.createdAt)}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200/80 p-3 dark:border-stone-800">
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {selectedUser.role === 'RESTAURANT_OWNER'
                    ? 'Assigned Restaurant'
                    : 'Reviews Submitted'}
                </p>
                <p className="mt-0.5 font-semibold text-stone-900 dark:text-stone-100">
                  {detailsLoading
                    ? 'Loading...'
                    : selectedUser.role === 'RESTAURANT_OWNER'
                      ? selectedUser.assignedRestaurant?.name || 'None assigned'
                      : selectedUser.reviewCount ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <ShieldCheck size={14} />
              Password hashes are strictly excluded from all API payloads.
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account?"
        message={`Are you sure you want to delete "${userToDelete?.name}" (${userToDelete?.email})? Any reviews written by this user will also be removed.`}
        confirmText="Delete User"
        loading={deleting}
      />
    </PageTransition>
  );
}
