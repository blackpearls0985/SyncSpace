/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#FF5A5F',
          hover: '#E04347',
          light: '#FFF1F1',
          border: '#FFCDCE',
        },
        brand: {
          50:  '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c8',
          300: '#ffa3a5',
          400: '#ff7579',
          500: '#FF5A5F', // Primary Coral Accent
          600: '#e04347',
          700: '#bc3135',
          800: '#9b2c2f',
          900: '#802a2c',
          950: '#461113',
        },
      },
    },
  },
  plugins: [],
}
