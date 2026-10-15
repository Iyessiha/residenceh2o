'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

const SEGMENTS = ['tous', 'particulier', 'entreprise', 'evenement']
const SEG_LABELS = { tous: 'Tous', particulier: 'Particuliers', entreprise: 'Entreprises', evenement: 'Événements' }
const EMPTY = { nom: '', telephone: '', email: '', segment: 'particulier', adresse: '', notes: '' }

function exportCSV(clients) {
  const headers = ['Nom', 'Téléphone', 'Email', 'Segment', 'Adresse', 'Notes', 'Nb séjours', 'Client depuis']
  const rows = clients.map(c => [
    c.nom || '',
    c.telephone || '',
    c.email || '',
    SEG_LABELS[c.segment] || c.segment || '',
    c.adresse || '',
    (c.notes || '').replace(/"/g, '""'),
    c.reservations?.[0]?.count ?? 0,
    c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '',
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(v => `"${v}"`).join(';'))
    .join('\n')

  const BOM = '﻿' // UTF-8 BOM pour Excel
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clients-h2o-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function Clients() {
  const router = useRouter()
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
    await supabase.from('clients').insert([form])
    setShowForm(false); setForm(EMPTY); load()
    setSaving(false)
  }

  const filtered = clients.filter(c =>
    !search || c.nom?.toLowerCase().includes(search.toLowerCase()) || c.telephone?.includes(search)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>CRM Clients</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            disabled={loading || filtered.length === 0}
            title="Exporter la liste visible en CSV"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-opacity disabled:opacity-40 hover:opacity-80"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV {filtered.length > 0 ? `(${filtered.length})` : ''}
          </button>
          <button onClick={() => { setForm(EMPTY); setShowForm(true) }} className="btn-primary">+ Nouveau client</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SEGMENTS.map(s => (
          <button key={s} onClick={() => setSegment(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${segment === s ? 'text-white' : 'border hover:opacity-80'}`}
            style={segment === s ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
            {SEG_LABELS[s]}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="ml-auto border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 w-48"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', '--tw-ring-color': 'var(--primary)' }}
          placeholder="Rechercher..." />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Client</th>
                <th className="table-th">Téléphone</th>
                <th className="table-th">Segment</th>
                <th className="table-th">Séjours</th>
                <th className="table-th">Depuis</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Aucun client</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-t cursor-pointer hover:opacity-90" style={{ borderColor: 'var(--border-2)' }} onClick={() => setSelected(c)}>
                  <td className="table-td">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>{c.nom}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.email}</p>
                  </td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{c.telephone}</td>
                  <td className="table-td">
                    <span className={`badge ${c.segment === 'entreprise' ? 'bg-purple-100 text-purple-700' : c.segment === 'evenement' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {SEG_LABELS[c.segment] || c.segment}
                    </span>
                  </td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{c.reservations?.[0]?.count || 0}</td>
                  <td className="table-td" style={{ color: 'var(--text-3)' }}>{formatDate(c.created_at)}</td>
                  <td className="table-td">
                    <button className="text-xs hover:underline" style={{ color: 'var(--primary)' }} onClick={e => { e.stopPropagation(); setSelected(c) }}>Voir</button>
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
          <div className="w-full max-w-sm h-full overflow-y-auto p-6 shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Fiche client</h2>
              <button onClick={() => setSelected(null)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-3">
              <div><p className="label">Nom</p><p className="font-semibold" style={{ color: 'var(--text)' }}>{selected.nom}</p></div>
              <div><p className="label">Téléphone</p><p style={{ color: 'var(--text-2)' }}>{selected.telephone || '—'}</p></div>
              <div><p className="label">Email</p><p style={{ color: 'var(--text-2)' }}>{selected.email || '—'}</p></div>
              <div><p className="label">Segment</p><p style={{ color: 'var(--text-2)' }}>{SEG_LABELS[selected.segment] || selected.segment}</p></div>
              <div><p className="label">Adresse</p><p style={{ color: 'var(--text-2)' }}>{selected.adresse || '—'}</p></div>
              <div><p className="label">Notes</p><p className="text-sm" style={{ color: 'var(--text-3)' }}>{selected.notes || '—'}</p></div>
              <div><p className="label">Client depuis</p><p style={{ color: 'var(--text-2)' }}>{formatDate(selected.created_at)}</p></div>
            </div>
            {/* Actions rapides */}
            <div className="mt-5 mb-3">
              <p className="label mb-2">Actions rapides</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const p = new URLSearchParams({ client: selected.id, nom: selected.nom, tel: selected.telephone || '' })
                    router.push(`/dashboard/restaurant?${p}`)
                    setSelected(null)
                  }}
                  className="text-xs font-semibold py-2 px-3 rounded-lg border transition-opacity hover:opacity-70 text-left"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)', color: 'var(--text-2)' }}
                >
                  🍽️ Commande restaurant
                </button>
                <button
                  onClick={() => {
                    const p = new URLSearchParams({ client: selected.id, nom: selected.nom, tel: selected.telephone || '' })
                    router.push(`/dashboard/boutique?${p}`)
                    setSelected(null)
                  }}
                  className="text-xs font-semibold py-2 px-3 rounded-lg border transition-opacity hover:opacity-70 text-left"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)', color: 'var(--text-2)' }}
                >
                  🛍️ Vente boutique
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <a href={`https://wa.me/${(selected.telephone || '').replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 btn bg-green-600 hover:bg-green-700 text-white text-center">
                WhatsApp
              </a>
              <button onClick={() => setSelected(null)} className="flex-1 btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Nouveau client</h2>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
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
