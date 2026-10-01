'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, formatFCFA } from '@/lib/utils'

const STATUTS = { brouillon: 'Brouillon', envoye: 'Envoyé', paye: 'Payé', partiel: 'Partiel', impaye: 'Impayé' }
const STATUT_COLORS = { brouillon: 'bg-gray-100 text-gray-600', envoye: 'bg-blue-100 text-blue-700', paye: 'bg-green-100 text-green-800', partiel: 'bg-yellow-100 text-yellow-800', impaye: 'bg-red-100 text-red-700' }
const EMPTY = { numero: '', nom_client: '', telephone: '', type_prestation: 'sejour', description: '', montant_total: '', montant_paye: '', statut: 'brouillon', date_echeance: '' }

export default function Facturation() {
  const supabase = createClient()
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [filterStatut])

  async function load() {
    setLoading(true)
    let q = supabase.from('factures').select('*').order('created_at', { ascending: false })
    if (filterStatut !== 'tous') q = q.eq('statut', filterStatut)
    const { data } = await q
    setFactures(data || [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const numero = form.numero || `FAC-${Date.now().toString().slice(-6)}`
    const payload = { ...form, numero, montant_total: form.montant_total ? parseInt(form.montant_total) : null, montant_paye: form.montant_paye ? parseInt(form.montant_paye) : 0 }
    await supabase.from('factures').insert([payload])
    setShowForm(false); setForm(EMPTY); load()
    setSaving(false)
  }

  async function updateStatut(id, statut) {
    await supabase.from('factures').update({ statut }).eq('id', id)
    load()
  }

  const totalPaye = factures.filter(f => f.statut === 'paye').reduce((s, f) => s + (f.montant_total || 0), 0)
  const totalImpaye = factures.filter(f => ['impaye', 'partiel', 'envoye'].includes(f.statut)).reduce((s, f) => s + ((f.montant_total || 0) - (f.montant_paye || 0)), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Facturation & Paiements</h1>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }} className="btn-primary">+ Nouvelle facture</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Encaissé ce mois</p>
          <p className="text-2xl font-bold text-green-600">{formatFCFA(totalPaye)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Impayés en attente</p>
          <p className="text-2xl font-bold text-red-600">{formatFCFA(totalImpaye)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['tous', ...Object.keys(STATUTS)].map(s => (
          <button key={s} onClick={() => setFilterStatut(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterStatut === s ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {s === 'tous' ? 'Toutes' : STATUTS[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">N°</th>
                <th className="table-th">Client</th>
                <th className="table-th">Prestation</th>
                <th className="table-th">Montant</th>
                <th className="table-th">Payé</th>
                <th className="table-th">Échéance</th>
                <th className="table-th">Statut</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="table-td text-center text-gray-400 py-10">Chargement...</td></tr>
              ) : factures.length === 0 ? (
                <tr><td colSpan={8} className="table-td text-center text-gray-400 py-10">Aucune facture</td></tr>
              ) : factures.map(f => (
                <tr key={f.id} className="hover:bg-gray-50/50">
                  <td className="table-td font-mono text-xs">{f.numero}</td>
                  <td className="table-td">
                    <p className="font-medium">{f.nom_client}</p>
                    <p className="text-xs text-gray-400">{f.telephone}</p>
                  </td>
                  <td className="table-td text-gray-500 text-xs">{f.type_prestation}</td>
                  <td className="table-td font-semibold">{formatFCFA(f.montant_total)}</td>
                  <td className="table-td text-green-600">{formatFCFA(f.montant_paye)}</td>
                  <td className="table-td text-gray-400">{formatDate(f.date_echeance)}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUT_COLORS[f.statut]}`}>{STATUTS[f.statut]}</span>
                  </td>
                  <td className="table-td">
                    <select value={f.statut} onChange={e => updateStatut(f.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500">
                      {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Nouvelle facture</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div><label className="label">N° facture (auto si vide)</label><input className="input" value={form.numero} onChange={e => setForm(p => ({...p, numero: e.target.value}))} placeholder="FAC-001" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Client *</label><input className="input" value={form.nom_client} onChange={e => setForm(p => ({...p, nom_client: e.target.value}))} /></div>
                <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} /></div>
              </div>
              <div><label className="label">Type de prestation</label>
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
                <div><label className="label">Statut</label>
                  <select className="input" value={form.statut} onChange={e => setForm(p => ({...p, statut: e.target.value}))}>
                    {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom_client} className="btn-primary flex-1">{saving ? '...' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
