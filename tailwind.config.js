/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4030ee',
          600: '#3422da',
          700: '#2b1abf',
          800: '#24169c',
          900: '#1f137e',
          950: '#0e0844',
        },
        sonda: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0066cc',
          600: '#004c99',
          700: '#003366',
          800: '#002244',
          900: '#001428',
        }
      }
    },
  },
  plugins: [],
}
