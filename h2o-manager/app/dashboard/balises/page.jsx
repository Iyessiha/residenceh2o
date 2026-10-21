'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { FOURNISSEURS, genererCode } from '@/lib/pixels'
import { Pencil, Trash2, Plus } from 'lucide-react'

const PERSO = ''  // valeur du sélecteur pour un code libre
const VIDE = { nom: '', fournisseur: PERSO, identifiant: '', type: 'pixel', emplacement: 'head', code: '', actif: true }

export default function BalisesPage() {
  const supabase = createClient()
  const [admin, setAdmin] = useState(null)      // null = en chargement
  const [balises, setBalises] = useState([])
  const [form, setForm] = useState(null)        // null = pas de formulaire ouvert
  const [editId, setEditId] = useState(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profil } = user
      ? await supabase.from('profiles').select('role').eq('id', user.id).single()
      : { data: null }
    const estAdmin = profil?.role === 'admin'
    setAdmin(estAdmin)
    if (estAdmin) load()
  }

  async function load() {
    const { data } = await supabase.from('balises_suivi').select('*').order('created_at')
    setBalises(data || [])
  }

  // Construit la ligne à enregistrer : code généré pour un fournisseur connu, code saisi sinon.
  function preparer() {
    if (!form.fournisseur) {
      if (!form.code.trim()) return { erreur: 'Collez le code à installer' }
      return { ligne: { nom: form.nom, fournisseur: null, identifiant: null, type: form.type, emplacement: form.emplacement, code: form.code, actif: form.actif } }
    }
    const { code, erreur } = genererCode(form.fournisseur, form.identifiant)
    if (erreur) return { erreur }
    const modele = FOURNISSEURS[form.fournisseur]
    return { ligne: { nom: form.nom, fournisseur: form.fournisseur, identifiant: form.identifiant.trim(), type: modele.type, emplacement: modele.emplacement, code, actif: form.actif } }
  }

  async function enregistrer() {
    const { ligne, erreur } = preparer()
    if (erreur) { setMessage(erreur); return }
    setSaving(true)
    setMessage('')
    const req = editId
      ? supabase.from('balises_suivi').update(ligne).eq('id', editId)
      : supabase.from('balises_suivi').insert([ligne])
    const { error } = await req
    setSaving(false)
    if (error) { setMessage(`Erreur : ${error.message}`); return }
    setForm(null)
    setEditId(null)
    load()
  }

  async function supprimer(b) {
    if (!window.confirm(`Supprimer « ${b.nom} » ? Il ne sera plus chargé sur le site.`)) return
    const { error } = await supabase.from('balises_suivi').delete().eq('id', b.id)
    if (error) setMessage(`Erreur : ${error.message}`)
    load()
  }

  async function basculer(b) {
    await supabase.from('balises_suivi').update({ actif: !b.actif }).eq('id', b.id)
    load()
  }

  if (admin === null) return <div className="text-center py-16 text-gray-500">Chargement...</div>
  if (!admin) {
    return (
      <div className="card p-6 max-w-lg">
        <h1 className="text-lg font-bold text-gray-900 mb-2">Accès réservé</h1>
        <p className="text-sm text-gray-600">Seuls les administrateurs peuvent gérer les pixels et balises.</p>
      </div>
    )
  }

  const modele = form?.fournisseur ? FOURNISSEURS[form.fournisseur] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pixels & balises</h1>
          <p className="text-gray-500 text-sm">Suivi publicitaire et analyse (Meta, Google, TikTok) chargés sur le site public.</p>
        </div>
        <button onClick={() => { setForm({ ...VIDE }); setEditId(null); setMessage('') }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-xs">
        Le code d'un pixel s'exécute sur le site public. Utilisez les identifiants fournis par chaque service ; le code personnalisé doit venir d'une source de confiance.
      </div>

      {message && <p className="text-sm text-red-600 mb-4">{message}</p>}

      {form && (
        <div className="card p-5 mb-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nom affiché</label>
              <input className="input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Pixel Meta Duplex" />
            </div>
            <div>
              <label className="label">Fournisseur</label>
              <select className="input" value={form.fournisseur} onChange={e => setForm(p => ({ ...p, fournisseur: e.target.value, identifiant: '' }))}>
                <option value="">Code personnalisé</option>
                {Object.entries(FOURNISSEURS).map(([cle, f]) => (
                  <option key={cle} value={cle}>{f.nom}</option>
                ))}
              </select>
            </div>
          </div>

          {modele ? (
            <div>
              <label className="label">Identifiant ({modele.exemple})</label>
              <input className="input font-mono" value={form.identifiant} onChange={e => setForm(p => ({ ...p, identifiant: e.target.value }))} placeholder={modele.exemple} />
              <p className="text-xs text-gray-500 mt-1">Le code d'installation est généré automatiquement à partir de cet identifiant.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="pixel">Pixel</option>
                    <option value="balise">Balise (vérification, autre)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Emplacement</label>
                  <select className="input" value={form.emplacement} onChange={e => setForm(p => ({ ...p, emplacement: e.target.value }))}>
                    <option value="head">Dans l'en-tête (head)</option>
                    <option value="body">Fin de page (body)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Code</label>
                <textarea className="input font-mono text-xs" rows={8} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="<script>…</script>" />
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.actif} onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))} />
            Actif sur le site
          </label>
          <div className="flex gap-3">
            <button onClick={() => { setForm(null); setEditId(null) }} className="btn-secondary flex-1">Annuler</button>
            <button onClick={enregistrer} disabled={saving || !form.nom} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      <div className="card divide-y">
        {balises.map(b => (
          <div key={b.id} className="flex items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{b.nom}</p>
              <p className="text-xs text-gray-500">
                {b.fournisseur ? `${FOURNISSEURS[b.fournisseur]?.nom || b.fournisseur} · ${b.identifiant}` : (b.type === 'pixel' ? 'Pixel personnalisé' : 'Balise personnalisée')}
                {' · '}{b.emplacement === 'head' ? 'en-tête' : 'fin de page'}
              </p>
            </div>
            <label className="flex items-center gap-1 text-xs text-gray-600">
              <input type="checkbox" checked={b.actif} onChange={() => basculer(b)} />
              Actif
            </label>
            <button onClick={() => {
              setForm({ nom: b.nom, fournisseur: b.fournisseur || PERSO, identifiant: b.identifiant || '', type: b.type, emplacement: b.emplacement, code: b.code, actif: b.actif })
              setEditId(b.id)
              setMessage('')
            }} className="p-2 text-gray-500 hover:text-gray-900" aria-label="Modifier">
              <Pencil size={16} />
            </button>
            <button onClick={() => supprimer(b)} className="p-2 text-red-600 hover:text-red-800" aria-label="Supprimer">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {balises.length === 0 && <div className="text-center py-10 text-gray-500 text-sm">Aucun pixel pour le moment.</div>}
      </div>
    </div>
  )
}
