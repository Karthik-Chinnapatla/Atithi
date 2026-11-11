import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { AtithiLogo } from '../../components/AtithiLogo';
import { PageTransition } from '../../components/PageTransition';
import {
  extractErrorMessage,
  getDefaultRouteForRole,
} from '../../utils/formatters';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const loggedInUser = await login(values);
      toast.success(`Welcome back, ${loggedInUser.name}!`);

      const defaultRoute = getDefaultRouteForRole(loggedInUser.role);
      const fromPath = location.state?.from?.pathname;

      if (loggedInUser.role === 'CUSTOMER' && fromPath && !fromPath.startsWith('/admin') && !fromPath.startsWith('/owner')) {
        navigate(fromPath, { replace: true });
      } else {
        navigate(defaultRoute, { replace: true });
      }
    } catch (error) {
      const respData = error?.response?.data;
      if (error?.response?.status === 403 && respData?.requiresVerification) {
        toast.info(
          extractErrorMessage(error, 'Please verify your email OTP before signing in')
        );
        navigate('/verify-otp', {
          state: { email: respData.email || values.email },
        });
        return;
      }
      toast.error(extractErrorMessage(error, 'Unable to sign in'));
    }
  };

  return (
    <PageTransition className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-surface p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <AtithiLogo
                size="lg"
                subtitle="Verified Dining Reviews"
                hoverSubtitle="నిజమైన ఆహార సమీక్షలు"
              />
            </div>
            <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Sign in to manage reviews, restaurants, or your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="input-field pr-10"
                  {...register('password', {
                    required: 'Password is required',
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
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="btn-primary w-full py-3"
            >
              <LogIn size={16} />
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            New to Atithi?{' '}
            <Link
              to="/register"
              className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Create a customer account
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
