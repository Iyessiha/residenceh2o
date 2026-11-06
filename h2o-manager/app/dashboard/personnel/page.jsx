'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatFCFA, formatDate } from '@/lib/utils'
import { useRole, estGestion } from '@/lib/useRole'

const SERVICES = {
  direction: 'Direction', reception: 'Réception', restauration: 'Restauration', bar: 'Bar', menage: 'Ménage',
  entretien: 'Entretien', securite: 'Sécurité', administration: 'Administration', autre: 'Autre',
}
const CONTRATS = { cdi: 'CDI', cdd: 'CDD', journalier: 'Journalier', stage: 'Stage', prestataire: 'Prestataire' }
const PAIEMENTS = { especes: 'Espèces', mobile_money: 'Mobile Money', virement: 'Virement', cheque: 'Chèque' }

const VIDE = {
  nom: '', prenom: '', poste: '', service: 'autre', type_contrat: 'cdi', date_embauche: '', date_fin: '',
  telephone: '', email: '', numero_cnps: '', mode_paiement: 'especes', numero_paiement: '',
  salaire_base: '', indemnites: [], actif: true, notes: '',
}

const totalIndemnites = (e) => (e.indemnites || []).reduce((s, i) => s + (Number(i.montant) || 0), 0)

export default function Personnel() {
  const supabase = createClient()
  const role = useRole()
  const [employes, setEmployes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState('actifs')       // actifs | archives | tous
  const [service, setService] = useState('tous')
  const [recherche, setRecherche] = useState('')
  const [form, setForm] = useState(null)               // null = fermé
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (estGestion(role)) charger() }, [role])

  async function charger() {
    setLoading(true)
    const { data, error } = await supabase.from('employes').select('*').order('nom')
    if (error) setErreur(error.message)
    setEmployes(data || [])
    setLoading(false)
  }

  function ouvrirCreation() { setEditId(null); setForm({ ...VIDE, indemnites: [] }); setErreur('') }
  function ouvrirEdition(e) {
    setEditId(e.id); setErreur('')
    setForm({
      ...VIDE, ...e,
      date_embauche: e.date_embauche || '', date_fin: e.date_fin || '', notes: e.notes || '',
      salaire_base: e.salaire_base ?? '', indemnites: (e.indemnites || []).map(i => ({ ...i })),
    })
  }

  async function enregistrer() {
    if (!form.nom.trim()) { setErreur('Le nom est obligatoire.'); return }
    setSaving(true); setErreur('')
    const payload = {
      nom: form.nom.trim(), prenom: form.prenom.trim(), poste: form.poste.trim(),
      service: form.service, type_contrat: form.type_contrat,
      date_embauche: form.date_embauche || null, date_fin: form.date_fin || null,
      telephone: form.telephone.trim(), email: form.email.trim(), numero_cnps: form.numero_cnps.trim(),
      mode_paiement: form.mode_paiement, numero_paiement: form.numero_paiement.trim(),
      salaire_base: Math.max(0, parseInt(form.salaire_base) || 0),
      indemnites: (form.indemnites || [])
        .filter(i => i.nom?.trim() && Number(i.montant) > 0)
        .map(i => ({ nom: i.nom.trim(), montant: Math.round(Number(i.montant)) })),
      actif: form.actif, notes: form.notes?.trim() || null,
    }
    const { error } = editId
      ? await supabase.from('employes').update(payload).eq('id', editId)
      : await supabase.from('employes').insert([payload])
    setSaving(false)
    if (error) { setErreur(error.message); return }
    setForm(null); setEditId(null); charger()
  }

  async function basculerActif(e) {
    const { error } = await supabase.from('employes').update({ actif: !e.actif }).eq('id', e.id)
    if (error) { window.alert(error.message); return }
    charger()
  }

  async function supprimer(e) {
    const nom = `${e.prenom} ${e.nom}`.trim()
    if (!window.confirm(`Supprimer définitivement ${nom} ?\n\nSes fiches de paie déjà créées sont conservées. Pour garder son dossier sans qu'il apparaisse dans les paies à venir, utilisez plutôt « Archiver ».`)) return
    const { error } = await supabase.from('employes').delete().eq('id', e.id)
    if (error) { window.alert(`Suppression impossible : ${error.message}`); return }
    charger()
  }

  const liste = useMemo(() => employes.filter(e => {
    if (filtre === 'actifs' && !e.actif) return false
    if (filtre === 'archives' && e.actif) return false
    if (service !== 'tous' && e.service !== service) return false
    const q = recherche.trim().toLowerCase()
    return !q || `${e.prenom} ${e.nom} ${e.poste}`.toLowerCase().includes(q)
  }), [employes, filtre, service, recherche])

  const actifs = employes.filter(e => e.actif)
  const masse = actifs.reduce((s, e) => s + (e.salaire_base || 0) + totalIndemnites(e), 0)

  if (role === undefined) return <p style={{ color: 'var(--text-3)' }}>Chargement…</p>
  if (!estGestion(role)) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Personnel</h1>
        <p style={{ color: 'var(--text-3)' }}>Cette page est réservée à la gérance et à l'administration.</p>
      </div>
    )
  }

  const maj = (champ) => (e) => setForm(f => ({ ...f, [champ]: e.target.value }))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Personnel</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Salariés, contrats et salaires</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/paie" className="btn-secondary">🧾 Fiches de paie</Link>
          <button onClick={ouvrirCreation} className="btn-primary">+ Ajouter un employé</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Effectif actif</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{actifs.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Masse salariale mensuelle (brut)</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{formatFCFA(masse)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Salaires de base + indemnités fixes</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Archivés</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{employes.length - actifs.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[['actifs', 'Actifs'], ['archives', 'Archivés'], ['tous', 'Tous']].map(([k, l]) => (
          <button key={k} onClick={() => setFiltre(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filtre === k ? 'text-white' : 'border hover:opacity-80'}`}
            style={filtre === k ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
            {l}
          </button>
        ))}
        <select className="input py-1 text-sm w-auto" value={service} onChange={e => setService(e.target.value)} aria-label="Service">
          <option value="tous">Tous les services</option>
          {Object.entries(SERVICES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input className="input py-1 text-sm w-auto" placeholder="Rechercher…" value={recherche} onChange={e => setRecherche(e.target.value)} />
      </div>

      {erreur && !form && <p className="text-sm mb-3" style={{ color: '#DC2626' }}>{erreur}</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Employé</th>
                <th className="table-th">Poste / Service</th>
                <th className="table-th">Contrat</th>
                <th className="table-th">Salaire de base</th>
                <th className="table-th">Indemnités</th>
                <th className="table-th">Paiement</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement…</td></tr>
              ) : liste.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>
                  {employes.length === 0 ? 'Aucun employé : cliquez sur « Ajouter un employé ».' : 'Aucun résultat'}
                </td></tr>
              ) : liste.map(e => (
                <tr key={e.id} className="border-t" style={{ borderColor: 'var(--border-2)', opacity: e.actif ? 1 : 0.55 }}>
                  <td className="table-td">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>{`${e.prenom} ${e.nom}`.trim()}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{e.telephone || '—'}</p>
                  </td>
                  <td className="table-td">
                    <p style={{ color: 'var(--text)' }}>{e.poste || '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{SERVICES[e.service]}</p>
                  </td>
                  <td className="table-td text-xs" style={{ color: 'var(--text-2)' }}>
                    {CONTRATS[e.type_contrat]}
                    {e.date_embauche && <p style={{ color: 'var(--text-3)' }}>depuis {formatDate(e.date_embauche)}</p>}
                  </td>
                  <td className="table-td font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>{formatFCFA(e.salaire_base)}</td>
                  <td className="table-td text-xs whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                    {totalIndemnites(e) > 0 ? formatFCFA(totalIndemnites(e)) : '—'}
                  </td>
                  <td className="table-td text-xs" style={{ color: 'var(--text-3)' }}>{PAIEMENTS[e.mode_paiement]}</td>
                  <td className="table-td">
                    <div className="flex flex-wrap gap-1">
                      <Link href={`/dashboard/paie?employe=${e.id}`} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                        style={{ borderColor: 'var(--border)', color: 'var(--primary)', backgroundColor: 'var(--bg)' }}>🧾 Fiche de paie</Link>
                      <button onClick={() => ouvrirEdition(e)} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}>Modifier</button>
                      <button onClick={() => basculerActif(e)} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}>
                        {e.actif ? 'Archiver' : 'Réactiver'}
                      </button>
                      <button onClick={() => supprimer(e)} title="Supprimer" aria-label={`Supprimer ${e.nom}`}
                        className="text-xs px-2 py-1 border rounded hover:opacity-70"
                        style={{ borderColor: '#FECACA', color: '#DC2626', backgroundColor: 'var(--bg)' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Formulaire ─────────────────────────────────────── */}
      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[92vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{editId ? "Modifier l'employé" : 'Nouvel employé'}</h2>
              <button onClick={() => setForm(null)} className="text-xl" style={{ color: 'var(--text-3)' }} aria-label="Fermer">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nom *</label><input className="input" value={form.nom} onChange={maj('nom')} /></div>
                <div><label className="label">Prénom(s)</label><input className="input" value={form.prenom} onChange={maj('prenom')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Poste</label><input className="input" value={form.poste} onChange={maj('poste')} placeholder="Serveuse, Gardien, Femme de ménage…" /></div>
                <div><label className="label">Service</label>
                  <select className="input" value={form.service} onChange={maj('service')}>
                    {Object.entries(SERVICES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Contrat</label>
                  <select className="input" value={form.type_contrat} onChange={maj('type_contrat')}>
                    {Object.entries(CONTRATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select></div>
                <div><label className="label">Date d'embauche</label><input className="input" type="date" value={form.date_embauche} onChange={maj('date_embauche')} /></div>
                <div><label className="label">Fin de contrat</label><input className="input" type="date" value={form.date_fin} onChange={maj('date_fin')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={maj('telephone')} /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={maj('email')} /></div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-2)' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>Rémunération</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="label">Salaire de base mensuel (FCFA)</label>
                    <input className="input" type="number" min="0" value={form.salaire_base} onChange={maj('salaire_base')} /></div>
                  <div><label className="label">N° CNPS</label><input className="input" value={form.numero_cnps} onChange={maj('numero_cnps')} /></div>
                </div>
                <label className="label">Indemnités fixes (ajoutées chaque mois)</label>
                {(form.indemnites || []).map((i, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                    <input className="input col-span-6" placeholder="Transport, logement…" value={i.nom}
                      onChange={e => setForm(f => ({ ...f, indemnites: f.indemnites.map((x, k) => k === idx ? { ...x, nom: e.target.value } : x) }))} />
                    <input className="input col-span-5" type="number" min="0" placeholder="Montant" value={i.montant}
                      onChange={e => setForm(f => ({ ...f, indemnites: f.indemnites.map((x, k) => k === idx ? { ...x, montant: e.target.value } : x) }))} />
                    <button type="button" className="col-span-1" style={{ color: '#DC2626' }} aria-label="Retirer l'indemnité"
                      onClick={() => setForm(f => ({ ...f, indemnites: f.indemnites.filter((_, k) => k !== idx) }))}>✕</button>
                  </div>
                ))}
                <button type="button" className="text-xs font-semibold" style={{ color: 'var(--primary)' }}
                  onClick={() => setForm(f => ({ ...f, indemnites: [...(f.indemnites || []), { nom: '', montant: '' }] }))}>+ Ajouter une indemnité</button>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div><label className="label">Mode de paiement</label>
                    <select className="input" value={form.mode_paiement} onChange={maj('mode_paiement')}>
                      {Object.entries(PAIEMENTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select></div>
                  <div><label className="label">N° Mobile Money / compte</label><input className="input" value={form.numero_paiement} onChange={maj('numero_paiement')} /></div>
                </div>
              </div>

              <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={maj('notes')} /></div>
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} /> Employé actif
              </label>
            </div>
            {erreur && <p className="text-sm mt-3" style={{ color: '#DC2626' }}>{erreur}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setForm(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={enregistrer} disabled={saving || !form.nom.trim()} className="btn-primary flex-1">
                {saving ? '…' : editId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
