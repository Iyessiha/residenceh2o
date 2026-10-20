// Lecture des duplex et des photos depuis Supabase (tables gérées dans le manager).
// Serveur uniquement : utilise fs pour le secours de la galerie.
import fs from 'fs'
import path from 'path'
import { DUPLEX_FALLBACK, BADGE_CLASSES, slugify } from './residences'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Renvoie null si Supabase n'est pas configuré ou ne répond pas.
async function lire(table, query) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function photosLocales() {
  const dir = path.join(process.cwd(), 'public', 'images', 'gallery')
  return fs
    .readdirSync(dir)
    .filter((nom) => /\.(jpe?g|png|webp)$/i.test(nom))
    .sort()
    .map((nom) => ({ id: nom, fichier: `/images/gallery/${nom}`, alt: null, duplex_code: null }))
}

// Photos dans l'ordre défini par le manager (champ position).
export async function getPhotos() {
  const rows = await lire('photos_galerie', 'select=id,fichier,alt,duplex_code&visible=eq.true&order=position.asc')
  const liste = rows ?? photosLocales()
  return liste.map((photo, index) => ({
    id: photo.id,
    path: encodeURI(photo.fichier),
    alt: photo.alt || `Les Résidences H₂O — photo ${index + 1}`,
    duplex: photo.duplex_code,
  }))
}

// Duplex avec prix, contenu et photos (dans l'ordre du manager).
export async function getDuplexes() {
  const [rows, photos] = await Promise.all([
    lire('duplexes', 'select=code,nom,capacite,chambres,surface_m2,tarif_nuit,tagline,badge,features&order=code.asc'),
    getPhotos(),
  ])
  const source = rows && rows.length ? rows : DUPLEX_FALLBACK

  return source.map((d) => {
    const photosDuplex = photos.filter((p) => p.duplex === d.code).map((p) => p.path)
    const secours = DUPLEX_FALLBACK.find((f) => f.code === d.code)?.images.map(encodeURI) || []
    return {
      id: d.code,
      slug: slugify(d.nom),
      nom: d.nom,
      tagline: d.tagline || '',
      prix: d.tarif_nuit,
      capacite: `Jusqu'à ${d.capacite} personnes`,
      chambres: d.chambres ?? 5,
      surface: d.surface_m2 ? `${d.surface_m2} m²` : '',
      badge: d.badge || '',
      badgeClass: BADGE_CLASSES[d.badge] || 'bg-teal-500/90 text-white',
      features: d.features || [],
      images: photosDuplex.length ? photosDuplex : secours,
    }
  })
}

// Balises et pixels actifs, gérés par les administrateurs dans le manager.
export async function getBalises() {
  const rows = await lire('balises_suivi', 'select=id,nom,type,emplacement,code&actif=eq.true&order=created_at.asc')
  return rows ?? []
}
