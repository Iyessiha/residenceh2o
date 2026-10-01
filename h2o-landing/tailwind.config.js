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
        teal: {
          950: '#0a2929',
          900: '#0d3535',
          800: '#0f4040',
          700: '#125555',
          600: '#147070',
          500: '#1a8f8f',
        },
        cream: '#f5f0e8',
        sand: '#ede8df',
        orange: {
          500: '#e07b39',
          600: '#c96928',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
}
