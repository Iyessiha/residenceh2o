// Fonctions sans dépendance serveur, utilisables côté client (widget, formulaire).
// Les données réelles viennent de Supabase (voir lib/data.js). DUPLEX_FALLBACK ne sert
// qu'à afficher le site si Supabase n'est pas joignable : il reprend les valeurs du manager.
export const DUPLEX_FALLBACK = [
  {
    code: 'D-1',
    nom: 'Duplex Lac',
    capacite: 4,
    chambres: 5,
    surface_m2: 80,
    tarif_nuit: 350000,
    tagline: 'Vue panoramique sur la lagune & pontoon privé',
    badge: 'Vue Lagune',
    features: ['Piscine privée 20m²', 'Pontoon privé', 'Chambre king size', 'Cuisine équipée', 'Terrasse vue lagune'],
    images: ['/images/gallery/IMG_2869.jpg', '/images/gallery/IMG_2868.jpg', '/images/gallery/IMG_2870.jpg'],
  },
  {
    code: 'D-2',
    nom: 'Duplex Jardin',
    capacite: 6,
    chambres: 5,
    surface_m2: 100,
    tarif_nuit: 350000,
    tagline: 'Intimité, verdure et sérénité tropicale',
    badge: 'Idéal Famille',
    features: ['Piscine privée 15m²', 'Jardin privatif paysager', '2 chambres avec dressing', 'Cuisine & bar équipés', 'Salon lounge'],
    images: ['/images/gallery/IMG_2873.jpg', '/images/gallery/IMG_2877.jpg'],
  },
  {
    code: 'D-3',
    nom: 'Duplex Signature',
    capacite: 8,
    chambres: 5,
    surface_m2: 140,
    tarif_nuit: 350000,
    tagline: 'Le summum du luxe privé avec jacuzzi et rooftop',
    badge: 'Prestige VIP',
    features: ['Grande piscine privée 30m²', 'Pontoon & jacuzzi chauffé', '3 suites parentales', 'Espace BBQ & rooftop', 'Vue lagune 360°'],
    images: ['/images/gallery/IMG_2875.jpg', '/images/gallery/IMG_2879.jpg', '/images/gallery/IMG_2880.jpg', '/images/gallery/IMG_2881.jpg'],
  },
]

// Chambres louables séparément (données de secours si Supabase indisponible)
export const CHAMBRES_FALLBACK = [
  {
    nom: 'Chambre Standard Lac',
    duplex_nom: 'Duplex Lac',
    type: 'standard',
    tarif_nuit: 60000,
    capacite: 2,
    statut: 'disponible',
    description: 'Chambre confortable avec lit king size, climatisation et accès piscine partagée.',
    features: ['Lit king size', 'Climatisation', 'Salle de bain privée', 'Accès piscine'],
  },
  {
    nom: 'Chambre Standard Jardin',
    duplex_nom: 'Duplex Jardin',
    type: 'standard',
    tarif_nuit: 60000,
    capacite: 2,
    statut: 'disponible',
    description: 'Chambre lumineuse donnant sur le jardin tropical, idéale pour un séjour reposant.',
    features: ['Vue jardin', 'Literie premium', 'Climatisation', 'Salle de bain privée'],
  },
  {
    nom: 'Suite VIP Signature',
    duplex_nom: 'Duplex Signature',
    type: 'vip',
    tarif_nuit: 120000,
    capacite: 2,
    statut: 'disponible',
    description: 'Suite parentale de prestige avec jacuzzi, vue lagune et service personnalisé.',
    features: ['Jacuzzi privatif', 'Vue lagune 360°', 'Dressing', 'Room service', 'Balcon terrasse'],
  },
]

export const BADGE_CLASSES = {
  'Vue Lagune': 'bg-teal-500/90 text-white',
  'Idéal Famille': 'bg-emerald-600/90 text-white',
  'Prestige VIP': 'bg-amber-500/95 text-slate-900 font-bold',
}

// 350000 -> "350 000 FCFA" (espace simple, identique côté serveur et client)
export function formatFCFA(montant) {
  return `${String(montant).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}

// "Duplex Lac" -> "duplex-lac"
export function slugify(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
