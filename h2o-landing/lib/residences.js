// Source unique des duplexes : la landing, la page Résidences, le widget de réservation
// et le formulaire de contact lisent tous ce fichier. Ne pas dupliquer ces valeurs ailleurs.
export const DUPLEXES = [
  {
    id: 'D-1',
    slug: 'lac',
    nom: 'Duplex Lac',
    tagline: 'Vue panoramique sur la lagune & pontoon privé',
    prix: 120000,
    capacite: '2–4 personnes',
    surface: '80 m²',
    badge: 'Vue Lagune',
    badgeClass: 'bg-teal-500/90 text-white',
    features: [
      'Piscine privée 20m²',
      'Pontoon privé',
      'Chambre king size',
      'Cuisine équipée',
      'Terrasse vue lagune',
    ],
    images: [
      '/images/gallery/IMG_2869.jpg',
      '/images/gallery/IMG_2868.jpg',
      '/images/gallery/IMG_2870.jpg',
    ],
  },
  {
    id: 'D-2',
    slug: 'jardin',
    nom: 'Duplex Jardin',
    tagline: 'Intimité, verdure et sérénité tropicale',
    prix: 150000,
    capacite: '4–6 personnes',
    surface: '100 m²',
    badge: 'Idéal Famille',
    badgeClass: 'bg-emerald-600/90 text-white',
    features: [
      'Piscine privée 15m²',
      'Jardin privatif paysager',
      '2 chambres avec dressing',
      'Cuisine & bar équipés',
      'Salon lounge',
    ],
    images: [
      '/images/gallery/IMG_2873.jpg',
      '/images/gallery/IMG_2877.jpg',
    ],
  },
  {
    id: 'D-3',
    slug: 'signature',
    nom: 'Duplex Signature',
    tagline: 'Le summum du luxe privé avec jacuzzi et rooftop',
    prix: 220000,
    capacite: '6–8 personnes',
    surface: '140 m²',
    badge: 'Prestige VIP',
    badgeClass: 'bg-amber-500/95 text-slate-900 font-bold',
    features: [
      'Grande piscine privée 30m²',
      'Pontoon & jacuzzi chauffé',
      '3 suites parentales',
      'Espace BBQ & rooftop',
      'Vue lagune 360°',
    ],
    images: [
      '/images/gallery/IMG_2875.jpg',
      '/images/gallery/IMG_2879.jpg',
      '/images/gallery/IMG_2880.jpg',
      '/images/gallery/IMG_2881.jpg',
    ],
  },
]

// 120000 -> "120 000 FCFA" (espace simple, identique côté serveur et client)
export function formatFCFA(montant) {
  return `${String(montant).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}

export const PRIX_MINIMUM = Math.min(...DUPLEXES.map((d) => d.prix))

export function getResidenceBySlug(slug) {
  return DUPLEXES.find((d) => d.slug === slug) || null
}

export function getAllResidences() {
  return DUPLEXES
}
