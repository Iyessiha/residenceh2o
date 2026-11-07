'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const EMPTY = { nom: '', contact: '', adresse: '' }

export default function Entreprises() {
  const supabase = createClient()
  const [entreprises, setEntreprises] = useState([])
  const [nbClients, setNbClients] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: ent }, { data: cli }] = await Promise.all([
      supabase.from('entreprises').select('*').order('nom'),
      supabase.from('clients').select('entreprise_id').not('entreprise_id', 'is', null),
    ])
    const compte = {}
    for (const c of cli || []) compte[c.entreprise_id] = (compte[c.entreprise_id] || 0) + 1
    setEntreprises(ent || [])
    setNbClients(compte)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setForm(EMPTY); setEditId(null); setErreur(null); setShowForm(true)
  }

  function openEdit(e) {
    setForm({ nom: e.nom || '', contact: e.contact || '', adresse: e.adresse || '' })
    setEditId(e.id); setErreur(null); setShowForm(true)
  }

  async function save() {
    setSaving(true)
    setErreur(null)
    const payload = { nom: form.nom.trim(), contact: form.contact.trim(), adresse: form.adresse.trim() }
    const { error } = editId
      ? await supabase.from('entreprises').update(payload).eq('id', editId)
      : await supabase.from('entreprises').insert([payload])
    setSaving(false)
    if (error) { setErreur(error.message); return }
    setShowForm(false)
    load()
  }

  async function supprimer(e) {
    const n = nbClients[e.id] || 0
    const msg = n > 0
      ? `Supprimer l'entreprise ${e.nom} ? Ses ${n} client(s) restent, sans entreprise rattachée.`
      : `Supprimer l'entreprise ${e.nom} ?`
    if (!confirm(msg)) return
    { const { error: erreurEcriture } = await supabase.from('entreprises').delete().eq('id', e.id); if (erreurEcriture) { window.alert("Enregistrement impossible : " + erreurEcriture.message); return } }
    load()
  }

  const filtrees = entreprises.filter(e =>
    !search || e.nom?.toLowerCase().includes(search.toLowerCase()) || e.contact?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Entreprises</h1>
        <button onClick={openNew} className="btn-primary">+ Nouvelle entreprise</button>
      </div>

      <div className="flex justify-end mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none w-56"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
          placeholder="Rechercher..." />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Entreprise</th>
                <th className="table-th">Contact</th>
                <th className="table-th">Adresse</th>
                <th className="table-th">Clients</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement...</td></tr>
              ) : filtrees.length === 0 ? (
                <tr><td colSpan={5} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Aucune entreprise</td></tr>
              ) : filtrees.map(e => (
                <tr key={e.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td font-medium" style={{ color: 'var(--text)' }}>{e.nom}</td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{e.contact || '—'}</td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{e.adresse || '—'}</td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{nbClients[e.id] || 0}</td>
                  <td className="table-td">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(e)} className="text-xs hover:underline" style={{ color: 'var(--primary)' }}>Modifier</button>
                      <button onClick={() => supprimer(e)} className="text-xs hover:underline" style={{ color: '#DC2626' }}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{editId ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</h2>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Nom de l'entreprise *</label>
                <input className="input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
              </div>
              <div>
                <label className="label">Contact</label>
                <input className="input" placeholder="Personne à joindre" value={form.contact}
                  onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} />
              </div>
              <div>
                <label className="label">Adresse</label>
                <input className="input" value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} />
              </div>
            </div>
            {erreur && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4">{erreur}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom.trim()} className="btn-primary flex-1">
                {saving ? '...' : editId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
