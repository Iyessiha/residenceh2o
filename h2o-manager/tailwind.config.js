/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        sidebar:        '#1A0A04',
        'sidebar-act':  '#3A1408',
        primary:        '#E8513A',
        'primary-dk':   '#C7391E',
        'primary-lt':   '#F7E8E4',
        success:        '#008A05',
        gold:           '#D4A843',
        // teal réutilisé dans le code existant → remappe vers palette H2O
        teal: {
          900: '#3A1408',
          800: '#5C2010',
          700: '#8B3520',
          600: '#E8513A',
          500: '#EF7057',
          400: '#F49B8B',
        },
      },
      fontFamily: {
        sans:  ['var(--font-jakarta)', 'sans-serif'],
        serif: ['var(--font-jakarta)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
