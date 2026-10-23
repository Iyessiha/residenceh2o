// Fonctions sans dépendance serveur, utilisables côté client (widget, formulaire).
// Les données réelles viennent de Supabase (voir lib/data.js). Les constantes FALLBACK
// ne servent qu'à afficher le site si Supabase n'est pas joignable : elles reprennent
// la fiche officielle « Les Résidences H₂O » (Villa 1, Villa 2, chambres et tarifs).

// Équipements communs aux deux villas (fiche : « Chaque villa dispose de… »)
const VILLA_FEATURES = [
  'Piscine privée',
  'Jardin',
  'Terrasse',
  'Toit-terrasse',
  'Parking 2 voitures',
  'Cuisine équipée',
  'Buanderie externe',
  'Service repassage',
  '2 toilettes visiteurs',
]

export const DUPLEX_FALLBACK = [
  {
    code: 'D-1',
    nom: 'Villa 1',
    capacite: 10,
    chambres: 5,
    surface_m2: null,
    tarif_nuit: 350000,
    tarif_journee: 250000,
    tagline: 'Duplex complet avec piscine privée, jardin et toit-terrasse',
    badge: 'Duplex complet',
    features: VILLA_FEATURES,
    images: ['/images/gallery/IMG_2869.jpg', '/images/gallery/IMG_2868.jpg', '/images/gallery/IMG_2870.jpg'],
  },
  {
    code: 'D-2',
    nom: 'Villa 2',
    capacite: 10,
    chambres: 5,
    surface_m2: null,
    tarif_nuit: 350000,
    tarif_journee: 250000,
    tagline: 'Duplex complet avec piscine privée, jardin et toit-terrasse',
    badge: 'Duplex complet',
    features: VILLA_FEATURES,
    images: ['/images/gallery/IMG_2873.jpg', '/images/gallery/IMG_2877.jpg'],
  },
]

// Équipements standard de chaque chambre (fiche : « Équipements standard de chaque chambre »)
export const EQUIPEMENTS_CHAMBRE = ["TV", "Salle d'eau", 'Table de bureau', 'Armoire']

// Composition d'une villa : 5 chambres, dont 4 autonomes et 1 non autonome.
// Chaque chambre accueille 2 personnes maximum.
export const CHAMBRES_PAR_VILLA = [
  { nom: 'Chambre VVIP', type: 'vvip', tarif_nuit: 90000, tarif_journee: 70000, lit: 'Lit 3 places' },
  { nom: 'Chambre VIP', type: 'vip', tarif_nuit: 80000, tarif_journee: 60000, lit: 'Lit 3 places' },
  { nom: 'Chambre Standard 1', type: 'standard', tarif_nuit: 70000, tarif_journee: 50000, lit: 'Lit 2 places' },
  { nom: 'Chambre Standard 2', type: 'standard', tarif_nuit: 70000, tarif_journee: 50000, lit: 'Lit 2 places' },
  { nom: 'Chambre non autonome', type: 'non_autonome', tarif_nuit: 40000, tarif_journee: 20000, lit: 'Lit 2 places' },
]

// Chambres louables séparément (données de secours si Supabase indisponible)
export const CHAMBRES_FALLBACK = DUPLEX_FALLBACK.flatMap((duplex) =>
  CHAMBRES_PAR_VILLA.map((c) => ({
    nom: `${c.nom} · ${duplex.nom}`,
    duplex_nom: duplex.nom,
    type: c.type,
    tarif_nuit: c.tarif_nuit,
    tarif_journee: c.tarif_journee,
    capacite: 2,
    statut: 'disponible',
    description: `${c.lit}, 2 personnes maximum. Petit déjeuner inclus pour la formule nuit.`,
    features: [c.lit, ...EQUIPEMENTS_CHAMBRE],
  }))
)

export const BADGE_CLASSES = {
  'Duplex complet': 'bg-teal-500/90 text-white',
}

// 350000 -> "350 000 FCFA" (espace simple, identique côté serveur et client)
export function formatFCFA(montant) {
  return `${String(montant).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}

// "Villa 1" -> "villa-1"
export function slugify(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
