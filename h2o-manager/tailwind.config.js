/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#0d2e2e',
        'sidebar-hover': '#163d3d',
        primary: '#14b8a6',
        accent: '#e07b39',
      },
    },
  },
  plugins: [],
}
