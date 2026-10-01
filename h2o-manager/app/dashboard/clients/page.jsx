'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, emptyToNull } from '@/lib/utils'

const SEGMENTS = ['tous', 'particulier', 'entreprise', 'evenement']
const SEG_LABELS = { tous: 'Tous', particulier: 'Particuliers', entreprise: 'Entreprises', evenement: 'Événements' }
const EMPTY = { nom: '', telephone: '', email: '', segment: 'particulier', adresse: '', notes: '' }

export default function Clients() {
  const supabase = createClient()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [segment, setSegment] = useState('tous')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => { load() }, [segment])

  async function load() {
    setLoading(true)
    let q = supabase.from('clients').select('*, reservations(count)').order('nom')
    if (segment !== 'tous') q = q.eq('segment', segment)
    const { data } = await q
    setClients(data || [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('clients').insert([emptyToNull(form)])
    setShowForm(false); setForm(EMPTY); load()
    setSaving(false)
  }

  const filtered = clients.filter(c =>
    !search || c.nom?.toLowerCase().includes(search.toLowerCase()) || c.telephone?.includes(search)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CRM Clients</h1>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }} className="btn-primary">+ Nouveau client</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SEGMENTS.map(s => (
          <button key={s} onClick={() => setSegment(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${segment === s ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {SEG_LABELS[s]}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
          placeholder="Rechercher..." />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Client</th>
                <th className="table-th">Téléphone</th>
                <th className="table-th">Segment</th>
                <th className="table-th">Séjours</th>
                <th className="table-th">Depuis</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-10">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-10">Aucun client</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="table-td">
                    <p className="font-medium text-gray-900">{c.nom}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </td>
                  <td className="table-td">{c.telephone}</td>
                  <td className="table-td">
                    <span className={`badge ${c.segment === 'entreprise' ? 'bg-purple-100 text-purple-700' : c.segment === 'evenement' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {SEG_LABELS[c.segment] || c.segment}
                    </span>
                  </td>
                  <td className="table-td">{c.reservations?.[0]?.count || 0}</td>
                  <td className="table-td text-gray-400">{formatDate(c.created_at)}</td>
                  <td className="table-td">
                    <button className="text-teal-600 hover:underline text-xs" onClick={e => { e.stopPropagation(); setSelected(c) }}>Voir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Fiche client</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div><p className="label">Nom</p><p className="font-semibold text-gray-900">{selected.nom}</p></div>
              <div><p className="label">Téléphone</p><p>{selected.telephone || '—'}</p></div>
              <div><p className="label">Email</p><p>{selected.email || '—'}</p></div>
              <div><p className="label">Segment</p><p>{SEG_LABELS[selected.segment] || selected.segment}</p></div>
              <div><p className="label">Adresse</p><p>{selected.adresse || '—'}</p></div>
              <div><p className="label">Notes</p><p className="text-gray-600 text-sm">{selected.notes || '—'}</p></div>
              <div><p className="label">Client depuis</p><p>{formatDate(selected.created_at)}</p></div>
            </div>
            <div className="mt-6 flex gap-3">
              <a href={`https://wa.me/${(selected.telephone || '').replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 btn bg-green-600 hover:bg-green-700 text-white text-center">
                💬 WhatsApp
              </a>
              <button onClick={() => setSelected(null)} className="flex-1 btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Nouveau client</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Nom complet *</label>
                <input className="input" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Téléphone</label>
                  <input className="input" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Segment</label>
                  <select className="input" value={form.segment} onChange={e => setForm(p => ({...p, segment: e.target.value}))}>
                    {SEGMENTS.filter(s => s !== 'tous').map(s => <option key={s} value={s}>{SEG_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom} className="btn-primary flex-1">
                {saving ? '...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
