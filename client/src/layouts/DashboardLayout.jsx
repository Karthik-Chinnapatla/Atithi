import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { AtithiLogo } from '../components/AtithiLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/formatters';

export function DashboardLayout({ portalTitle, navItems = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const renderSidebarContent = (onItemClick = null) => (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-6 flex items-center justify-between px-2 pt-1">
          <Link to="/" onClick={onItemClick} className="inline-flex items-center">
            <AtithiLogo
              size="md"
              subtitle={portalTitle}
              subtitleClassName="font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400"
            />
          </Link>

          {onItemClick && (
            <button
              type="button"
              onClick={onItemClick}
              aria-label="Close sidebar"
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 font-semibold text-brand-700 shadow-sm shadow-brand-500/5 dark:bg-brand-950/60 dark:text-brand-400'
                      : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800/80 dark:hover:text-white'
                  }`
                }
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2 border-t border-stone-200/80 pt-4 dark:border-stone-800">
        <div className="rounded-xl bg-stone-50 px-3.5 py-2.5 dark:bg-stone-900">
          <p className="truncate text-xs font-semibold text-stone-900 dark:text-stone-100">
            {user?.name}
          </p>
          <p className="truncate text-[11px] text-stone-500 dark:text-stone-400">
            {ROLE_LABELS[user?.role] || user?.role}
          </p>
        </div>

        <ThemeToggle showLabel className="w-full justify-start" />

        <Link
          to="/"
          onClick={onItemClick}
          className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
        >
          <ArrowLeft size={14} />
          Public Discovery
        </Link>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <LogOut size={16} />
          Logout
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface-bg text-ink-primary transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-950 lg:sticky lg:top-0 lg:block lg:h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] dark:bg-black/60"
            />
            <motion.aside
              initial={{ x: -272 }}
              animate={{ x: 0 }}
              exit={{ x: -272 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 h-full w-64 bg-white shadow-2xl dark:bg-stone-950"
            >
              {renderSidebarContent(() => setSidebarOpen(false))}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/90 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-xl border border-stone-200 p-2 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <Menu size={18} />
          </button>
          <AtithiLogo size="sm" showIcon={false} inlineSuffix={portalTitle} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-400">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
