'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatFCFA, formatDate } from '@/lib/utils'
import { useRole, estGestion } from '@/lib/useRole'

const CAT_DEPENSES = [
  'Salaires', 'Achats restaurant & bar', 'Boutique (achat marchandises)', 'Électricité', 'Eau', 'Internet & téléphone',
  'Entretien & réparations', 'Fournitures & produits ménagers', 'Carburant & transport', 'Marketing & publicité',
  'Impôts & taxes', 'Loyer', 'Assurances', 'Frais bancaires', 'Commissions démarcheurs', 'Autre',
]
const CAT_RECETTES = ['Apport / capital', 'Remboursement', 'Prestation diverse', 'Subvention', 'Autre recette']
const PAIEMENTS = { especes: 'Espèces', mobile_money: 'Mobile Money', virement: 'Virement', cheque: 'Chèque', carte: 'Carte' }
const PERIODES = [['mois', 'Ce mois'], ['mois_prec', 'Mois dernier'], ['trimestre', '3 mois'], ['annee', 'Cette année'], ['tout', 'Tout']]

const iso = (d) => d.toISOString().slice(0, 10)
// Bornes de la période (AAAA-MM-JJ) ; null = sans limite
function plage(p) {
  const n = new Date()
  const y = n.getFullYear(), m = n.getMonth()
  const fin = (annee, mois) => iso(new Date(Date.UTC(annee, mois + 1, 0)))
  const debut = (annee, mois) => iso(new Date(Date.UTC(annee, mois, 1)))
  if (p === 'mois') return { du: debut(y, m), au: fin(y, m) }
  if (p === 'mois_prec') return { du: debut(y, m - 1), au: fin(y, m - 1) }
  if (p === 'trimestre') return { du: debut(y, m - 2), au: fin(y, m) }
  if (p === 'annee') return { du: `${y}-01-01`, au: `${y}-12-31` }
  return { du: null, au: null }
}

const VIDE = (type) => ({ type, date: iso(new Date()), categorie: type === 'depense' ? CAT_DEPENSES[0] : CAT_RECETTES[0], libelle: '', montant: '', mode_paiement: 'especes', beneficiaire: '', reference: '' })

