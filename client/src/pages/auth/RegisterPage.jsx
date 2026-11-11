import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Circle, Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { AtithiLogo } from '../../components/AtithiLogo';
import { OtpVerificationCard } from '../../components/OtpVerificationCard';
import { PageTransition } from '../../components/PageTransition';
import {
  PASSWORD_REGEX,
  extractErrorMessage,
  getPasswordChecks,
} from '../../utils/formatters';

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');
  const checks = getPasswordChecks(passwordValue);

  const onSubmit = async (values) => {
    try {
      const response = await registerAccount(values);
      toast.success(
        response.message || 'Verification OTP sent! Please check your email.'
      );
      setPendingVerification({
        email: response.email || values.email,
        expiresInMinutes: response.expiresInMinutes || 10,
      });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Registration failed'));
    }
  };

  return (
    <PageTransition className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {pendingVerification ? (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <OtpVerificationCard
                email={pendingVerification.email}
                expiresInMinutes={pendingVerification.expiresInMinutes}
                onVerified={() => navigate('/', { replace: true })}
                onBack={() => setPendingVerification(null)}
                backLabel="Edit details"
              />
            </motion.div>
          ) : (
            <motion.div
              key="register-step"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="card-surface p-8"
            >
              <div className="mb-6 text-center">
                <div className="mb-4 flex justify-center">
                  <AtithiLogo
                    size="lg"
                    subtitle="Verified Dining Reviews"
                    hoverSubtitle="నిజమైన ఆహార సమీక్షలు"
                  />
                </div>
                <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                  Create your account
                </h1>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Discover trusted Hyderabad spots and share honest restaurant reviews.
                </p>
              </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
                Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Alex Morgan"
                className="input-field"
                {...register('name', {
                  required: 'Full name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                  maxLength: {
                    value: 80,
                    message: 'Name cannot exceed 80 characters',
                  },
                })}
              />
              {errors.name && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="alex@example.com"
                className="input-field"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="input-field pr-10"
                  {...register('password', {
                    required: 'Password is required',
                    pattern: {
                      value: PASSWORD_REGEX,
                      message:
                        'Password does not meet all complexity requirements below',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}

              <ul className="mt-2.5 space-y-1 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 dark:border-stone-800 dark:bg-stone-900/70">
                {checks.map((item) => (
                  <li
                    key={item.label}
                    className={`flex items-center gap-2 text-xs ${
                      item.passed
                        ? 'font-medium text-emerald-700 dark:text-emerald-400'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {item.passed ? (
                      <CheckCircle2 size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle size={13} className="shrink-0 text-stone-300 dark:text-stone-600" />
                    )}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="input-field pr-10"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) =>
                      val === passwordValue || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="btn-primary w-full py-3"
            >
              <UserPlus size={16} />
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </motion.button>
          </form>

              <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
