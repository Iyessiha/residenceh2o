'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { nomDemarcheur } from '@/lib/demarcheurs'

const FILTRES = [
  { key: 'tous', label: 'Tous' },
  { key: 'particulier', label: 'Particuliers' },
  { key: 'entreprise', label: 'Entreprises' },
]
const TYPE_LABELS = { particulier: 'Particulier', entreprise: 'Entreprise' }
const EMPTY = { type: 'particulier', nom: '', telephone: '', email: '', adresse: '', notes: '', entreprise_id: '', demarcheur_id: '' }

const SELECT_CLIENTS = '*, reservations(count), demarcheur:demarcheurs(id, nom, prenom, taux_commission), entreprise:entreprises(id, nom, contact, adresse)'

function exportCSV(clients) {
  const headers = ['Nom', 'Type', 'Entreprise', 'Contact', 'Téléphone', 'Email', 'Adresse', 'Apporté par', 'Notes', 'Nb séjours', 'Client depuis']
  const rows = clients.map(c => [
    c.nom || '',
    TYPE_LABELS[c.type] || c.type || '',
    c.entreprise?.nom || '',
    c.entreprise?.contact || '',
    c.telephone || '',
    c.email || '',
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
  const [entreprises, setEntreprises] = useState([])
  const [demarcheurs, setDemarcheurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('tous')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: cli }, { data: ent }, { data: dem }] = await Promise.all([
      supabase.from('clients').select(SELECT_CLIENTS).order('nom'),
      supabase.from('entreprises').select('id, nom, contact, adresse').order('nom'),
      supabase.from('demarcheurs').select('id, nom, prenom, taux_commission').order('nom'),
    ])
    setClients(cli || [])
    setEntreprises(ent || [])
    setDemarcheurs(dem || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setForm(EMPTY); setEditId(null); setErreur(null); setShowForm(true)
  }

  function openEdit(c) {
    setForm({
      type: c.type || 'particulier',
      nom: c.type === 'entreprise' ? '' : (c.nom || ''),
      telephone: c.telephone || '',
      email: c.email || '',
      adresse: c.type === 'entreprise' ? '' : (c.adresse || ''),
      notes: c.notes || '',
      entreprise_id: c.entreprise_id || '',
      demarcheur_id: c.demarcheur_id || '',
    })
    setEditId(c.id); setErreur(null); setSelected(null); setShowForm(true)
  }

  const estEntreprise = form.type === 'entreprise'
  const entrepriseChoisie = entreprises.find(e => e.id === form.entreprise_id)

  async function save() {
    setErreur(null)
    if (estEntreprise && !entrepriseChoisie) { setErreur('Choisissez une entreprise ou créez-la d\'abord.'); return }
    if (!estEntreprise && !form.nom.trim()) { setErreur('Le nom du client est obligatoire.'); return }

    // Pour une entreprise, le nom, le contact et l'adresse viennent de la fiche entreprise
    const payload = {
      type: form.type,
      segment: form.type, // colonne historique, gardée cohérente avec le type
      nom: estEntreprise ? entrepriseChoisie.nom : form.nom.trim(),
      contact: estEntreprise ? (entrepriseChoisie.contact || '') : '',
      adresse: estEntreprise ? (entrepriseChoisie.adresse || '') : form.adresse.trim(),
      telephone: form.telephone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
      entreprise_id: estEntreprise ? entrepriseChoisie.id : null,
      demarcheur_id: form.demarcheur_id || null,
    }

    setSaving(true)
    const { error } = editId
      ? await supabase.from('clients').update(payload).eq('id', editId)
      : await supabase.from('clients').insert([payload])
    setSaving(false)
    if (error) { setErreur(error.message); return }
    setShowForm(false); setForm(EMPTY); setEditId(null)
    load()
  }

  const filtered = clients.filter(c => {
    if (filtre !== 'tous' && c.type !== filtre) return false
    if (!search) return true
    const s = search.toLowerCase()
    return c.nom?.toLowerCase().includes(s) || c.telephone?.includes(search) || c.entreprise?.nom?.toLowerCase().includes(s)
  })

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
          <Link href="/dashboard/entreprises"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}>
            🏢 Entreprises
          </Link>
          <Link href="/dashboard/demarcheurs"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}>
            🤝 Démarcheurs
          </Link>
          <button onClick={openNew} className="btn-primary">+ Nouveau client</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTRES.map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filtre === f.key ? 'text-white' : 'border hover:opacity-80'}`}
            style={filtre === f.key ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
            {f.label}
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
                <th className="table-th">Type</th>
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
                    {c.type === 'entreprise' && c.entreprise?.contact && (
                      <p className="text-xs" style={{ color: 'var(--text-2)' }}>Contact : {c.entreprise.contact}</p>
                    )}
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.email}</p>
                    {c.demarcheur && (
                      <p className="text-xs" style={{ color: 'var(--primary)' }}>Apporté par {nomDemarcheur(c.demarcheur)}</p>
                    )}
                  </td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{c.telephone}</td>
                  <td className="table-td">
                    <span className={`badge ${c.type === 'entreprise' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[c.type] || c.type}
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

      {/* Fiche (volet latéral) */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-sm h-full overflow-y-auto p-6 shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Fiche {selected.type === 'entreprise' ? 'entreprise' : 'client'}</h2>
              <button onClick={() => setSelected(null)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-3">
              <div><p className="label">{selected.type === 'entreprise' ? 'Entreprise' : 'Nom'}</p><p className="font-semibold" style={{ color: 'var(--text)' }}>{selected.nom}</p></div>
              {selected.type === 'entreprise' && (
                <>
                  <div><p className="label">Contact</p><p style={{ color: 'var(--text-2)' }}>{selected.entreprise?.contact || '—'}</p></div>
                  <div><p className="label">Adresse</p><p style={{ color: 'var(--text-2)' }}>{selected.entreprise?.adresse || selected.adresse || '—'}</p></div>
                </>
              )}
              <div><p className="label">Téléphone</p><p style={{ color: 'var(--text-2)' }}>{selected.telephone || '—'}</p></div>
              <div><p className="label">Email</p><p style={{ color: 'var(--text-2)' }}>{selected.email || '—'}</p></div>
              {selected.type !== 'entreprise' && (
                <div><p className="label">Adresse</p><p style={{ color: 'var(--text-2)' }}>{selected.adresse || '—'}</p></div>
              )}
              <div>
                <p className="label">Apporté par</p>
                <p style={{ color: 'var(--text-2)' }}>
                  {selected.demarcheur
                    ? <Link href={`/dashboard/demarcheurs/${selected.demarcheur.id}`} className="hover:underline" style={{ color: 'var(--primary)' }}>
                        {nomDemarcheur(selected.demarcheur)} · {Number(selected.demarcheur.taux_commission)} %
                      </Link>
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
              <button onClick={() => openEdit(selected)} className="flex-1 btn-secondary">Modifier</button>
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-3 text-sm hover:underline" style={{ color: 'var(--text-3)' }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Création / modification */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editId ? 'Modifier le client' : estEntreprise ? 'Nouveau client entreprise' : 'Nouveau client'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Type de client</label>
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                  {[['particulier', 'Particulier'], ['entreprise', 'Entreprise']].map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => setForm(p => ({ ...p, type: val }))}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={form.type === val
                        ? { backgroundColor: 'var(--primary)', color: '#fff' }
                        : { backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {estEntreprise ? (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label">Entreprise *</label>
                    <Link href="/dashboard/entreprises" className="text-xs hover:underline" style={{ color: 'var(--primary)' }}>+ Gérer les entreprises</Link>
                  </div>
                  <select className="input" value={form.entreprise_id} onChange={e => setForm(p => ({ ...p, entreprise_id: e.target.value }))}>
                    <option value="">— Choisir une entreprise —</option>
                    {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom}{e.contact ? ` (${e.contact})` : ''}</option>)}
                  </select>
                  {entrepriseChoisie?.adresse && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{entrepriseChoisie.adresse}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="label">Nom complet *</label>
                  <input className="input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Téléphone</label>
                  <input className="input" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>

              {!estEntreprise && (
                <div>
                  <label className="label">Adresse</label>
                  <input className="input" value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Apporté par <span className="font-normal" style={{ color: 'var(--text-3)' }}>(optionnel)</span></label>
                  <Link href="/dashboard/demarcheurs" className="text-xs hover:underline" style={{ color: 'var(--primary)' }}>+ Démarcheurs</Link>
                </div>
                <select className="input" value={form.demarcheur_id} onChange={e => setForm(p => ({ ...p, demarcheur_id: e.target.value }))}>
                  <option value="">Aucun</option>
                  {demarcheurs.map(d => <option key={d.id} value={d.id}>{nomDemarcheur(d)} ({Number(d.taux_commission)} %)</option>)}
                </select>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            {erreur && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4">{erreur}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? '...' : editId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
