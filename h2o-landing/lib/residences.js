// Données centralisées des résidences (à synchroniser avec Manager)
export const RESIDENCES = {
  deluxe: {
    id: 'deluxe',
    slug: 'deluxe',
    nom: 'Duplex Deluxe',
    prix: 150,
    description: 'Notre entrée de gamme offre le confort essentiel avec style.',
    capacite: '2-4 personnes',
    features: [
      'Piscine privée chauffée',
      'Pontoon aménagé',
      'Chambre principale luxe',
      'Cuisine équipée',
      'Salle de bain spa',
      'Terrasse vue lac',
      'WiFi haut débit',
      'Climatisation programmable',
    ],
    images: [
      '/images/gallery/IMG_2868.jpg',
      '/images/gallery/IMG_2869.jpg',
      '/images/gallery/IMG_2870.jpg',
      '/images/gallery/IMG_2873.jpg',
    ],
    amenities: ['🏊 Piscine privée', '⚓ Pontoon', '🍽 Restaurant', '💆 Spa', '🚗 Parking gratuit'],
  },
  jardin: {
    id: 'jardin',
    slug: 'jardin',
    nom: 'Duplex Jardin',
    prix: 200,
    description: 'Avec jardin privatif et vue panoramique sur la lagune.',
    capacite: '2-6 personnes',
    features: [
      'Piscine privée chauffée XL',
      'Pontoon premium',
      '2 chambres luxe',
      'Cuisine gastronomique',
      'Jardin tropical privé',
      'Terrasse panoramique',
      'Salle de bain principale spa',
      'Climatisation intelligente',
      'Sonorisation intégrée',
    ],
    images: [
      '/images/gallery/IMG_2875.jpg',
      '/images/gallery/IMG_2877.jpg',
      '/images/gallery/IMG_2879.jpg',
      '/images/gallery/IMG_2880.jpg',
    ],
    amenities: ['🏊 Piscine XL', '⚓ Pontoon Premium', '🎪 Pergola events', '💪 Gym', '🍽 Restaurant'],
  },
  presidential: {
    id: 'presidential',
    slug: 'presidential',
    nom: 'Duplex Presidential',
    prix: 350,
    description: 'L\'apothéose du luxe avec tous les services premium.',
    capacite: '2-8 personnes',
    features: [
      'Piscine privée chauffée 3 niveaux',
      'Pontoon VIP avec jacuzzi',
      '3 chambres suites luxe',
      'Cuisine professionnelle',
      'Jardin tropical aménagé',
      ' Terrasse panoramique 360°',
      'Home cinema',
      'Salle de spa privée',
      'Ascenseur privatif',
      'Système domotique complet',
      'Sommelier sur demande',
    ],
    images: [
      '/images/gallery/IMG_2881.jpg',
      '/images/gallery/IMG_2884.jpg',
      '/images/gallery/IMG_2885.jpg',
      '/images/gallery/IMG_2887.jpg',
    ],
    amenities: ['🏊 Piscine 3 niveaux', '⚓ Pontoon VIP', '🎪 Pergola VIP', '💆 Spa privé', '🎬 Cinéma'],
  },
}

export function getResidenceBySlug(slug) {
  return RESIDENCES[slug] || null
}

export function getAllResidences() {
  return Object.values(RESIDENCES)
}
