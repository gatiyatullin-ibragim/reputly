/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F8FAFC',
        card: '#FFFFFF',
        dark: '#0F172A',
        muted: '#f3f4f6',
        border: '#E7EBF2',
        borderStrong: '#DDE3EE',
        textPrimary: '#0F172A',
        textSecondary: '#6b7280',
        textMuted: '#9ca3af',
        red: '#ef4444',
        green: '#10B981',
        amber: '#f59e0b',
        brand: {
          50:  '#EEF0FF',
          100: '#DADDFE',
          500: '#5B5FEF',
          600: '#4F53E6',
          700: '#4145CC',
        },
      },
      boxShadow: {
        none: 'none',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
