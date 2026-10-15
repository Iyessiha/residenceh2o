import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://residencesh2o.com'),
  title: {
    default: 'Les Résidences H₂O — Duplexes avec piscine privée à Modeste Beach',
    template: '%s | Les Résidences H₂O',
  },
  description: 'Duplexes meublés avec piscine privée, pontoon et vue lagune à Modeste Beach, route de Grand-Bassam — à 30 min d\'Abidjan. Séjour, événement, mariage en bord de lac.',
  keywords: [
    'hôtel Modeste Beach', 'resort Grand-Bassam', 'duplex piscine Côte d\'Ivoire',
    'résidence meublée Bassam', 'villa piscine privée Abidjan', 'location vacances lagune',
    'salle mariage Grand-Bassam', 'séjour luxe Abidjan', 'duplex pontoon',
  ],
  authors: [{ name: 'Les Résidences H2O' }],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: 'Les Résidences H₂O — Duplexes avec piscine privée à Modeste Beach',
    description: 'Séjours d\'exception en bord de lagune. Chaque duplex a sa propre piscine privée, pontoon et vue sur le lac.',
    url: 'https://residencesh2o.com',
    siteName: 'Les Résidences H₂O',
    locale: 'fr_CI',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Les Résidences H₂O — Piscine privée et vue lagune' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Les Résidences H₂O — Duplexes avec piscine privée',
    description: 'Séjours d\'exception à Modeste Beach. Piscine privée, pontoon, vue lagune.',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: 'https://residencesh2o.com' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LodgingBusiness',
      '@id': 'https://residencesh2o.com/#lodging',
      name: 'Les Résidences H₂O',
      description: 'Duplexes meublés avec piscine privée, pontoon et vue lagune à Modeste Beach. Restaurant, pergola événementielle, parking gratuit.',
      url: 'https://residencesh2o.com',
      telephone: '+22507XXXXXXXX',
      email: 'contact@residencesh2o.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Route de Grand-Bassam, Modeste Beach',
        addressLocality: 'Grand-Bassam',
        addressCountry: 'CI',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 5.20, longitude: -3.73 },
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: 'Piscine privée par duplex', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Pontoon vue lagune', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Restaurant sur place', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi haut débit', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Parking gratuit', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Pergola événementielle', value: true },
      ],
      priceRange: '120 000 – 220 000 FCFA / nuit',
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', reviewCount: '1' },
    },
    {
      '@type': 'Restaurant',
      '@id': 'https://residencesh2o.com/#restaurant',
      name: 'Restaurant des Résidences H₂O',
      servesCuisine: 'Cuisine africaine et internationale',
      address: { '@type': 'PostalAddress', streetAddress: 'Route de Grand-Bassam, Modeste Beach', addressLocality: 'Grand-Bassam', addressCountry: 'CI' },
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className={jakarta.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