export default function Tresorerie() {
  const supabase = createClient()
  const role = useRole()
  const [periode, setPeriode] = useState('mois')
  const [typeFiltre, setTypeFiltre] = useState('tous')
  const [mouvements, setMouvements] = useState([])
  const [encaisse, setEncaisse] = useState({ factures: 0, boutique: 0 })
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState(null)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (estGestion(role)) charger() }, [role, periode])

  async function charger() {
    setLoading(true); setErreur('')
    const { du, au } = plage(periode)
    let q = supabase.from('tresorerie').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }).limit(2000)
    if (du) q = q.gte('date', du)
    if (au) q = q.lte('date', au)
    // Encaissements clients : montants réglés des factures et ventes boutique payées de la période
    let qf = supabase.from('factures').select('montant_paye').neq('statut', 'brouillon').limit(5000)
    let qv = supabase.from('ventes').select('montant_total').eq('statut', 'payee').limit(5000)
    if (du) { qf = qf.gte('created_at', `${du}T00:00:00`); qv = qv.gte('created_at', `${du}T00:00:00`) }
    if (au) { const lendemain = iso(new Date(new Date(`${au}T00:00:00Z`).getTime() + 86400000)); qf = qf.lt('created_at', `${lendemain}T00:00:00`); qv = qv.lt('created_at', `${lendemain}T00:00:00`) }
    const [m, f, v] = await Promise.all([q, qf, qv])
    if (m.error) setErreur(m.error.message)
    setMouvements(m.data || [])
    setEncaisse({
      factures: (f.data || []).reduce((s, x) => s + (x.montant_paye || 0), 0),
      boutique: (v.data || []).reduce((s, x) => s + (x.montant_total || 0), 0),
    })
    setLoading(false)
  }

  const depenses = mouvements.filter(m => m.type === 'depense')
  const recettes = mouvements.filter(m => m.type === 'recette')
  const totalDepenses = depenses.reduce((s, m) => s + m.montant, 0)
  const totalRecettes = recettes.reduce((s, m) => s + m.montant, 0)
  const totalEncaisse = encaisse.factures + encaisse.boutique
  const solde = totalEncaisse + totalRecettes - totalDepenses

  const parCategorie = useMemo(() => {
    const acc = {}
    depenses.forEach(m => { acc[m.categorie] = (acc[m.categorie] || 0) + m.montant })
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [mouvements])

  const liste = mouvements.filter(m => typeFiltre === 'tous' || m.type === typeFiltre)

  function ouvrir(type) { setEditId(null); setErreur(''); setForm(VIDE(type)) }
  function modifier(m) {
    setEditId(m.id); setErreur('')
    setForm({ type: m.type, date: m.date, categorie: m.categorie, libelle: m.libelle, montant: m.montant, mode_paiement: m.mode_paiement, beneficiaire: m.beneficiaire || '', reference: m.reference || '' })
  }
  async function enregistrer() {
    const montant = parseInt(form.montant) || 0
    if (!form.libelle.trim()) { setErreur('Indiquez un libellé.'); return }
    if (montant <= 0) { setErreur('Le montant doit être supérieur à 0.'); return }
    setSaving(true); setErreur('')
    const payload = { type: form.type, date: form.date, categorie: form.categorie, libelle: form.libelle.trim(), montant,
      mode_paiement: form.mode_paiement, beneficiaire: form.beneficiaire.trim(), reference: form.reference.trim() }
    const { error } = editId
      ? await supabase.from('tresorerie').update(payload).eq('id', editId)
      : await supabase.from('tresorerie').insert([payload])
    setSaving(false)
    if (error) { setErreur(error.message); return }
    setForm(null); setEditId(null); charger()
  }
  async function supprimer(m) {
    if (!window.confirm(`Supprimer « ${m.libelle} » (${formatFCFA(m.montant)}) ? Cette action est irréversible.`)) return
    const { error } = await supabase.from('tresorerie').delete().eq('id', m.id)
    if (error) { window.alert(error.message); return }
    charger()
  }

  function exporterCSV() {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lignes = [['Date', 'Type', 'Catégorie', 'Libellé', 'Bénéficiaire', 'Référence', 'Mode de paiement', 'Montant (FCFA)']]
    liste.forEach(m => lignes.push([m.date, m.type === 'depense' ? 'Dépense' : 'Recette', m.categorie, m.libelle, m.beneficiaire, m.reference, PAIEMENTS[m.mode_paiement], m.type === 'depense' ? -m.montant : m.montant]))
    const blob = new Blob(['﻿' + lignes.map(l => l.map(esc).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `tresorerie-${periode}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 10000)
  }

  if (role === undefined) return <p style={{ color: 'var(--text-3)' }}>Chargement…</p>
  if (!estGestion(role)) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Trésorerie</h1>
        <p style={{ color: 'var(--text-3)' }}>Cette page est réservée à la gérance et à l'administration.</p>
      </div>
    )
  }

  const maj = (champ) => (e) => setForm(f => ({ ...f, [champ]: e.target.value }))
  const categories = form?.type === 'depense' ? CAT_DEPENSES : CAT_RECETTES
  const maxCat = parCategorie[0]?.[1] || 1

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Trésorerie</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Dépenses, recettes et solde</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exporterCSV} className="btn-secondary" disabled={liste.length === 0}>Exporter (CSV)</button>
          <button onClick={() => ouvrir('recette')} className="btn-secondary">+ Recette</button>
          <button onClick={() => ouvrir('depense')} className="btn-primary">+ Dépense</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PERIODES.map(([k, l]) => (
          <button key={k} onClick={() => setPeriode(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${periode === k ? 'text-white' : 'border hover:opacity-80'}`}
            style={periode === k ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Encaissements clients</p>
          <p className="text-xl font-bold text-green-600">{formatFCFA(totalEncaisse)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Factures {formatFCFA(encaisse.factures)} · Boutique {formatFCFA(encaisse.boutique)}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Autres recettes</p>
          <p className="text-xl font-bold text-green-600">{formatFCFA(totalRecettes)}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Dépenses</p>
          <p className="text-xl font-bold text-red-600">{formatFCFA(totalDepenses)}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Solde de la période</p>
          <p className="text-xl font-bold" style={{ color: solde < 0 ? '#DC2626' : 'var(--primary)' }}>{formatFCFA(solde)}</p></div>
      </div>
      <p className="text-xs mb-6" style={{ color: 'var(--text-3)' }}>
        Les encaissements clients sont calculés à la date des factures et des ventes boutique payées. Les salaires apparaissent en dépenses dès qu'une fiche de paie est payée.
      </p>

      {erreur && !form && <p className="text-sm mb-3" style={{ color: '#DC2626' }}>{erreur}</p>}

      {parCategorie.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Dépenses par catégorie</h2>
          {parCategorie.map(([cat, montant]) => (
            <div key={cat} className="mb-2">
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-2)' }}>{cat}</span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{formatFCFA(montant)} <span className="text-xs" style={{ color: 'var(--text-3)' }}>({Math.round((montant / totalDepenses) * 100)} %)</span></span></div>
              <div className="h-2 rounded-full mt-1" style={{ backgroundColor: 'var(--bg-2)' }}>
                <div className="h-2 rounded-full" style={{ width: `${(montant / maxCat) * 100}%`, backgroundColor: 'var(--primary)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        {[['tous', 'Tout'], ['depense', 'Dépenses'], ['recette', 'Recettes']].map(([k, l]) => (
          <button key={k} onClick={() => setTypeFiltre(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${typeFiltre === k ? 'text-white' : 'border hover:opacity-80'}`}
            style={typeFiltre === k ? { backgroundColor: '#0C3A3D' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>{l}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr><th className="table-th">Date</th><th className="table-th">Catégorie</th><th className="table-th">Libellé</th>
                <th className="table-th">Bénéficiaire</th><th className="table-th">Paiement</th><th className="table-th text-right">Montant</th><th className="table-th"></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement…</td></tr>
              ) : liste.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Aucun mouvement sur cette période</td></tr>
              ) : liste.map(m => (
                <tr key={m.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td text-xs whitespace-nowrap" style={{ color: 'var(--text-3)' }}>{formatDate(m.date)}</td>
                  <td className="table-td text-xs" style={{ color: 'var(--text-2)' }}>{m.categorie}</td>
                  <td className="table-td"><p className="font-medium" style={{ color: 'var(--text)' }}>{m.libelle}</p>
                    {m.reference && <p className="text-xs" style={{ color: 'var(--text-3)' }}>Réf. {m.reference}</p>}</td>
                  <td className="table-td text-xs" style={{ color: 'var(--text-2)' }}>{m.beneficiaire || '—'}</td>
                  <td className="table-td text-xs" style={{ color: 'var(--text-3)' }}>{PAIEMENTS[m.mode_paiement]}</td>
                  <td className="table-td text-right font-semibold whitespace-nowrap" style={{ color: m.type === 'depense' ? '#DC2626' : '#16A34A' }}>
                    {m.type === 'depense' ? '−' : '+'} {formatFCFA(m.montant)}</td>
                  <td className="table-td">
                    {m.source === 'paie' ? (
                      <span className="text-xs" style={{ color: 'var(--text-3)' }} title="À annuler depuis la fiche de paie">Salaire</span>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => modifier(m)} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}>Modifier</button>
                        <button onClick={() => supprimer(m)} title="Supprimer" aria-label={`Supprimer ${m.libelle}`} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                          style={{ borderColor: '#FECACA', color: '#DC2626', backgroundColor: 'var(--bg)' }}>🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[92vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editId ? 'Modifier' : 'Nouvelle'} {form.type === 'depense' ? 'dépense' : 'recette'}</h2>
              <button onClick={() => setForm(null)} className="text-xl" style={{ color: 'var(--text-3)' }} aria-label="Fermer">×</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Date</label><input className="input" type="date" value={form.date} onChange={maj('date')} /></div>
                <div><label className="label">Montant (FCFA) *</label><input className="input" type="number" min="1" value={form.montant} onChange={maj('montant')} /></div>
              </div>
              <div><label className="label">Catégorie</label>
                <select className="input" value={form.categorie} onChange={maj('categorie')}>
                  {[...new Set([...categories, form.categorie])].map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div><label className="label">Libellé *</label><input className="input" value={form.libelle} onChange={maj('libelle')} placeholder={form.type === 'depense' ? 'Facture CIE octobre, achat poulets…' : 'Description'} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{form.type === 'depense' ? 'Bénéficiaire / fournisseur' : 'Payeur'}</label><input className="input" value={form.beneficiaire} onChange={maj('beneficiaire')} /></div>
                <div><label className="label">N° facture / reçu</label><input className="input" value={form.reference} onChange={maj('reference')} /></div>
              </div>
              <div><label className="label">Mode de paiement</label>
                <select className="input" value={form.mode_paiement} onChange={maj('mode_paiement')}>
                  {Object.entries(PAIEMENTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select></div>
            </div>
            {erreur && <p className="text-sm mt-3" style={{ color: '#DC2626' }}>{erreur}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setForm(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={enregistrer} disabled={saving} className="btn-primary flex-1">{saving ? '…' : editId ? 'Mettre à jour' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
