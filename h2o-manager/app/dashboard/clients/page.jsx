'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

const SEGMENTS = ['tous', 'particulier', 'entreprise', 'evenement']
const SEG_LABELS = { tous: 'Tous', particulier: 'Particuliers', entreprise: 'Entreprises', evenement: 'Événements' }
const EMPTY = { nom: '', contact: '', telephone: '', email: '', segment: 'particulier', adresse: '', notes: '', demarcheur_id: '' }
const TAUX_PAR_DEFAUT = 10
const EMPTY_DEMARCHEUR = { nom: '', prenom: '', telephone: '', pourcentage: TAUX_PAR_DEFAUT }

const fcfa = (n) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR')} FCFA`
const nomDemarcheur = (d) => (d ? `${d.prenom ? d.prenom + ' ' : ''}${d.nom}` : '')

function exportCSV(clients) {
  const headers = ['Nom', 'Contact', 'Téléphone', 'Email', 'Segment', 'Adresse', 'Démarcheur', 'Notes', 'Nb séjours', 'Client depuis']
  const rows = clients.map(c => [
    c.nom || '',
    c.contact || '',
    c.telephone || '',
    c.email || '',
    SEG_LABELS[c.segment] || c.segment || '',
    c.adresse || '',
    nomDemarcheur(c.demarcheur),
    c.notes || '',
    c.reservations?.[0]?.count ?? 0,
    c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '',
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
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

  const [demarcheurs, setDemarcheurs] = useState([])
  const [statsDemarcheurs, setStatsDemarcheurs] = useState({})
  const [showDemarcheurs, setShowDemarcheurs] = useState(false)
  const [dform, setDform] = useState(EMPTY_DEMARCHEUR)
  const [savingDemarcheur, setSavingDemarcheur] = useState(false)

  useEffect(() => { load() }, [segment])
  useEffect(() => { loadDemarcheurs() }, [])

  async function load() {
    setLoading(true)
    let q = supabase
      .from('clients')
      .select('*, reservations(count), demarcheur:demarcheurs(id, nom, prenom, pourcentage)')
      .order('nom')
    if (segment !== 'tous') q = q.eq('segment', segment)
    const { data } = await q
    setClients(data || [])
    setLoading(false)
  }

  // Liste des démarcheurs + chiffre d'affaires apporté (somme des réservations de leurs clients)
  async function loadDemarcheurs() {
    const [liste, apportes] = await Promise.all([
      supabase.from('demarcheurs').select('*').order('nom'),
      supabase.from('clients').select('demarcheur_id, reservations(montant_total)').not('demarcheur_id', 'is', null),
    ])
    setDemarcheurs(liste.data || [])

    const stats = {}
    for (const c of apportes.data || []) {
      const s = stats[c.demarcheur_id] || { clients: 0, ca: 0 }
      s.clients += 1
      for (const r of c.reservations || []) s.ca += Number(r.montant_total) || 0
      stats[c.demarcheur_id] = s
    }
    setStatsDemarcheurs(stats)
  }

  async function save() {
    setSaving(true)
    await supabase.from('clients').insert([{ ...form, demarcheur_id: form.demarcheur_id || null }])
    setShowForm(false); setForm(EMPTY); load()
    setSaving(false)
  }

  async function saveDemarcheur() {
    setSavingDemarcheur(true)
    await supabase.from('demarcheurs').insert([{
      nom: dform.nom.trim(),
      prenom: dform.prenom.trim(),
      telephone: dform.telephone.trim(),
      pourcentage: Number(dform.pourcentage) || 0,
    }])
    setDform(EMPTY_DEMARCHEUR)
    await loadDemarcheurs()
    setSavingDemarcheur(false)
  }

  async function supprimerDemarcheur(d) {
    if (!confirm(`Supprimer le démarcheur ${nomDemarcheur(d)} ? Ses clients restent, sans démarcheur.`)) return
    await supabase.from('demarcheurs').delete().eq('id', d.id)
    await loadDemarcheurs()
    load()
  }

  const filtered = clients.filter(c =>
    !search || c.nom?.toLowerCase().includes(search.toLowerCase()) || c.telephone?.includes(search)
  )

  const estEntreprise = form.segment === 'entreprise'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>CRM Clients</h1>
        <div className="flex flex-wrap gap-2">
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
          <button
            onClick={() => { setDform(EMPTY_DEMARCHEUR); setShowDemarcheurs(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}
          >
            🤝 Démarcheurs ({demarcheurs.length})
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
                    {c.segment === 'entreprise' && c.contact && (
                      <p className="text-xs" style={{ color: 'var(--text-2)' }}>Contact : {c.contact}</p>
                    )}
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.email}</p>
                    {c.demarcheur && (
                      <p className="text-xs" style={{ color: 'var(--primary)' }}>Apporté par {nomDemarcheur(c.demarcheur)}</p>
                    )}
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
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Fiche {selected.segment === 'entreprise' ? 'entreprise' : 'client'}</h2>
              <button onClick={() => setSelected(null)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-3">
              <div><p className="label">{selected.segment === 'entreprise' ? 'Nom de l\'entreprise' : 'Nom'}</p><p className="font-semibold" style={{ color: 'var(--text)' }}>{selected.nom}</p></div>
              {selected.segment === 'entreprise' && (
                <div><p className="label">Contact</p><p style={{ color: 'var(--text-2)' }}>{selected.contact || '—'}</p></div>
              )}
              <div><p className="label">Téléphone</p><p style={{ color: 'var(--text-2)' }}>{selected.telephone || '—'}</p></div>
              <div><p className="label">Email</p><p style={{ color: 'var(--text-2)' }}>{selected.email || '—'}</p></div>
              <div><p className="label">Segment</p><p style={{ color: 'var(--text-2)' }}>{SEG_LABELS[selected.segment] || selected.segment}</p></div>
              <div><p className="label">Adresse</p><p style={{ color: 'var(--text-2)' }}>{selected.adresse || '—'}</p></div>
              <div>
                <p className="label">Démarcheur</p>
                <p style={{ color: 'var(--text-2)' }}>
                  {selected.demarcheur
                    ? `${nomDemarcheur(selected.demarcheur)} · ${Number(selected.demarcheur.pourcentage)} %`
                    : '—'}
                </p>
              </div>
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

      {/* Nouveau client / entreprise */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{estEntreprise ? 'Nouvelle entreprise' : 'Nouveau client'}</h2>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Segment</label>
                  <select className="input" value={form.segment} onChange={e => setForm(p => ({...p, segment: e.target.value}))}>
                    {SEGMENTS.filter(s => s !== 'tous').map(s => <option key={s} value={s}>{SEG_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Démarcheur</label>
                  <select className="input" value={form.demarcheur_id} onChange={e => setForm(p => ({...p, demarcheur_id: e.target.value}))}>
                    <option value="">Aucun</option>
                    {demarcheurs.map(d => <option key={d.id} value={d.id}>{nomDemarcheur(d)} ({Number(d.pourcentage)} %)</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">{estEntreprise ? 'Nom de l\'entreprise *' : 'Nom complet *'}</label>
                <input className="input" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} />
              </div>
              {estEntreprise && (
                <div>
                  <label className="label">Contact</label>
                  <input className="input" placeholder="Personne à joindre" value={form.contact} onChange={e => setForm(p => ({...p, contact: e.target.value}))} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Téléphone</label>
                  <input className="input" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Adresse</label>
                <input className="input" value={form.adresse} onChange={e => setForm(p => ({...p, adresse: e.target.value}))} />
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

      {/* Démarcheurs */}
      {showDemarcheurs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Démarcheurs</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Commission estimée = pourcentage × montant des réservations de leurs clients</p>
              </div>
              <button onClick={() => setShowDemarcheurs(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>

            {/* Liste */}
            <div className="card overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: 'var(--bg-2)' }}>
                    <tr>
                      <th className="table-th">Démarcheur</th>
                      <th className="table-th">Téléphone</th>
                      <th className="table-th">%</th>
                      <th className="table-th">Clients</th>
                      <th className="table-th">Commission</th>
                      <th className="table-th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {demarcheurs.length === 0 ? (
                      <tr><td colSpan={6} className="table-td text-center py-6" style={{ color: 'var(--text-3)' }}>Aucun démarcheur</td></tr>
                    ) : demarcheurs.map(d => {
                      const s = statsDemarcheurs[d.id] || { clients: 0, ca: 0 }
                      return (
                        <tr key={d.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                          <td className="table-td font-medium" style={{ color: 'var(--text)' }}>{nomDemarcheur(d)}</td>
                          <td className="table-td" style={{ color: 'var(--text-2)' }}>{d.telephone || '—'}</td>
                          <td className="table-td" style={{ color: 'var(--text-2)' }}>{Number(d.pourcentage)} %</td>
                          <td className="table-td" style={{ color: 'var(--text-2)' }}>{s.clients}</td>
                          <td className="table-td" style={{ color: 'var(--text-2)' }}>{fcfa(s.ca * Number(d.pourcentage) / 100)}</td>
                          <td className="table-td">
                            <button onClick={() => supprimerDemarcheur(d)} className="text-xs hover:underline" style={{ color: '#DC2626' }}>Supprimer</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ajout */}
            <p className="label mb-2">Ajouter un démarcheur</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nom *</label>
                <input className="input" value={dform.nom} onChange={e => setDform(p => ({...p, nom: e.target.value}))} />
              </div>
              <div>
                <label className="label">Prénom</label>
                <input className="input" value={dform.prenom} onChange={e => setDform(p => ({...p, prenom: e.target.value}))} />
              </div>
              <div>
                <label className="label">Numéro</label>
                <input className="input" value={dform.telephone} onChange={e => setDform(p => ({...p, telephone: e.target.value}))} />
              </div>
              <div>
                <label className="label">Pourcentage (%)</label>
                <input className="input" type="number" min="0" max="100" step="0.5" value={dform.pourcentage}
                  onChange={e => setDform(p => ({...p, pourcentage: e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowDemarcheurs(false)} className="btn-secondary flex-1">Fermer</button>
              <button onClick={saveDemarcheur} disabled={savingDemarcheur || !dform.nom.trim()} className="btn-primary flex-1">
                {savingDemarcheur ? '...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
