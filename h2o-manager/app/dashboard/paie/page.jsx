'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatFCFA, formatDate } from '@/lib/utils'
import { useRole, estGestion } from '@/lib/useRole'

const STATUTS = { brouillon: 'Brouillon', valide: 'Validée', paye: 'Payée' }
const STATUT_COLORS = { brouillon: 'bg-gray-100 text-gray-600', valide: 'bg-blue-100 text-blue-700', paye: 'bg-green-100 text-green-800' }
const PAIEMENTS = { especes: 'Espèces', mobile_money: 'Mobile Money', virement: 'Virement', cheque: 'Chèque' }

const moisCourant = () => new Date().toISOString().slice(0, 7)
const somme = (lignes) => (lignes || []).reduce((s, l) => s + (Number(l.montant) || 0), 0)
const nomComplet = (e) => `${e.prenom || ''} ${e.nom || ''}`.trim()

// Les lignes qui ont un taux (en % du brut) sont recalculées ; les autres gardent leur montant saisi
function appliquerTaux(lignes, brut) {
  return (lignes || []).map(l => (Number(l.taux) > 0 ? { ...l, montant: Math.round((brut * Number(l.taux)) / 100) } : l))
}
function totaux(ed) {
  const brut = (parseInt(ed.salaire_base) || 0) + somme(ed.gains)
  const retenues = appliquerTaux(ed.retenues, brut)
  const charges = appliquerTaux(ed.charges_patronales, brut)
  return { brut, retenues, charges, totalRetenues: somme(retenues), net: brut - somme(retenues), totalCharges: somme(charges) }
}

// Éditeur de lignes (nom, taux facultatif, montant)
function Lignes({ titre, lignes, onChange, avecTaux, calcules, ajout, sansMontant }) {
  const maj = (i, champ, val) => onChange(lignes.map((l, k) => (k === i ? { ...l, [champ]: val } : l)))
  return (
    <div className="mb-4">
      <label className="label">{titre}</label>
      {lignes.map((l, i) => {
        const aTaux = avecTaux && Number(l.taux) > 0
        return (
          <div key={i} className="grid grid-cols-12 gap-2 mb-2">
            <input className={`input ${sansMontant ? 'col-span-8' : avecTaux ? 'col-span-5' : 'col-span-7'}`} placeholder="Libellé" value={l.nom || ''} onChange={e => maj(i, 'nom', e.target.value)} />
            {avecTaux && <input className={`input ${sansMontant ? 'col-span-3' : 'col-span-2'}`} type="number" min="0" step="0.01" placeholder="% du brut" value={l.taux ?? ''} onChange={e => maj(i, 'taux', e.target.value)} aria-label="Taux en pourcentage du brut" />}
            {!sansMontant && <input className="input col-span-4 text-right" type="number" min="0" placeholder="Montant"
              value={aTaux ? (calcules?.[i]?.montant ?? '') : (l.montant ?? '')} readOnly={aTaux} onChange={e => maj(i, 'montant', e.target.value)} />}
            <button type="button" className="col-span-1" style={{ color: '#DC2626' }} aria-label="Retirer la ligne" onClick={() => onChange(lignes.filter((_, k) => k !== i))}>✕</button>
          </div>
        )
      })}
      <button type="button" className="text-xs font-semibold" style={{ color: 'var(--primary)' }} onClick={() => onChange([...lignes, avecTaux ? { nom: '', taux: '', montant: '' } : { nom: '', montant: '' }])}>
        + {ajout}
      </button>
    </div>
  )
}

