import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ showLabel = false, className = '' }) {
  const { isDark, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200/90 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-stone-700/80 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-white ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={prefersReducedMotion ? false : { rotate: -45, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { rotate: 45, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.16 }}
            className="flex items-center text-amber-400"
          >
            <Sun size={15} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={prefersReducedMotion ? false : { rotate: 45, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { rotate: -45, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.16 }}
            className="flex items-center text-stone-600"
          >
            <Moon size={15} />
          </motion.span>
        )}
      </AnimatePresence>
      {showLabel && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
    </motion.button>
  );
}
