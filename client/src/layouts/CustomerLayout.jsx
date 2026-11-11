import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { AtithiLogo } from '../components/AtithiLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/formatters';

export function CustomerLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
      setMobileMenuOpen(false);
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800/80 dark:hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-surface-bg text-ink-primary transition-colors duration-200">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md dark:border-stone-800/90 dark:bg-stone-950/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center">
            <AtithiLogo
              size="md"
              subtitle="Verified Dining Reviews"
              hoverSubtitle="నిజమైన ఆహార సమీక్షలు"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1.5 md:flex">
            <NavLink to="/" end className={navLinkClass}>
              <Search size={15} />
              Discover
            </NavLink>

            {user?.role === 'CUSTOMER' && (
              <NavLink to="/my-reviews" className={navLinkClass}>
                <MessageSquareText size={15} />
                My Reviews
              </NavLink>
            )}

            {user?.role === 'RESTAURANT_OWNER' && (
              <NavLink to="/owner" className={navLinkClass}>
                <LayoutDashboard size={15} />
                Owner Dashboard
              </NavLink>
            )}

            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={navLinkClass}>
                <LayoutDashboard size={15} />
                Admin Dashboard
              </NavLink>
            )}
          </nav>

          {/* Desktop Auth Controls & Theme Toggle */}
          <div className="hidden items-center gap-2.5 md:flex">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/70 px-3 py-1.5 transition-colors hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold leading-tight text-stone-900 dark:text-stone-100">
                      {user.name}
                    </p>
                    <p className="text-[11px] leading-tight text-stone-500 dark:text-stone-400">
                      {ROLE_LABELS[user.role] || user.role}
                    </p>
                  </div>
                </Link>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 hover:text-red-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-red-400"
                >
                  <LogOut size={14} />
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary py-2">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary py-2">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-950 md:hidden"
            >
              <div className="space-y-1.5 px-4 py-4">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <Search size={16} />
                  Discover
                </NavLink>

                {user?.role === 'CUSTOMER' && (
                  <NavLink
                    to="/my-reviews"
                    onClick={() => setMobileMenuOpen(false)}
                    className={navLinkClass}
                  >
                    <MessageSquareText size={16} />
                    My Reviews
                  </NavLink>
                )}

                {user?.role === 'RESTAURANT_OWNER' && (
                  <NavLink
                    to="/owner"
                    onClick={() => setMobileMenuOpen(false)}
                    className={navLinkClass}
                  >
                    <LayoutDashboard size={16} />
                    Owner Dashboard
                  </NavLink>
                )}

                {user?.role === 'ADMIN' && (
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={navLinkClass}
                  >
                    <LayoutDashboard size={16} />
                    Admin Dashboard
                  </NavLink>
                )}

                {isAuthenticated ? (
                  <>
                    <NavLink
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={navLinkClass}
                    >
                      <User size={16} />
                      Profile ({user.name})
                    </NavLink>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-secondary justify-center"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary justify-center"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-stone-500 dark:text-stone-400 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <AtithiLogo size="sm" />
            <span className="text-stone-400 dark:text-stone-600">·</span>
            <span>Authentic dining reviews backed by real ratings.</span>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium text-stone-500 dark:text-stone-400">
            <Link to="/" className="hover:text-stone-900 dark:hover:text-white">
              Explore Restaurants
            </Link>
            {isAuthenticated ? (
              <Link to="/profile" className="hover:text-stone-900 dark:hover:text-white">
                My Account
              </Link>
            ) : (
              <Link to="/register" className="hover:text-stone-900 dark:hover:text-white">
                Join Community
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
