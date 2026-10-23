'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatFCFA } from '@/lib/utils'

const PLATEFORMES = { airbnb: 'Airbnb', booking: 'Booking', manuel: 'Autre' }
const COULEURS = { airbnb: 'bg-rose-200 text-rose-800', booking: 'bg-sky-200 text-sky-800', manuel: 'bg-teal-200 text-teal-800', site_web: 'bg-amber-200 text-amber-800' }
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const VIDE = { plateforme: 'airbnb', arrivee: '', depart: '', nom: '', reference: '', montant: '' }

// Date locale au format AAAA-MM-JJ (sans décalage de fuseau)
function versIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function depuisIso(texte) {
  const [a, m, j] = texte.split('-').map(Number)
  return new Date(a, m - 1, j)
}

export default function Calendrier() {
  const supabase = createClient()
  const [villas, setVillas] = useState([])
  const [chambres, setChambres] = useState([])
  const [unite, setUnite] = useState(null)          // { type: 'villa' | 'chambre', id, nom }
  const [mois, setMois] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [reservations, setReservations] = useState([])
  const [form, setForm] = useState(VIDE)
  const [message, setMessage] = useState(null)
  const [enregistrement, setEnregistrement] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('duplexes').select('code, nom').neq('statut', 'maintenance').order('code'),
      supabase.from('chambres').select('id, nom').order('nom'),
    ]).then(([v, c]) => {
      const listeVillas = (v.data || []).map((d) => ({ type: 'villa', id: d.code, nom: d.nom }))
      const listeChambres = (c.data || []).map((x) => ({ type: 'chambre', id: x.id, nom: x.nom }))
      setVillas(listeVillas)
      setChambres(listeChambres)
      setUnite((u) => u || listeVillas[0] || listeChambres[0] || null)
    })
  }, [])

  // Réservations de l'unité qui chevauchent le mois affiché
  const charger = useCallback(async () => {
    if (!unite) return
    const debut = versIso(mois)
    const fin = versIso(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))
    let requete = supabase
      .from('reservations')
      .select('id, nom_client, date_arrivee, date_depart, source, statut, notes, montant_total')
      .not('statut', 'in', '("annule","cloture")')
      .lt('date_arrivee', fin)
      .gt('date_depart', debut)
      .order('date_arrivee')
    requete = unite.type === 'villa' ? requete.eq('duplex_id', unite.id) : requete.eq('chambre_id', unite.id)
    const { data } = await requete
    setReservations(data || [])
  }, [unite, mois])

  useEffect(() => { charger() }, [charger])

  // Nuits occupées : du jour d'arrivée au jour précédant le départ
  const occupes = {}
  reservations.forEach((r) => {
    for (let d = depuisIso(r.date_arrivee); versIso(d) < r.date_depart; d.setDate(d.getDate() + 1)) {
      occupes[versIso(d)] = r
    }
  })

  const premierJour = new Date(mois.getFullYear(), mois.getMonth(), 1)
  const nbJours = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate()
  const decalage = (premierJour.getDay() + 6) % 7
  const cases = [...Array(decalage).fill(null), ...Array.from({ length: nbJours }, (_, i) => i + 1)]

  async function ajouter(e) {
    e.preventDefault()
    setMessage(null)
    if (!unite) return
    if (!form.arrivee || !form.depart || form.depart <= form.arrivee) {
      return setMessage({ type: 'error', text: 'Indiquez une arrivée et un départ postérieur à l’arrivée.' })
    }

    // Contrôle des conflits sur l'unité choisie
    let verification = supabase
      .from('reservations')
      .select('nom_client, date_arrivee, date_depart')
      .not('statut', 'in', '("annule","cloture")')
      .lt('date_arrivee', form.depart)
      .gt('date_depart', form.arrivee)
      .limit(1)
    verification = unite.type === 'villa' ? verification.eq('duplex_id', unite.id) : verification.eq('chambre_id', unite.id)
    const { data: conflits } = await verification
    if (conflits && conflits.length > 0) {
      const c = conflits[0]
      return setMessage({ type: 'error', text: `Dates déjà réservées (${c.nom_client}, du ${c.date_arrivee} au ${c.date_depart}).` })
    }

    setEnregistrement(true)
    const { error } = await supabase.from('reservations').insert([{
      nom_client: form.nom.trim() || PLATEFORMES[form.plateforme],
      duplex_id: unite.type === 'villa' ? unite.id : null,
      chambre_id: unite.type === 'chambre' ? unite.id : null,
      date_arrivee: form.arrivee,
      date_depart: form.depart,
      montant_total: form.montant ? parseInt(form.montant) : null,
      statut: 'confirme',
      type: 'sejour',
      source: form.plateforme,
      notes: form.reference ? `Réf. ${PLATEFORMES[form.plateforme]} : ${form.reference}` : null,
    }])
    setEnregistrement(false)
    if (error) return setMessage({ type: 'error', text: `Erreur : ${error.message}` })
    setForm(VIDE)
    setMessage({ type: 'success', text: 'Réservation enregistrée : les dates sont bloquées.' })
    charger()
  }

  async function annuler(r) {
    if (!window.confirm(`Annuler la réservation de ${r.nom_client} du ${r.date_arrivee} au ${r.date_depart} ? Les dates seront libérées.`)) return
    const { error } = await supabase.from('reservations').update({ statut: 'annule' }).eq('id', r.id)
    if (error) return setMessage({ type: 'error', text: `Erreur : ${error.message}` })
    charger()
  }

  const toutes = [...villas, ...chambres]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Calendrier</h1>
        <select
          value={unite ? `${unite.type}:${unite.id}` : ''}
          onChange={(e) => setUnite(toutes.find((u) => `${u.type}:${u.id}` === e.target.value) || null)}
          className="input max-w-xs"
        >
          {villas.length > 0 && <optgroup label="Villas">{villas.map((u) => <option key={u.id} value={`villa:${u.id}`}>{u.nom}</option>)}</optgroup>}
          {chambres.length > 0 && <optgroup label="Chambres">{chambres.map((u) => <option key={u.id} value={`chambre:${u.id}`}>{u.nom}</option>)}</optgroup>}
        </select>
      </div>

      {unite && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Grille du mois */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <button className="btn-secondary" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))}>‹</button>
              <p className="font-semibold capitalize">{MOIS[mois.getMonth()]} {mois.getFullYear()}</p>
              <button className="btn-secondary" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
              {JOURS.map((j) => <p key={j} className="text-center font-semibold">{j}</p>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cases.map((jour, i) => {
                if (!jour) return <div key={`v${i}`} />
                const iso = versIso(new Date(mois.getFullYear(), mois.getMonth(), jour))
                const r = occupes[iso]
                return (
                  <div key={iso} className={`min-h-14 rounded-lg border p-1 text-xs ${r ? COULEURS[r.source] || COULEURS.manuel : 'border-gray-100 bg-white'}`}>
                    <p className="font-semibold">{jour}</p>
                    {r && <p className="truncate text-[10px]">{PLATEFORMES[r.source] || r.source}</p>}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-600">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-200" /> Airbnb</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-200" /> Booking</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-200" /> Autre / manuel</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200" /> Site web</span>
            </div>

            {/* Réservations du mois */}
            <div className="mt-6 divide-y">
              {reservations.length === 0 && <p className="text-sm text-gray-500 py-3">Aucune réservation ce mois-ci.</p>}
              {reservations.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{r.nom_client}</p>
                    <p className="text-xs text-gray-500">
                      {r.date_arrivee} → {r.date_depart} · {PLATEFORMES[r.source] || r.source}
                      {r.montant_total ? ` · ${formatFCFA(r.montant_total)}` : ''}
                    </p>
                  </div>
                  <button onClick={() => annuler(r)} className="text-xs text-red-600 hover:underline">Annuler</button>
                </div>
              ))}
            </div>
          </div>

          {/* Ajout d'une réservation de plateforme */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-1">Réserver les dates</h2>
            <p className="text-sm text-gray-500 mb-4">Pour une réservation reçue sur Airbnb, Booking ou ailleurs.</p>
            <form onSubmit={ajouter} className="space-y-3">
              <div>
                <label className="label">Plateforme</label>
                <select className="input" value={form.plateforme} onChange={(e) => setForm({ ...form, plateforme: e.target.value })}>
                  {Object.entries(PLATEFORMES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Arrivée</label>
                  <input type="date" className="input" value={form.arrivee} onChange={(e) => setForm({ ...form, arrivee: e.target.value })} />
                </div>
                <div>
                  <label className="label">Départ</label>
                  <input type="date" className="input" value={form.depart} onChange={(e) => setForm({ ...form, depart: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Nom du voyageur</label>
                <input className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Facultatif" />
              </div>
              <div>
                <label className="label">Référence de la plateforme</label>
                <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Facultatif" />
              </div>
              <div>
                <label className="label">Montant (FCFA)</label>
                <input type="number" min="0" className="input" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} placeholder="Facultatif" />
              </div>
              {message && <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{message.text}</p>}
              <button type="submit" disabled={enregistrement} className="btn-primary w-full">
                {enregistrement ? 'Enregistrement…' : `Bloquer les dates — ${unite.nom}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
