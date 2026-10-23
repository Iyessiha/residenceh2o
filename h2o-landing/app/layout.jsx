import './globals.css'
import InstallPWA from '@/components/InstallPWA'
import TagManager from '@/components/TagManager'
import { getBalises } from '@/lib/data'

export const revalidate = 300

export const metadata = {
  metadataBase: new URL('https://residencesh2o.com'),
  title: {
    default: 'Les Résidences H₂O — Villas avec piscine privée à Villa Poton',
    template: '%s | Les Résidences H₂O',
  },
  description: "Villas duplex entières avec piscine privée, pontoon, jardin et toit-terrasse, et chambres à la nuit à Villa Poton, ancienne route de Bassam, au lac — 10 min de la plage, 30 min de l'aéroport et d'Abidjan. Séjour, restaurant, événement.",
  keywords: [
    'villa Poton', 'villa piscine privée Côte d\'Ivoire', 'duplex piscine privée', 'duplex pontoon',
    'location villa lac Abidjan', 'chambre à louer à la nuit', 'chambre VVIP',
    'espace événementiel au bord du lac', 'restaurant au bord du lac', 'location vacances lagune',
  ],
  authors: [{ name: 'Les Résidences H2O' }],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: 'Les Résidences H₂O — Villas avec piscine privée à Villa Poton',
    description: 'Séjours d\'exception au bord du lac. Chaque villa a sa propre piscine privée, son pontoon, son jardin et son toit-terrasse.',
    url: 'https://residencesh2o.com',
    siteName: 'Les Résidences H₂O',
    locale: 'fr_CI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Les Résidences H₂O — Duplexes avec piscine privée',
    description: 'Séjours d\'exception à Villa Poton. Piscine privée, pontoon, jardin, toit-terrasse.',
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
      description: 'Villas duplex entières avec piscine privée et pontoon à Villa Poton, et chambres à la nuit. Restaurant, espace événementiel jusqu’à 200 invités, parking gratuit, sécurité, Wi-Fi 5G.',
      url: 'https://residencesh2o.com',
      telephone: '+2250749194952',
      email: 'contact@residencesh2o.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Ancienne route de Bassam, Villa Poton, au lac',
        addressCountry: 'CI',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 5.20, longitude: -3.73 },
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: 'Piscine privée par villa', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Pontoon', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Parking gratuit', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Climatisation', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Restaurant sur place', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi 5G', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Parking 2 voitures par villa', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Espace événementiel', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Caméras de surveillance', value: true },
      ],
      priceRange: '350 000 FCFA / nuit',
    },
    {
      '@type': 'Restaurant',
      '@id': 'https://residencesh2o.com/#restaurant',
      name: 'Restaurant des Résidences H₂O',
      servesCuisine: 'Cuisine africaine',
      address: { '@type': 'PostalAddress', streetAddress: 'Ancienne route de Bassam, Villa Poton, au lac', addressCountry: 'CI' },
    },
  ],
}

export default async function RootLayout({ children }) {
  const balises = await getBalises()

  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="H₂O" />
      </head>
      <body className="font-sans antialiased selection:bg-teal-500 selection:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <TagManager balises={balises} />
        {children}
        <InstallPWA />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
          }
        ` }} />
      </body>
    </html>
  )
}
