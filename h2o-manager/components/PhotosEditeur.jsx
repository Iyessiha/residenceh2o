'use client'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { Trash2, Images } from 'lucide-react'

// Chemins locaux (/images/...) servis par le site public : prévisualisés depuis le site.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://residencesh2o.com'

function versUrlAffichable(chemin) {
  return chemin.startsWith('/') ? `${SITE}${chemin}` : chemin
}

// Chemin stocké dans la colonne : espaces encodés, comme pour les photos de la landing.
function versChemin(fichier) {
  return encodeURI(decodeURI(fichier))
}

// Réduit la photo avant l'envoi (appareil photo : 3 à 7 Mo → environ 300 Ko), ce qui accélère
// l'envoi, l'affichage dans le manager et le chargement du site public.
async function reduire(fichier, cote = 1920, qualite = 0.82) {
  if (!fichier.type.startsWith('image/') || fichier.type === 'image/gif' || fichier.type === 'image/svg+xml') return fichier
  try {
    const bitmap = await createImageBitmap(fichier, { imageOrientation: 'from-image' })
    const echelle = Math.min(1, cote / Math.max(bitmap.width, bitmap.height))
    if (echelle === 1 && fichier.size < 600 * 1024) { bitmap.close?.(); return fichier }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * echelle)
    canvas.height = Math.round(bitmap.height * echelle)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', qualite))
    if (!blob || blob.size >= fichier.size) return fichier
    return new File([blob], fichier.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return fichier   // format non lisible par le navigateur : envoi tel quel
  }
}

const BUCKET = 'galerie'
const MARQUEUR = `/storage/v1/object/public/${BUCKET}/`

