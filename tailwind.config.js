/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