function Paie() {
  const supabase = createClient()
  const role = useRole()
  const searchParams = useSearchParams()
  const employeParam = searchParams.get('employe')

  const [mois, setMois] = useState(moisCourant())
  const [fiches, setFiches] = useState([])
  const [employes, setEmployes] = useState([])
  const [params, setParams] = useState({ retenues: [], charges_patronales: [] })
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [ed, setEd] = useState(null)                 // fiche en cours de modification
  const [saving, setSaving] = useState(false)
  const [paiement, setPaiement] = useState(null)     // { fiche, date, mode }
  const [reglages, setReglages] = useState(null)     // { retenues, charges_patronales }
  const [apercu, setApercu] = useState(null)         // { fiche, url }
  const [pdfLoading, setPdfLoading] = useState(null)
  const iframeRef = useRef(null)
  const paramTraite = useRef(false)

  useEffect(() => { if (estGestion(role)) charger() }, [role, mois])

  async function charger() {
    setLoading(true); setErreur('')
    const [f, e, p] = await Promise.all([
      supabase.from('fiches_paie').select('*').eq('mois', `${mois}-01`).order('employe_nom'),
      supabase.from('employes').select('*').order('nom'),
      supabase.from('parametres_paie').select('*').eq('id', 1).maybeSingle(),
    ])
    const err = f.error || e.error || p.error
    if (err) setErreur(err.message)
    setFiches(f.data || [])
    setEmployes(e.data || [])
    if (p.data) setParams({ retenues: p.data.retenues || [], charges_patronales: p.data.charges_patronales || [] })
    setLoading(false)
  }

  // Lien « Fiche de paie » depuis Personnel : crée (ou ouvre) la fiche du mois pour cet employé
  useEffect(() => {
    if (loading || paramTraite.current || !employeParam || employes.length === 0) return
    paramTraite.current = true
    const emp = employes.find(x => x.id === employeParam)
    if (!emp) return
    const existante = fiches.find(f => f.employe_id === emp.id)
    if (existante) { ouvrirEdition(existante); return }
    genererPour([emp], true)
  }, [loading, employeParam, employes, fiches])

  function construireFiche(emp) {
    const gains = (emp.indemnites || []).filter(i => i.nom && Number(i.montant) > 0).map(i => ({ nom: i.nom, montant: Math.round(Number(i.montant)) }))
    const brut = (emp.salaire_base || 0) + somme(gains)
    const avecTaux = (liste) => (liste || []).filter(r => r.nom && Number(r.taux) > 0)
      .map(r => ({ nom: r.nom, taux: Number(r.taux), montant: Math.round((brut * Number(r.taux)) / 100) }))
    return {
      employe_id: emp.id, employe_nom: nomComplet(emp), employe_poste: emp.poste || '', employe_cnps: emp.numero_cnps || '',
      mois: `${mois}-01`, salaire_base: emp.salaire_base || 0, gains,
      retenues: avecTaux(params.retenues), charges_patronales: avecTaux(params.charges_patronales),
    }
  }

  // Employés concernés par le mois : actifs, embauchés avant la fin du mois, non partis avant son début
  function concernes() {
    const debut = `${mois}-01`
    const fin = `${mois}-31`
    return employes.filter(e => e.actif && (!e.date_embauche || e.date_embauche <= fin) && (!e.date_fin || e.date_fin >= debut))
  }

  async function genererPour(liste, ouvrirApres = false) {
    setErreur('')
    const lignes = liste.map(construireFiche)
    if (lignes.length === 0) return
    const { error } = await supabase.from('fiches_paie').upsert(lignes, { onConflict: 'employe_id,mois', ignoreDuplicates: true })
    if (error) { setErreur(error.message); return }
    const { data } = await supabase.from('fiches_paie').select('*').eq('mois', `${mois}-01`).order('employe_nom')
    setFiches(data || [])
    if (ouvrirApres && liste.length === 1) {
      const f = (data || []).find(x => x.employe_id === liste[0].id)
      if (f) ouvrirEdition(f)
    }
  }

  async function genererLeMois() {
    const deja = new Set(fiches.map(f => f.employe_id))
    const aCreer = concernes().filter(e => !deja.has(e.id))
    if (aCreer.length === 0) { window.alert('Toutes les fiches du mois existent déjà (ou aucun employé actif).'); return }
    await genererPour(aCreer)
  }

  // ── Modification ───────────────────────────────────────
  function ouvrirEdition(f) {
    setErreur('')
    setEd({
      id: f.id, employe_nom: f.employe_nom, numero: f.numero, salaire_base: f.salaire_base,
      gains: (f.gains || []).map(x => ({ ...x })), retenues: (f.retenues || []).map(x => ({ ...x })),
      charges_patronales: (f.charges_patronales || []).map(x => ({ ...x })),
    })
  }
  async function enregistrerFiche(statut) {
    const t = totaux(ed)
    const propre = (liste) => liste.filter(l => l.nom?.trim() && (Number(l.montant) > 0 || Number(l.taux) > 0))
      .map(l => ({ nom: l.nom.trim(), ...(Number(l.taux) > 0 ? { taux: Number(l.taux) } : {}), montant: Math.round(Number(l.montant) || 0) }))
    setSaving(true); setErreur('')
    const { error } = await supabase.from('fiches_paie').update({
      salaire_base: parseInt(ed.salaire_base) || 0,
      gains: propre(ed.gains),
      retenues: propre(t.retenues),
      charges_patronales: propre(t.charges),
      ...(statut ? { statut } : {}),
    }).eq('id', ed.id)
    setSaving(false)
    if (error) { setErreur(error.message); return }
    setEd(null); charger()
  }

  async function valider(f) {
    const { error } = await supabase.from('fiches_paie').update({ statut: 'valide' }).eq('id', f.id)
    if (error) { window.alert(error.message); return }
    charger()
  }

  // ── Paiement (crée la dépense « Salaires » en trésorerie) ──
  function ouvrirPaiement(f) {
    const emp = employes.find(e => e.id === f.employe_id)
    setErreur('')
    setPaiement({ fiche: f, date: new Date().toISOString().slice(0, 10), mode: emp?.mode_paiement || 'especes' })
  }
  async function payer() {
    setSaving(true)
    const { error } = await supabase.rpc('payer_fiche_paie', { p_id: paiement.fiche.id, p_date: paiement.date, p_mode: paiement.mode })
    setSaving(false)
    if (error) { setErreur(error.message); return }
    setPaiement(null); charger()
  }
  async function annulerPaiement(f) {
    if (!window.confirm(`Annuler le paiement de ${f.employe_nom} ? La dépense correspondante sera retirée de la trésorerie.`)) return
    const { error } = await supabase.rpc('annuler_paiement_fiche', { p_id: f.id })
    if (error) { window.alert(error.message); return }
    charger()
  }
  async function supprimer(f) {
    if (!window.confirm(`Supprimer la fiche de ${f.employe_nom} (${f.numero}) ? Cette action est irréversible.`)) return
    const { error } = await supabase.from('fiches_paie').delete().eq('id', f.id)
    if (error) { window.alert(error.message); return }
    charger()
  }

  // ── Bulletin PDF ───────────────────────────────────────
  async function ouvrirApercu(f) {
    setPdfLoading(f.id)
    try {
      const { data: entreprise } = await supabase.from('entreprise').select('rccm, ifu').eq('id', 1).maybeSingle()
      const res = await fetch(`/api/paie/${f.id}/pdf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiche: f, employe: employes.find(e => e.id === f.employe_id) || null, entreprise }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Erreur serveur') }
      setApercu({ fiche: f, url: URL.createObjectURL(await res.blob()) })
    } catch (err) {
      window.alert('Impossible de générer le bulletin : ' + err.message)
    } finally { setPdfLoading(null) }
  }
  function fermerApercu() { if (apercu) URL.revokeObjectURL(apercu.url); setApercu(null) }
  function telechargerApercu() {
    const a = document.createElement('a')
    a.href = apercu.url; a.download = `${apercu.fiche.numero || 'bulletin'}.pdf`
    document.body.appendChild(a); a.click(); a.remove()
  }

  // ── Réglages (taux par défaut) ─────────────────────────
  async function enregistrerReglages() {
    const propre = (l) => l.filter(x => x.nom?.trim() && Number(x.taux) > 0).map(x => ({ nom: x.nom.trim(), taux: Number(x.taux) }))
    setSaving(true)
    const { error } = await supabase.from('parametres_paie').upsert({
      id: 1, retenues: propre(reglages.retenues), charges_patronales: propre(reglages.charges_patronales), updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { setErreur(error.message); return }
    setReglages(null); charger()
  }

  if (role === undefined) return <p style={{ color: 'var(--text-3)' }}>Chargement…</p>
  if (!estGestion(role)) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Fiches de paie</h1>
        <p style={{ color: 'var(--text-3)' }}>Cette page est réservée à la gérance et à l'administration.</p>
      </div>
    )
  }

  const totalNet = fiches.reduce((s, f) => s + (f.net_a_payer || 0), 0)
  const totalPaye = fiches.filter(f => f.statut === 'paye').reduce((s, f) => s + (f.net_a_payer || 0), 0)
  const moisLabel = new Date(`${mois}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const t = ed ? totaux(ed) : null

  return (
    <div>
      {apercu && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <p className="font-semibold text-gray-900">Bulletin {apercu.fiche.numero} — {apercu.fiche.employe_nom}</p>
              <button onClick={fermerApercu} className="text-2xl leading-none text-gray-500 hover:text-gray-900" aria-label="Fermer l'aperçu">×</button>
            </div>
            <iframe ref={iframeRef} src={apercu.url} title="Bulletin de paie" className="flex-1 w-full" />
            <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-200">
              <button onClick={telechargerApercu} className="btn-secondary">Télécharger</button>
              <button onClick={() => iframeRef.current?.contentWindow?.print()} className="btn-primary">Imprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Fiches de paie</h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: 'var(--text-3)' }}>{moisLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input type="month" className="input py-1.5 w-auto" value={mois} onChange={e => e.target.value && setMois(e.target.value)} aria-label="Mois" />
          <button className="btn-secondary" onClick={() => setReglages({ retenues: params.retenues.map(x => ({ ...x })), charges_patronales: params.charges_patronales.map(x => ({ ...x })) })}>⚙️ Taux de paie</button>
          <button className="btn-primary" onClick={genererLeMois}>Générer les fiches du mois</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Net à payer (mois)</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{formatFCFA(totalNet)}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Déjà payé</p>
          <p className="text-2xl font-bold text-green-600">{formatFCFA(totalPaye)}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Reste à payer</p>
          <p className="text-2xl font-bold text-yellow-600">{formatFCFA(totalNet - totalPaye)}</p></div>
      </div>

      {params.retenues.length === 0 && (
        <p className="text-sm mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}>
          Aucun taux de cotisation n'est enregistré : les fiches sont générées sans retenues. Renseignez-les avec votre comptable dans « Taux de paie ».
        </p>
      )}
      {erreur && !ed && !paiement && !reglages && <p className="text-sm mb-3" style={{ color: '#DC2626' }}>{erreur}</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">N°</th><th className="table-th">Employé</th><th className="table-th">Brut</th>
                <th className="table-th">Retenues</th><th className="table-th">Net à payer</th><th className="table-th">Statut</th><th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement…</td></tr>
              ) : fiches.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>
                  Aucune fiche pour ce mois. {employes.length === 0
                    ? <Link href="/dashboard/personnel" className="underline" style={{ color: 'var(--primary)' }}>Ajoutez d'abord vos employés</Link>
                    : 'Cliquez sur « Générer les fiches du mois ».'}
                </td></tr>
              ) : fiches.map(f => (
                <tr key={f.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td font-mono text-xs" style={{ color: 'var(--text-3)' }}>{f.numero}</td>
                  <td className="table-td"><p className="font-medium" style={{ color: 'var(--text)' }}>{f.employe_nom}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{f.employe_poste || '—'}</p></td>
                  <td className="table-td whitespace-nowrap" style={{ color: 'var(--text-2)' }}>{formatFCFA(f.total_brut)}</td>
                  <td className="table-td whitespace-nowrap" style={{ color: 'var(--text-2)' }}>{formatFCFA(f.total_retenues)}</td>
                  <td className="table-td font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>{formatFCFA(f.net_a_payer)}</td>
                  <td className="table-td"><span className={`badge ${STATUT_COLORS[f.statut]}`}>{STATUTS[f.statut]}</span>
                    {f.date_paiement && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{formatDate(f.date_paiement)}</p>}</td>
                  <td className="table-td">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => ouvrirApercu(f)} disabled={pdfLoading === f.id} className="text-xs px-2 py-1 border rounded hover:opacity-70 disabled:opacity-40"
                        style={{ borderColor: 'var(--border)', color: 'var(--primary)', backgroundColor: 'var(--bg)' }}>{pdfLoading === f.id ? '…' : '📄 Bulletin'}</button>
                      {f.statut !== 'paye' && <button onClick={() => ouvrirEdition(f)} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}>Modifier</button>}
                      {f.statut === 'brouillon' && <button onClick={() => valider(f)} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}>Valider</button>}
                      {f.statut !== 'paye' && <button onClick={() => ouvrirPaiement(f)} className="text-xs px-2 py-1 rounded text-white hover:opacity-80"
                        style={{ backgroundColor: 'var(--success)' }}>💰 Payer</button>}
                      {f.statut === 'paye' && <button onClick={() => annulerPaiement(f)} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                        style={{ borderColor: 'var(--border)', color: '#D97706', backgroundColor: 'var(--bg)' }}>Annuler le paiement</button>}
                      {f.statut !== 'paye' && <button onClick={() => supprimer(f)} title="Supprimer la fiche" aria-label={`Supprimer la fiche de ${f.employe_nom}`}
                        className="text-xs px-2 py-1 border rounded hover:opacity-70" style={{ borderColor: '#FECACA', color: '#DC2626', backgroundColor: 'var(--bg)' }}>🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modification d'une fiche ───────────────────────── */}
      {ed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-xl shadow-xl max-h-[92vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{ed.employe_nom}</h2>
                <p className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{ed.numero} · {moisLabel}</p></div>
              <button onClick={() => setEd(null)} className="text-xl" style={{ color: 'var(--text-3)' }} aria-label="Fermer">×</button>
            </div>
            <div className="mb-4"><label className="label">Salaire de base (FCFA)</label>
              <input className="input" type="number" min="0" value={ed.salaire_base} onChange={e => setEd(x => ({ ...x, salaire_base: e.target.value }))} /></div>
            <Lignes titre="Gains (primes, indemnités, heures supplémentaires…)" lignes={ed.gains} onChange={g => setEd(x => ({ ...x, gains: g }))} ajout="Ajouter un gain" />
            <Lignes titre="Retenues (cotisations, avances, absences…) — taux en % du brut" lignes={ed.retenues} avecTaux calcules={t.retenues}
              onChange={r => setEd(x => ({ ...x, retenues: r }))} ajout="Ajouter une retenue" />
            <Lignes titre="Charges patronales (information : coût employeur)" lignes={ed.charges_patronales} avecTaux calcules={t.charges}
              onChange={c => setEd(x => ({ ...x, charges_patronales: c }))} ajout="Ajouter une charge" />
            <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: 'var(--bg-2)' }}>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-3)' }}>Total brut</span><span>{formatFCFA(t.brut)}</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-3)' }}>Total retenues</span><span>{formatFCFA(t.totalRetenues)}</span></div>
              <div className="flex justify-between font-bold mt-1"><span>Net à payer</span><span style={{ color: t.net < 0 ? '#DC2626' : 'var(--primary)' }}>{formatFCFA(t.net)}</span></div>
              {t.totalCharges > 0 && <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-3)' }}><span>Coût employeur</span><span>{formatFCFA(t.brut + t.totalCharges)}</span></div>}
            </div>
            {erreur && <p className="text-sm mb-3" style={{ color: '#DC2626' }}>{erreur}</p>}
            <div className="flex gap-3">
              <button onClick={() => setEd(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={() => enregistrerFiche()} disabled={saving || t.net < 0} className="btn-primary flex-1">{saving ? '…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Paiement ───────────────────────────────────────── */}
      {paiement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Payer {paiement.fiche.employe_nom}</h2>
            <p className="text-2xl font-bold mb-4" style={{ color: 'var(--primary)' }}>{formatFCFA(paiement.fiche.net_a_payer)}</p>
            <div className="space-y-3">
              <div><label className="label">Date de paiement</label>
                <input className="input" type="date" value={paiement.date} onChange={e => setPaiement(p => ({ ...p, date: e.target.value }))} /></div>
              <div><label className="label">Mode de paiement</label>
                <select className="input" value={paiement.mode} onChange={e => setPaiement(p => ({ ...p, mode: e.target.value }))}>
                  {Object.entries(PAIEMENTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select></div>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>Une dépense « Salaires » sera enregistrée dans la trésorerie.</p>
            {erreur && <p className="text-sm mt-3" style={{ color: '#DC2626' }}>{erreur}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setPaiement(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={payer} disabled={saving} className="btn-primary flex-1">{saving ? '…' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Taux de paie par défaut ────────────────────────── */}
      {reglages && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Taux de paie par défaut</h2>
              <button onClick={() => setReglages(null)} className="text-xl" style={{ color: 'var(--text-3)' }} aria-label="Fermer">×</button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
              Ces taux (en % du brut) sont appliqués aux fiches générées ensuite. Faites-les valider par votre comptable : ils dépendent de la réglementation en vigueur.
            </p>
            <Lignes titre="Retenues sur salaire (ex. cotisation salariale)" lignes={reglages.retenues} avecTaux sansMontant onChange={r => setReglages(x => ({ ...x, retenues: r }))} ajout="Ajouter une retenue" />
            <Lignes titre="Charges patronales (ex. cotisation employeur)" lignes={reglages.charges_patronales} avecTaux sansMontant onChange={c => setReglages(x => ({ ...x, charges_patronales: c }))} ajout="Ajouter une charge" />
            {erreur && <p className="text-sm mb-3" style={{ color: '#DC2626' }}>{erreur}</p>}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setReglages(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={enregistrerReglages} disabled={saving} className="btn-primary flex-1">{saving ? '…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PaiePage() {
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-3)' }}>Chargement…</p>}>
      <Paie />
    </Suspense>
  )
}
