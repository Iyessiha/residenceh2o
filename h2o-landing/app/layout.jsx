import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata = {
  title: 'Les Résidences H2O — Duplexes avec piscine privée à Modeste Beach',
  description: 'Duplexes meublés avec piscine privée, pontoon et vue lac à Modeste Beach, à 30 min d\'Abidjan. Réservez votre séjour d\'exception sur la Route de Grand-Bassam.',
  keywords: 'hôtel Modeste Beach, resort Grand-Bassam, duplex piscine Côte d\'Ivoire, résidence meublée Bassam, séjour Abidjan, location villa piscine privée',
  openGraph: {
    title: 'Les Résidences H2O — Duplexes avec piscine privée',
    description: 'Séjours d\'exception à Modeste Beach. Duplexes avec piscine privée, pontoon et vue lac.',
    url: 'https://residencesh2o.com',
    siteName: 'Les Résidences H2O',
    locale: 'fr_CI',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
