'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, formatFCFA } from '@/lib/utils'

const STATUTS = { brouillon: 'Brouillon', envoye: 'Envoyé', paye: 'Payé', partiel: 'Partiel', impaye: 'Impayé' }
const STATUT_COLORS = { brouillon: 'bg-gray-100 text-gray-600', envoye: 'bg-blue-100 text-blue-700', paye: 'bg-green-100 text-green-800', partiel: 'bg-yellow-100 text-yellow-800', impaye: 'bg-red-100 text-red-700' }
const EMPTY = { numero: '', nom_client: '', telephone: '', type_prestation: 'sejour', description: '', montant_total: '', montant_paye: '', statut: 'brouillon', date_echeance: '', reservation_id: '' }

export default function Facturation() {
  const supabase = createClient()
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(null)
  const [reservations, setReservations] = useState([])

  useEffect(() => { load() }, [filterStatut])

  useEffect(() => {
    supabase.from('reservations').select('id, nom_client, duplex_id, date_arrivee').order('created_at', { ascending: false }).limit(50).then(({ data }) => setReservations(data || []))
  }, [])

  async function load() {
    setLoading(true)
    let q = supabase.from('factures').select('*').order('created_at', { ascending: false })
    if (filterStatut !== 'tous') q = q.eq('statut', filterStatut)
    const { data } = await q
    setFactures(data || [])
    setLoading(false)
  }

  async function openNewForm() {
    // Récupère le prochain numéro séquentiel avant d'ouvrir le formulaire
    try {
      const res = await fetch('/api/factures/next-numero')
      const json = await res.json()
      setForm({ ...EMPTY, numero: json.numero || '' })
    } catch {
      setForm(EMPTY)
    }
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    setSaveError('')
    const payload = {
      ...form,
      montant_total: parseInt(form.montant_total) || 0,
      montant_paye:  parseInt(form.montant_paye)  || 0,
    }
    const { error } = await supabase.from('factures').insert([payload])
    if (error) {
      setSaveError('Erreur : ' + error.message)
      setSaving(false)
      return
    }
    setShowForm(false); setForm(EMPTY); setSaveError(''); load()
    setSaving(false)
  }

  async function updateStatut(id, statut) {
    await supabase.from('factures').update({ statut }).eq('id', id)
    load()
  }

  async function downloadPDF(facture) {
    setPdfLoading(facture.id)
    try {
      const guestUrl = facture.reservation_id
        ? `${window.location.origin}/guest/${facture.reservation_id}`
        : null
      const res = await fetch(`/api/factures/${facture.id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...facture, _guestUrl: guestUrl }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Erreur serveur')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${facture.numero || 'facture'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Impossible de générer le PDF : ' + err.message)
    } finally {
      setPdfLoading(null)
    }
  }

  const totalPaye = factures.filter(f => f.statut === 'paye').reduce((s, f) => s + (f.montant_total || 0), 0)
  const totalImpaye = factures.filter(f => ['impaye', 'partiel', 'envoye'].includes(f.statut)).reduce((s, f) => s + ((f.montant_total || 0) - (f.montant_paye || 0)), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Facturation & Paiements</h1>
        <button onClick={openNewForm} className="btn-primary">+ Nouvelle facture</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Encaissé ce mois</p>
          <p className="text-2xl font-bold text-green-600">{formatFCFA(totalPaye)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Impayés en attente</p>
          <p className="text-2xl font-bold text-red-600">{formatFCFA(totalImpaye)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['tous', ...Object.keys(STATUTS)].map(s => (
          <button key={s} onClick={() => setFilterStatut(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterStatut === s ? 'text-white' : 'border hover:opacity-80'}`}
            style={filterStatut === s ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
            {s === 'tous' ? 'Toutes' : STATUTS[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">N°</th>
                <th className="table-th">Client</th>
                <th className="table-th">Prestation</th>
                <th className="table-th">Montant</th>
                <th className="table-th">Payé</th>
                <th className="table-th">Échéance</th>
                <th className="table-th">Statut</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement...</td></tr>
              ) : factures.length === 0 ? (
                <tr><td colSpan={8} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Aucune facture</td></tr>
              ) : factures.map(f => (
                <tr key={f.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td font-mono text-xs" style={{ color: 'var(--text-2)' }}>{f.numero}</td>
                  <td className="table-td">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>{f.nom_client}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{f.telephone}</p>
                  </td>
                  <td className="table-td text-xs" style={{ color: 'var(--text-3)' }}>{f.type_prestation}</td>
                  <td className="table-td font-semibold" style={{ color: 'var(--text)' }}>{formatFCFA(f.montant_total)}</td>
                  <td className="table-td text-green-600">{formatFCFA(f.montant_paye)}</td>
                  <td className="table-td" style={{ color: 'var(--text-3)' }}>{formatDate(f.date_echeance)}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUT_COLORS[f.statut]}`}>{STATUTS[f.statut]}</span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <select value={f.statut} onChange={e => updateStatut(f.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1 focus:outline-none"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                        {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <button
                        onClick={() => downloadPDF(f)}
                        disabled={pdfLoading === f.id}
                        title="Télécharger PDF"
                        className="flex items-center justify-center w-7 h-7 rounded transition-opacity hover:opacity-70 disabled:opacity-40"
                        style={{ backgroundColor: 'var(--primary-lt)', color: 'var(--primary)' }}
                        aria-label={`Télécharger PDF de ${f.numero}`}
                      >
                        {pdfLoading === f.id ? (
                          <span className="text-xs animate-spin">⟳</span>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        )}
                      </button>
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
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Nouvelle facture</h2>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">N° facture</label>
                <input className="input" value={form.numero} onChange={e => setForm(p => ({...p, numero: e.target.value}))} placeholder="FAC-2026-001" />
              </div>
              <div>
                <label className="label">Réservation liée (QR code)</label>
                <select className="input" value={form.reservation_id} onChange={e => {
                  const res = reservations.find(r => r.id === e.target.value)
                  setForm(p => ({
                    ...p,
                    reservation_id: e.target.value,
                    nom_client: res?.nom_client || p.nom_client,
                  }))
                }}>
                  <option value="">— Aucune —</option>
                  {reservations.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nom_client} · {r.duplex_id || '?'} · {r.date_arrivee || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Client *</label><input className="input" value={form.nom_client} onChange={e => setForm(p => ({...p, nom_client: e.target.value}))} /></div>
                <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} /></div>
              </div>
              <div>
                <label className="label">Type de prestation</label>
                <select className="input" value={form.type_prestation} onChange={e => setForm(p => ({...p, type_prestation: e.target.value}))}>
                  <option value="sejour">Séjour duplex</option>
                  <option value="evenement">Événement / Pergola</option>
                  <option value="restauration">Restauration</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Montant total (FCFA)</label><input className="input" type="number" value={form.montant_total} onChange={e => setForm(p => ({...p, montant_total: e.target.value}))} /></div>
                <div><label className="label">Déjà payé (FCFA)</label><input className="input" type="number" value={form.montant_paye} onChange={e => setForm(p => ({...p, montant_paye: e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Échéance</label><input className="input" type="date" value={form.date_echeance} onChange={e => setForm(p => ({...p, date_echeance: e.target.value}))} /></div>
                <div>
                  <label className="label">Statut</label>
                  <select className="input" value={form.statut} onChange={e => setForm(p => ({...p, statut: e.target.value}))}>
                    {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {saveError && (
              <p className="text-sm text-red-600 mt-3 font-medium">{saveError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom_client} className="btn-primary flex-1">{saving ? '...' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
