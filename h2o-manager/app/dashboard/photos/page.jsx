'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ChevronUp, ChevronDown, Save, Trash2, Upload } from 'lucide-react'

// Adresse du site vitrine, pour afficher les miniatures (ex: https://residencesh2o.com)
const SITE_URL = process.env.NEXT_PUBLIC_LANDING_URL || ''

export default function PhotosPage() {
  const supabase = createClient()
  const [photos, setPhotos] = useState([])       // dans l'ordre affiché
  const [enregistre, setEnregistre] = useState({}) // état en base, par id
  const [duplexes, setDuplexes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: liste }, { data: duplexList }] = await Promise.all([
      supabase.from('photos_galerie').select('id,fichier,alt,duplex_code,position,visible').order('position'),
      supabase.from('duplexes').select('code,nom').order('code'),
    ])
    const lignes = liste || []
    setPhotos(lignes)
    setEnregistre(Object.fromEntries(lignes.map(p => [p.id, { position: p.position, duplex_code: p.duplex_code, visible: p.visible }])))
    setDuplexes(duplexList || [])
    setLoading(false)
  }

  // Photos dont l'ordre, le duplex ou la visibilité diffère de la base
  const modifications = photos.flatMap((photo, index) => {
    const avant = enregistre[photo.id]
    if (!avant) return []
    const change = avant.position !== index + 1
      || avant.duplex_code !== photo.duplex_code
      || avant.visible !== photo.visible
    return change ? [{ id: photo.id, position: index + 1, duplex_code: photo.duplex_code, visible: photo.visible }] : []
  })

  // Envoie les photos dans le bucket « galerie » puis les ajoute en fin de liste
  async function televerser(e) {
    const fichiers = Array.from(e.target.files || [])
    e.target.value = ''
    if (fichiers.length === 0) return
    setUploading(true)
    setMessage('')
    let position = Math.max(0, ...photos.map(p => p.position)) + 1
    for (const fichier of fichiers) {
      const nom = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fichier.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: erreurEnvoi } = await supabase.storage.from('galerie').upload(nom, fichier, { cacheControl: '31536000' })
      if (erreurEnvoi) {
        setMessage(`Erreur sur ${fichier.name} : ${erreurEnvoi.message}`)
        break
      }
      const { data: { publicUrl } } = supabase.storage.from('galerie').getPublicUrl(nom)
      const { error: erreurLigne } = await supabase.from('photos_galerie').insert([{ fichier: publicUrl, position: position++, visible: true }])
      if (erreurLigne) {
        setMessage(`Erreur sur ${fichier.name} : ${erreurLigne.message}`)
        break
      }
    }
    setUploading(false)
    load()
  }

  // Retire la photo du site et supprime le fichier s'il est dans le bucket
  async function supprimer(photo) {
    if (!window.confirm('Retirer cette photo de la galerie ?')) return
    const marqueur = '/galerie/'
    if (photo.fichier.includes(marqueur)) {
      await supabase.storage.from('galerie').remove([photo.fichier.split(marqueur)[1]])
    }
    const { error } = await supabase.from('photos_galerie').delete().eq('id', photo.id)
    if (error) setMessage(`Erreur : ${error.message}`)
    load()
  }

  function deplacer(index, sens) {
    const cible = index + sens
    if (cible < 0 || cible >= photos.length) return
    const suivant = [...photos]
    ;[suivant[index], suivant[cible]] = [suivant[cible], suivant[index]]
    setPhotos(suivant)
    setMessage('')
  }

  function modifier(id, champs) {
    setPhotos(prev => prev.map(p => (p.id === id ? { ...p, ...champs } : p)))
    setMessage('')
  }

  async function enregistrer() {
    setSaving(true)
    const resultats = await Promise.all(
      modifications.map(({ id, ...champs }) => supabase.from('photos_galerie').update(champs).eq('id', id))
    )
    const erreur = resultats.find(r => r.error)
    setSaving(false)
    if (erreur) {
      setMessage(`Erreur : ${erreur.error.message}`)
      return
    }
    setMessage('Ordre enregistré. Le site affiche les changements dans les 5 minutes.')
    load()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photos</h1>
          <p className="text-gray-500 text-sm">
            Rangez les photos : la première de la liste apparaît en premier sur le site.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`btn-secondary flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload size={16} />
            {uploading ? 'Envoi...' : 'Ajouter des photos'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={televerser} />
          </label>
        <button
          onClick={enregistrer}
          disabled={saving || modifications.length === 0}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Enregistrement...' : `Enregistrer${modifications.length ? ` (${modifications.length})` : ''}`}
        </button>
        </div>
      </div>

      {message && <p className="text-sm mb-4 text-gray-700">{message}</p>}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Chargement...</div>
      ) : (
        <div className="card divide-y">
          {photos.map((photo, index) => (
            <div key={photo.id} className="flex items-center gap-3 p-3">
              <div className="flex flex-col">
                <button
                  onClick={() => deplacer(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                  aria-label="Monter"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={() => deplacer(index, 1)}
                  disabled={index === photos.length - 1}
                  className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                  aria-label="Descendre"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              <span className="w-8 text-center text-sm font-mono text-gray-500">{index + 1}</span>

              <div className="w-20 h-14 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {SITE_URL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.fichier.startsWith('http') ? photo.fichier : `${SITE_URL}${encodeURI(photo.fichier)}`} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{photo.fichier.split('/').pop()}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <select
                    className="input text-xs py-1"
                    value={photo.duplex_code || ''}
                    onChange={e => modifier(photo.id, { duplex_code: e.target.value || null })}
                  >
                    <option value="">Galerie générale</option>
                    {duplexes.map(d => (
                      <option key={d.code} value={d.code}>{d.nom} ({d.code})</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={photo.visible}
                      onChange={e => modifier(photo.id, { visible: e.target.checked })}
                    />
                    Visible sur le site
                  </label>
                </div>
              </div>

              <button onClick={() => supprimer(photo)} className="p-2 text-red-600 hover:text-red-800" aria-label="Retirer la photo">
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {photos.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">Aucune photo enregistrée.</div>
          )}
        </div>
      )}
    </div>
  )
}
