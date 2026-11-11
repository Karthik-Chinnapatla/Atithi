import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';

const SIZE_STYLES = {
  sm: {
    wrapper: 'gap-2',
    iconBox: 'h-7 w-7 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400',
    iconSize: 14,
    word: 'text-base',
    subtitle: 'text-[10px]',
  },
  md: {
    wrapper: 'gap-2.5',
    iconBox: 'h-9 w-9 rounded-xl bg-brand-600 text-white shadow-sm',
    iconSize: 18,
    word: 'text-lg',
    subtitle: 'text-[11px]',
  },
  lg: {
    wrapper: 'gap-3',
    iconBox: 'h-12 w-12 rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/20',
    iconSize: 22,
    word: 'text-2xl',
    subtitle: 'text-xs',
  },
};

export function AtithiLogo({
  size = 'md',
  subtitle = null,
  hoverSubtitle = null,
  subtitleClassName = '',
  inlineSuffix = null,
  showIcon = true,
  className = '',
}) {
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const styles = SIZE_STYLES[size] || SIZE_STYLES.md;

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      title="Atithi · అతిథి"
      aria-label={inlineSuffix ? `Atithi · ${inlineSuffix}` : 'Atithi (అతిథి)'}
      className={`group inline-flex cursor-pointer items-center select-none ${styles.wrapper} ${className}`}
    >
      {showIcon && (
        <span
          className={`flex shrink-0 items-center justify-center ${styles.iconBox}`}
          aria-hidden="true"
        >
          <UtensilsCrossed size={styles.iconSize} />
        </span>
      )}

      <span className="flex flex-col leading-tight">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-grid items-center justify-items-start overflow-hidden">
            <motion.span
              initial={false}
              animate={{
                opacity: hovered ? 0 : 1,
                y: hovered ? -10 : 0,
              }}
              transition={transition}
              className={`col-start-1 row-start-1 font-display font-extrabold tracking-tight text-stone-900 dark:text-stone-50 ${styles.word}`}
            >
              Atithi
            </motion.span>

            <motion.span
              initial={false}
              animate={{
                opacity: hovered ? 1 : 0,
                y: hovered ? 0 : 10,
              }}
              transition={transition}
              style={{ fontFamily: "'Noto Sans Telugu', 'Plus Jakarta Sans', sans-serif" }}
              className={`col-start-1 row-start-1 font-bold tracking-normal text-brand-600 dark:text-brand-400 ${styles.word}`}
              aria-hidden={!hovered}
            >
              అతిథి
            </motion.span>
          </span>

          {inlineSuffix && (
            <span className={`font-display font-bold text-stone-500 dark:text-stone-400 ${styles.word}`}>
              · {inlineSuffix}
            </span>
          )}
        </span>

        {subtitle && (
          hoverSubtitle ? (
            <span className="inline-grid items-center justify-items-start overflow-hidden">
              <motion.span
                initial={false}
                animate={{
                  opacity: hovered ? 0 : 1,
                  y: hovered ? -6 : 0,
                }}
                transition={transition}
                className={`col-start-1 row-start-1 whitespace-nowrap font-medium ${styles.subtitle} ${
                  subtitleClassName || 'text-stone-400 dark:text-stone-400'
                }`}
              >
                {subtitle}
              </motion.span>

              <motion.span
                initial={false}
                animate={{
                  opacity: hovered ? 1 : 0,
                  y: hovered ? 0 : 6,
                }}
                transition={transition}
                style={{ fontFamily: "'Noto Sans Telugu', 'Inter', sans-serif" }}
                className={`col-start-1 row-start-1 whitespace-nowrap font-semibold text-brand-600 dark:text-brand-400 ${styles.subtitle}`}
                aria-hidden={!hovered}
              >
                {hoverSubtitle}
              </motion.span>
            </span>
          ) : (
            <span
              className={`font-medium ${styles.subtitle} ${
                subtitleClassName || 'text-stone-400 dark:text-stone-400'
              }`}
            >
              {subtitle}
            </span>
          )
        )}
      </span>
    </span>
  );
}
