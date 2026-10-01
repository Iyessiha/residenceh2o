'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, formatFCFA, STATUT_COLORS, STATUT_LABELS } from '@/lib/utils'

const STATUTS = ['tous', 'en_attente', 'confirme', 'en_sejour', 'cloture', 'annule']
const DUPLEXES = ['D-1', 'D-2', 'D-3']

const EMPTY = { nom_client: '', telephone: '', email: '', duplex_id: '', date_arrivee: '', date_depart: '', nb_personnes: '', montant_total: '', notes: '', statut: 'en_attente', source: 'manuel', type: 'sejour' }

export default function Reservations() {
  const supabase = createClient()
  const [reservations, setReservations] = useState([])
  const [filter, setFilter] = useState('tous')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    let q = supabase.from('reservations').select('*').order('date_arrivee', { ascending: false })
    if (filter !== 'tous') q = q.eq('statut', filter)
    const { data } = await q
    setReservations(data || [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, nb_personnes: form.nb_personnes ? parseInt(form.nb_personnes) : null, montant_total: form.montant_total ? parseInt(form.montant_total) : null }
    const { error } = await supabase.from('reservations').insert([payload])
    if (!error) { setShowForm(false); setForm(EMPTY); load() }
    setSaving(false)
  }

  async function updateStatut(id, statut) {
    await supabase.from('reservations').update({ statut }).eq('id', id)
    load()
  }

  const filtered = reservations.filter(r =>
    !search || r.nom_client?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }} className="btn-primary">
          + Nouvelle réservation
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUTS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === s ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {s === 'tous' ? 'Toutes' : STATUT_LABELS[s]}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
          placeholder="Rechercher un client..." />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Client</th>
                <th className="table-th">Duplex</th>
                <th className="table-th">Arrivée</th>
                <th className="table-th">Départ</th>
                <th className="table-th">Montant</th>
                <th className="table-th">Statut</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="table-td text-center text-gray-400 py-10">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center text-gray-400 py-10">Aucune réservation</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="table-td">
                    <p className="font-medium text-gray-900">{r.nom_client}</p>
                    <p className="text-xs text-gray-400">{r.telephone}</p>
                  </td>
                  <td className="table-td">{r.duplex_id || '—'}</td>
                  <td className="table-td">{formatDate(r.date_arrivee)}</td>
                  <td className="table-td">{formatDate(r.date_depart)}</td>
                  <td className="table-td">{formatFCFA(r.montant_total)}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUT_COLORS[r.statut]}`}>{STATUT_LABELS[r.statut]}</span>
                  </td>
                  <td className="table-td">
                    <select value={r.statut} onChange={e => updateStatut(r.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500">
                      {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New reservation modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Nouvelle réservation</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nom client *</label>
                  <input className="input" value={form.nom_client} onChange={e => setForm(p => ({...p, nom_client: e.target.value}))} placeholder="Koné Aminata" />
                </div>
                <div>
                  <label className="label">Téléphone *</label>
                  <input className="input" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} placeholder="+225 07..." />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duplex</label>
                  <select className="input" value={form.duplex_id} onChange={e => setForm(p => ({...p, duplex_id: e.target.value}))}>
                    <option value="">— Choisir —</option>
                    {DUPLEXES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nbre personnes</label>
                  <input className="input" type="number" min="1" value={form.nb_personnes} onChange={e => setForm(p => ({...p, nb_personnes: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Arrivée</label>
                  <input className="input" type="date" value={form.date_arrivee} onChange={e => setForm(p => ({...p, date_arrivee: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Départ</label>
                  <input className="input" type="date" value={form.date_depart} onChange={e => setForm(p => ({...p, date_depart: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Montant total (FCFA)</label>
                <input className="input" type="number" value={form.montant_total} onChange={e => setForm(p => ({...p, montant_total: e.target.value}))} placeholder="120000" />
              </div>
              <div>
                <label className="label">Statut initial</label>
                <select className="input" value={form.statut} onChange={e => setForm(p => ({...p, statut: e.target.value}))}>
                  {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom_client} className="btn-primary flex-1">
                {saving ? 'Enregistrement...' : 'Créer la réservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
