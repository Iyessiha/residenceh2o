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
        // Palette officielle Les Résidences H2O
        'h2o-teal':        '#0C3A3D',
        'h2o-lagune':      '#1C6E70',
        'h2o-lagune-clair':'#7FB8B5',
        'h2o-or':          '#D98A3A',
        'h2o-or-fonce':    '#B86F28',
        'h2o-bois':        '#8A6B46',
        sidebar:           '#0C3A3D',
        'sidebar-act':     '#14565A',
        primary:           '#D98A3A',
        'primary-dk':      '#B86F28',
        'primary-lt':      '#FDF0E0',
        success:           '#008A05',
        gold:              '#D98A3A',
        teal: {
          900: '#0C3A3D',
          800: '#14565A',
          700: '#1C6E70',
          600: '#1C6E70',
          500: '#7FB8B5',
          400: '#9FC3C0',
          100: '#E8F4F3',
          50:  '#F0F8F7',
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
