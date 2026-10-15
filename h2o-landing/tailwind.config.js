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
        primary:    '#E8513A',
        'primary-dk': '#C7391E',
        'primary-lt': '#F7E8E4',
        success:    '#008A05',
        gold:       '#D4A843',
        // Remapping teal → palette chaude H2O (évite de toucher les JSX existants)
        teal: {
          950: '#1A0A04',   // brun très foncé (ex header/nav/footer)
          900: '#3A1408',   // brun foncé (dégradé signature milieu)
          800: '#5C2010',   // brun moyen
          700: '#8B3520',   // brun chaud
          600: '#E8513A',   // PRIMARY (liens, badges, accents)
          500: '#EF7057',   // primary clair
          400: '#F49B8B',   // primary pâle (texte sur fond sombre)
        },
        orange: {
          500: '#E8513A',
          600: '#C7391E',
        },
        cream: '#F7F7F7',
        sand:  '#F7F7F7',
      },
      fontFamily: {
        sans:  ['var(--font-jakarta)', 'sans-serif'],
        serif: ['var(--font-jakarta)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
