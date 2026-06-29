/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#edfdf6',
          100: '#d3f9e9',
          500: '#1D9E75',
          600: '#178a63',
          700: '#117050',
        },
      },
    },
  },
  plugins: [],
}
