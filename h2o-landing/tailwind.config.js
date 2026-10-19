/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
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
        'h2o-creme':       '#F7F4EE',
        'h2o-blanc':       '#FFFDF8',
        'h2o-bordure':     '#E2DACB',
        primary:           '#D98A3A',
        'primary-dk':      '#B86F28',
        'primary-lt':      '#FDF0E0',
        success:           '#008A05',
        gold:              '#D98A3A',
        // Remap teal → palette lagune H2O (classes teal-* dans les JSX)
        teal: {
          950: '#0C3A3D',
          900: '#0C3A3D',
          800: '#14565A',
          700: '#1C6E70',
          600: '#1C6E70',
          500: '#7FB8B5',
          400: '#9FC3C0',
          200: '#C8E6E5',
          100: '#E8F4F3',
          50:  '#F0F8F7',
        },
        emerald: {
          600: '#14565A',
          500: '#1C6E70',
          400: '#7FB8B5',
        },
        amber: {
          700: '#B86F28',
          600: '#D98A3A',
          500: '#D98A3A',
          200: '#F5D9A8',
          100: '#FDF0E0',
          50:  '#FEF8EE',
        },
        cream: '#F7F4EE',
      },
      fontFamily: {
        sans:  ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
