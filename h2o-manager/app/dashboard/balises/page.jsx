'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Pencil, Trash2, Plus } from 'lucide-react'

const VIDE = { nom: '', type: 'pixel', emplacement: 'head', code: '', actif: true }

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

  async function enregistrer() {
    setSaving(true)
    setMessage('')
    const req = editId
      ? supabase.from('balises_suivi').update(form).eq('id', editId)
      : supabase.from('balises_suivi').insert([form])
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
        <p className="text-sm text-gray-600">Seuls les administrateurs peuvent gérer les balises et pixels.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balises & pixels</h1>
          <p className="text-gray-500 text-sm">Scripts de suivi (Google, Meta, TikTok…) chargés sur le site public.</p>
        </div>
        <button onClick={() => { setForm({ ...VIDE }); setEditId(null) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-xs">
        Le code collé ici s'exécute sur le site public. Ne collez que du code de confiance fourni par le service de suivi.
      </div>

      {message && <p className="text-sm text-red-600 mb-4">{message}</p>}

      {form && (
        <div className="card p-5 mb-6 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="label">Nom</label>
              <input className="input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Meta Pixel" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="pixel">Pixel</option>
                <option value="balise">Balise (Google, vérification…)</option>
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
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.actif} onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))} />
            Actif sur le site
          </label>
          <div className="flex gap-3">
            <button onClick={() => { setForm(null); setEditId(null) }} className="btn-secondary flex-1">Annuler</button>
            <button onClick={enregistrer} disabled={saving || !form.nom || !form.code.trim()} className="btn-primary flex-1 disabled:opacity-50">
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
                {b.type === 'pixel' ? 'Pixel' : 'Balise'} · {b.emplacement === 'head' ? 'en-tête' : 'fin de page'}
              </p>
            </div>
            <label className="flex items-center gap-1 text-xs text-gray-600">
              <input type="checkbox" checked={b.actif} onChange={() => basculer(b)} />
              Actif
            </label>
            <button onClick={() => { setForm({ nom: b.nom, type: b.type, emplacement: b.emplacement, code: b.code, actif: b.actif }); setEditId(b.id) }} className="p-2 text-gray-500 hover:text-gray-900" aria-label="Modifier">
              <Pencil size={16} />
            </button>
            <button onClick={() => supprimer(b)} className="p-2 text-red-600 hover:text-red-800" aria-label="Supprimer">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {balises.length === 0 && <div className="text-center py-10 text-gray-500 text-sm">Aucune balise pour le moment.</div>}
      </div>
    </div>
  )
}