// Photos d'une villa ou d'une chambre. Les fichiers vont dans le bucket « galerie »,
// les adresses publiques dans la colonne photos de la ligne. La première photo est la couverture.
export default function PhotosEditeur({ table, id, photos = [], onChange }) {
  const supabase = createClient()
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState('')
  const [galerie, setGalerie] = useState(null)   // photos déjà stockées, null = sélecteur fermé
  const [selection, setSelection] = useState([])
  const [progression, setProgression] = useState('')

  async function enregistrer(liste) {
    const { error } = await supabase.from(table).update({ photos: liste }).eq('id', id)
    if (error) {
      setMessage(`Erreur : ${error.message}`)
      return false
    }
    onChange(liste)
    return true
  }

  async function ajouter(e) {
    const fichiers = Array.from(e.target.files || [])
    e.target.value = ''
    if (fichiers.length === 0) return

    setEnvoi(true)
    setMessage('')
    const ajoutees = []
    const echecs = []
    let fait = 0
    setProgression(`0/${fichiers.length}`)
    // 3 envois en parallèle : bien plus rapide qu'une photo après l'autre
    let suivant = 0
    async function travailleur() {
      while (suivant < fichiers.length) {
        const i = suivant++
        const original = fichiers[i]
        const fichier = await reduire(original)
        const nom = `${table}/${id}/${Date.now()}-${i}-${fichier.name.replace(/[^a-z0-9.]/gi, '-')}`
        const { error } = await supabase.storage.from(BUCKET).upload(nom, fichier, { cacheControl: '31536000', contentType: fichier.type || undefined })
        if (error) echecs.push(`${original.name} (${error.message})`)
        else ajoutees[i] = supabase.storage.from(BUCKET).getPublicUrl(nom).data.publicUrl
        setProgression(`${++fait}/${fichiers.length}`)
      }
    }
    await Promise.all([travailleur(), travailleur(), travailleur()])
    const nouvelles = ajoutees.filter(Boolean)
    if (nouvelles.length) await enregistrer([...photos, ...nouvelles])
    if (echecs.length) setMessage(`Non envoyées : ${echecs.join(', ')}`)
    setProgression('')
    setEnvoi(false)
  }

  async function ouvrirGalerie() {
    setMessage('')
    const { data, error } = await supabase
      .from('photos_galerie')
      .select('fichier')
      .eq('visible', true)
      .order('position')
    if (error) {
      setMessage(`Erreur : ${error.message}`)
      return
    }
    setSelection([])
    setGalerie(data || [])
  }

  function basculerSelection(chemin) {
    setSelection((s) => (s.includes(chemin) ? s.filter((c) => c !== chemin) : [...s, chemin]))
  }

  async function ajouterSelection() {
    const nouvelles = selection.map(versChemin).filter((c) => !photos.includes(c))
    if (nouvelles.length && (await enregistrer([...photos, ...nouvelles]))) {
      setGalerie(null)
      setSelection([])
    }
  }

  async function retirer(url) {
    if (!window.confirm('Supprimer cette photo du site ?')) return
    if (!(await enregistrer(photos.filter((p) => p !== url)))) return
    // On ne supprime le fichier que s'il a été envoyé pour cet élément : une photo choisie dans la galerie
    // du site ou utilisée ailleurs doit rester disponible.
    if (url.includes(`${MARQUEUR}${table}/${id}/`)) {
      await supabase.storage.from(BUCKET).remove([decodeURIComponent(url.split(MARQUEUR)[1])])
    }
  }

  function deplacer(index, sens) {
    const liste = [...photos]
    const cible = index + sens
    if (cible < 0 || cible >= liste.length) return
    ;[liste[index], liste[cible]] = [liste[cible], liste[index]]
    enregistrer(liste)
  }

  function mettreEnPremier(index) {
    enregistrer([photos[index], ...photos.filter((_, i) => i !== index)])
  }

  if (!id) {
    return <p className="text-sm text-gray-500">Enregistrez d'abord pour ajouter des photos.</p>
  }

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={url} className="relative rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={versUrlAffichable(url)} alt="" className="w-full h-24 object-cover" loading="lazy" decoding="async" />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Couverture</span>
              )}
              <div className="absolute bottom-1 right-1 flex gap-1">
                {i > 0 && (
                  <button type="button" onClick={() => deplacer(i, -1)} className="text-xs bg-white/90 px-1.5 py-0.5 rounded" aria-label="Déplacer avant">←</button>
                )}
                {i < photos.length - 1 && (
                  <button type="button" onClick={() => deplacer(i, 1)} className="text-xs bg-white/90 px-1.5 py-0.5 rounded" aria-label="Déplacer après">→</button>
                )}
                {i > 0 && (
                  <button type="button" onClick={() => mettreEnPremier(i)} className="text-[10px] bg-white/90 px-1.5 py-0.5 rounded">
                    1ère
                  </button>
                )}
                <button type="button" onClick={() => retirer(url)} className="bg-white/90 p-1 rounded text-red-600" aria-label="Supprimer la photo">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <label className={`btn-secondary inline-flex cursor-pointer ${envoi ? 'opacity-50 pointer-events-none' : ''}`}>
          {envoi ? `Envoi ${progression}…` : '+ Téléverser des photos'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={ajouter} />
        </label>
        <button type="button" onClick={() => (galerie ? setGalerie(null) : ouvrirGalerie())} className="btn-secondary inline-flex items-center gap-2">
          <Images size={14} /> {galerie ? 'Fermer la galerie' : 'Choisir dans la galerie'}
        </button>
      </div>

      {galerie && (
        <div className="border border-gray-200 rounded-lg p-3 space-y-3">
          {galerie.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune photo dans la galerie.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto">
              {galerie.map(({ fichier }) => {
                const chemin = versChemin(fichier)
                const deja = photos.includes(chemin)
                const choisie = selection.includes(chemin)
                return (
                  <button
                    key={fichier}
                    type="button"
                    disabled={deja}
                    onClick={() => basculerSelection(chemin)}
                    className={`relative rounded-lg overflow-hidden border-2 ${choisie ? 'border-teal-600' : 'border-transparent'} ${deja ? 'opacity-40' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={versUrlAffichable(chemin)} alt="" className="w-full h-16 object-cover" loading="lazy" />
                    {(choisie || deja) && (
                      <span className="absolute top-1 right-1 text-[10px] bg-teal-600 text-white px-1 rounded">{deja ? '✓' : '✓'}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          {galerie.length > 0 && (
            <button type="button" onClick={ajouterSelection} disabled={selection.length === 0} className="btn-primary disabled:opacity-50">
              Ajouter {selection.length > 0 ? `${selection.length} photo${selection.length > 1 ? 's' : ''}` : 'la sélection'}
            </button>
          )}
        </div>
      )}
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  )
}
