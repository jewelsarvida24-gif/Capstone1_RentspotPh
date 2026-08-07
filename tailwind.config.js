/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf4f4',
          100: '#fbe8e8',
          200: '#f5c5c5',
          300: '#ed9292',
          400: '#e06060',
          500: '#c0392b', // primary red (RentSpotPH brand)
          600: '#a93226',
          700: '#8b2020',
          800: '#6e1a1a',
          900: '#561414',
        },
        neutral: {
          50: '#f9f9f9',
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#c0c0c0',
          400: '#909090',
          500: '#606060',
          600: '#404040',
          700: '#303030',
          800: '#202020',
          900: '#101010',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};