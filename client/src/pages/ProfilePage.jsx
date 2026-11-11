import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Calendar, KeyRound, Mail, Save, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/PageTransition';
import {
  PASSWORD_REGEX,
  ROLE_LABELS,
  extractErrorMessage,
  formatDate,
  getPasswordChecks,
} from '../utils/formatters';

export function ProfilePage() {
  const { user, updateUserState } = useAuth();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword');
  const checks = getPasswordChecks(newPasswordValue);

  const onProfileSave = async (values) => {
    try {
      const { data } = await authApi.updateProfile({ name: values.name });
      updateUserState(data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update profile'));
    }
  };

  const onPasswordSave = async (values) => {
    try {
      await authApi.changePassword(values);
      toast.success('Password changed successfully');
      resetPasswordForm();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update password'));
    }
  };

  return (
    <PageTransition className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Account Profile
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Manage your personal details and account security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Account Overview Card */}
        <div className="card-surface p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-400">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h2 className="mt-3 text-lg font-bold text-stone-900 dark:text-stone-100">
              {user?.name}
            </h2>
            <span className="mt-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>

          <div className="mt-6 space-y-3 border-t border-stone-100 pt-5 text-sm dark:border-stone-800">
            <div className="flex items-center gap-2.5 text-stone-600 dark:text-stone-300">
              <Mail size={15} className="shrink-0 text-stone-400 dark:text-stone-500" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-stone-600 dark:text-stone-300">
              <ShieldCheck size={15} className="shrink-0 text-emerald-500" />
              <span>Status: {user?.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-stone-600 dark:text-stone-300">
              <Calendar size={15} className="shrink-0 text-stone-400 dark:text-stone-500" />
              <span>Joined {formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="space-y-6 lg:col-span-2">
          <form
            onSubmit={handleProfileSubmit(onProfileSave)}
            className="card-surface p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <User size={18} className="text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Personal Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-400">
                  Full Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  {...registerProfile('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                />
                {profileErrors.name && (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                    {profileErrors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-400">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                disabled={profileSubmitting}
                className="btn-primary"
              >
                <Save size={15} />
                {profileSubmitting ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </form>

          <form
            onSubmit={handlePasswordSubmit(onPasswordSave)}
            className="card-surface p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <KeyRound size={18} className="text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Change Password
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-400">
                  Current Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required',
                  })}
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      pattern: {
                        value: PASSWORD_REGEX,
                        message: 'Password does not meet requirements',
                      },
                    })}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    {...registerPassword('confirmNewPassword', {
                      required: 'Please confirm your new password',
                      validate: (val) =>
                        val === newPasswordValue || 'New passwords do not match',
                    })}
                  />
                  {passwordErrors.confirmNewPassword && (
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                      {passwordErrors.confirmNewPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 rounded-xl bg-stone-50 p-3 dark:bg-stone-800/60">
                {checks.map((c) => (
                  <span
                    key={c.label}
                    className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                      c.passed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'border border-stone-200 bg-white text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400'
                    }`}
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                disabled={passwordSubmitting}
                className="btn-secondary"
              >
                {passwordSubmitting ? 'Updating...' : 'Update Password'}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
