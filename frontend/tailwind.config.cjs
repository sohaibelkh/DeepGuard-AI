/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#a5c422',
          muted: '#8aaa10',
          subtle: '#f0f7d4'
        },
        surface: {
          DEFAULT: '#0b1120',
          foreground: '#f9fafb',
          muted: '#111827',
          border: '#1f2937'
        }
      },
      boxShadow: {
        subtle: '0 10px 30px rgba(15, 23, 42, 0.35)'
      },
      borderRadius: {
        xl: '0.9rem'
      }
    }
  },
  plugins: []
};

