import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

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
    <html lang="fr" className={jakarta.variable}>
      <body className={jakarta.className}>{children}</body>
    </html>
  )
}
