/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          950: '#431407',
        },
        surface: {
          bg: 'var(--surface-bg)',
          card: 'var(--surface-card)',
          muted: 'var(--surface-muted)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(28, 25, 23, 0.05), 0 6px 20px rgba(28, 25, 23, 0.04)',
        'card-hover': '0 4px 12px rgba(28, 25, 23, 0.08), 0 12px 28px rgba(28, 25, 23, 0.06)',
      },
    },
  },
  plugins: [],
};
