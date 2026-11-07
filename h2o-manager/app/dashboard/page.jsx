'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatFCFA, formatDateShort, STATUT_COLORS, STATUT_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { chargerFinances, bornesPeriode, SOURCES as SOURCES_CA } from '@/lib/finance'

// Raccourcis affichés en haut du tableau de bord
const ACTIONS_RAPIDES = [
  { href: '/dashboard/reservations?new=1', icon: '📅', label: 'Nouvelle réservation' },
  { href: '/dashboard/facturation', icon: '🧾', label: 'Nouvelle facture' },
  { href: '/dashboard/restaurant', icon: '🍽️', label: 'Restaurant & bar' },
  { href: '/dashboard/evenements', icon: '🎪', label: 'Ajouter un événement' },
  { href: '/dashboard/clients', icon: '👥', label: 'Ajouter un client' },
  { href: '/dashboard/chambres', icon: '🛏️', label: 'Gérer les chambres' },
  { href: '/dashboard/boutique', icon: '🛍️', label: 'Vente boutique' },
  { href: '/dashboard/assistance', icon: '🔔', label: "Demandes d'assistance" },
]

export default function Dashboard() {
  const supabase = createClient()
  const [stats,    setStats]    = useState({ occupation: 0, sejours: 0, totalDuplexes: 0 })
  const [finMois,  setFinMois]  = useState(null)   // CA / encaissé du mois en cours (lib/finance)
  const [finPeriode, setFinPeriode] = useState(null) // CA / encaissé de la période choisie (lib/finance)
  const [today,    setToday]    = useState({ arrivals: [], departures: [] })
  const [upcoming, setUpcoming] = useState([])
  const [weekData, setWeekData] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [cmdResto, setCmdResto] = useState([])      // commandes Restaurant & Bar
  const [ventesBoutique, setVentesBoutique] = useState([])   // ventes Boutique
  const [periodeResto, setPeriodeResto] = useState('mois')   // jour | semaine | mois | tout
  const [sourceCmd, setSourceCmd] = useState('tous')        // tous | restaurant | boutique

  useEffect(() => { loadData() }, [])

  // Commandes Restaurant & Bar et ventes Boutique de la période choisie (heure locale)
  async function loadCommandesResto() {
    const { debut, fin } = bornesPeriode(periodeResto)
    const charger = (table) => {
      let q = supabase
        .from(table)
        .select('id, nom_client, telephone, lignes, montant_total, statut, created_at' + (table === 'commandes_restaurant' ? ', table_num' : ''))
        .order('created_at', { ascending: false })
        .limit(2000)
      if (debut) q = q.gte('created_at', debut.toISOString())
      if (fin) q = q.lt('created_at', fin.toISOString())
      return q
    }
    const [resto, boutique] = await Promise.all([charger('commandes_restaurant'), charger('ventes')])
    setCmdResto(resto.data || [])
    setVentesBoutique(boutique.data || [])
    // Même période, mêmes règles : le chiffre d'affaires global et le détail des commandes concordent
    chargerFinances(supabase, periodeResto).then(setFinPeriode)
    chargerFinances(supabase, 'mois').then(setFinMois)
  }

  // Mise à jour en direct : nouvelle commande ou vente, modification, suppression
  useEffect(() => {
    loadCommandesResto()
    const channel = supabase
      .channel('dashboard_commandes_ventes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commandes_restaurant' }, () => loadCommandesResto())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventes' }, () => loadCommandesResto())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => loadCommandesResto())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' }, () => loadCommandesResto())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [periodeResto])

  async function loadData() {
    const todayStr = new Date().toISOString().split('T')[0]

    const [duplexRes, resvRes, todayArrRes, todayDepRes] = await Promise.all([
      supabase.from('duplexes').select('id, statut'),
      supabase.from('reservations')
        .select('id, nom_client, duplex_id, date_arrivee, date_depart, statut, montant_total')
        .in('statut', ['confirme', 'en_sejour', 'en_attente'])
        .order('date_arrivee', { ascending: true })
        .limit(10),
      // Arrivées aujourd'hui
      supabase.from('reservations')
        .select('id, nom_client, duplex_id, telephone')
        .eq('date_arrivee', todayStr)
        .not('statut', 'in', '("annule","cloture")'),
      // Départs aujourd'hui
      supabase.from('reservations')
        .select('id, nom_client, duplex_id, telephone')
        .eq('date_depart', todayStr)
        .not('statut', 'in', '("annule","cloture")'),
    ])

    const duplexes    = duplexRes.data || []
    const reservations = resvRes.data || []
    const total       = duplexes.length || 1
    const occupied    = duplexes.filter(d => d.statut === 'occupe').length
    const enSejour    = reservations.filter(r => r.statut === 'en_sejour').length

    // Données 7 derniers jours pour le mini-graphique
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const count = (resvRes.data || []).filter(r =>
        r.date_arrivee <= ds && r.date_depart > ds && r.statut !== 'annule'
      ).length
      days.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), count, isToday: i === 0 })
    }

    setStats({ occupation: Math.round((occupied / total) * 100), sejours: enSejour, totalDuplexes: total })
    setToday({ arrivals: todayArrRes.data || [], departures: todayDepRes.data || [] })
    setUpcoming(reservations.slice(0, 6))
    setWeekData(days)
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-3)' }}>
      <span className="animate-spin text-2xl mr-3">⏳</span> Chargement…
    </div>
  )

  const maxCount = Math.max(...weekData.map(d => d.count), 1)
  // Commandes restaurant + ventes boutique, réunies et triées de la plus récente à la plus ancienne
  const toutes = [
    ...cmdResto.map(c => ({ ...c, source: 'restaurant' })),
    ...ventesBoutique.map(v => ({ ...v, source: 'boutique' })),
  ].sort((x, y) => (x.created_at < y.created_at ? 1 : -1))
  const liste = sourceCmd === 'tous' ? toutes : toutes.filter(c => c.source === sourceCmd)
  const cmdValides = liste.filter(c => c.statut !== 'annulee')
  const somme = (arr) => arr.reduce((t, c) => t + (c.montant_total || 0), 0)
  const totalResto = somme(cmdValides)                                            // chiffre d'affaires
  const caEncaisse = somme(cmdValides.filter(c => c.statut === 'payee'))
  const caAEncaisser = totalResto - caEncaisse
  const panierMoyen = cmdValides.length ? Math.round(totalResto / cmdValides.length) : 0
  const caRestaurant = somme(toutes.filter(c => c.source === 'restaurant' && c.statut !== 'annulee'))
  const caBoutique   = somme(toutes.filter(c => c.source === 'boutique'   && c.statut !== 'annulee'))
  const SOURCES = [['tous', 'Tout'], ['restaurant', '🍽️ Restaurant & Bar'], ['boutique', '🛍️ Boutique']]
  const PERIODES = [['jour', "Aujourd'hui"], ['semaine', '7 jours'], ['mois', 'Ce mois'], ['tout', 'Tout']]
  const libellePeriode = { jour: "aujourd'hui", semaine: 'sur 7 jours', mois: 'ce mois-ci', tout: 'au total' }[periodeResto]
  const STATUT_RESTO = { en_cours: 'En cours', servie: 'Servie', en_attente: 'En attente', payee: 'Payée', annulee: 'Annulée' }
  const STATUT_RESTO_COLORS = {
    en_cours:   'bg-yellow-100 text-yellow-800',
    en_attente: 'bg-yellow-100 text-yellow-800',
    servie:     'bg-blue-100 text-blue-700',
    payee:      'bg-green-100 text-green-800',
    annulee:    'bg-gray-100 text-gray-500',
  }
  const now = new Date()
  const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tableau de bord</h1>
          <p className="text-sm capitalize mt-0.5" style={{ color: 'var(--text-3)' }}>{monthLabel}</p>
        </div>
        <Link href="/dashboard/reservations?new=1" className="btn-primary">
          + Nouvelle réservation
        </Link>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {ACTIONS_RAPIDES.map(a => (
          <Link key={a.href} href={a.href} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">{a.icon}</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Taux d'occupation</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{stats.occupation}%</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{stats.totalDuplexes} duplexes au total</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Séjours en cours</p>
          <p className="text-3xl font-bold text-blue-600">{stats.sejours}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Clients présents aujourd'hui</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Encaissé ce mois</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--success)' }}>{finMois ? formatFCFA(finMois.total.encaisse) : '…'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            {finMois ? `Chiffre d'affaires ${formatFCFA(finMois.total.ca)} · reste ${formatFCFA(finMois.total.reste)}` : 'Calcul en cours'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Alertes du jour */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Aujourd'hui —{' '}
            <span className="text-sm font-normal" style={{ color: 'var(--text-3)' }}>
              {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </h2>

          {today.arrivals.length === 0 && today.departures.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Aucune arrivée ni départ prévu aujourd'hui.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Arrivées */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--success)' }}>
                  ▲ Arrivées ({today.arrivals.length})
                </p>
                {today.arrivals.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>Aucune</p>
                ) : today.arrivals.map(r => (
                  <div key={r.id} className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                      style={{ backgroundColor: 'var(--success)' }}>
                      {r.nom_client?.[0]?.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.nom_client}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{r.duplex_id} · {r.telephone}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Départs */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--primary)' }}>
                  ▼ Départs ({today.departures.length})
                </p>
                {today.departures.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>Aucun</p>
                ) : today.departures.map(r => (
                  <div key={r.id} className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                      style={{ backgroundColor: 'var(--primary)' }}>
                      {r.nom_client?.[0]?.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.nom_client}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{r.duplex_id} · {r.telephone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mini-graphique occupation 7 jours */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Occupation / 7 jours</h2>
          <div className="flex items-end gap-1.5 h-24">
            {weekData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${(d.count / maxCount) * 80}px`,
                    minHeight: d.count > 0 ? '8px' : '2px',
                    backgroundColor: d.isToday ? 'var(--primary)' : 'var(--border)',
                  }}
                />
                <span className="text-xs" style={{ color: d.isToday ? 'var(--primary)' : 'var(--text-3)', fontWeight: d.isToday ? 700 : 400 }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>
            Nb. de séjours en cours par jour
          </p>
        </div>
      </div>

      {/* Chiffre d'affaires et encaissements de toute l'activité (règles : lib/finance.js) */}
      <div className="card mb-6">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>💰 Chiffre d'affaires et encaissements</h2>
              <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-3)' }}>Toute l'activité, {libellePeriode}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PERIODES.map(([key, label]) => (
                <button key={key} onClick={() => setPeriodeResto(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${periodeResto === key ? 'text-white' : 'border hover:opacity-80'}`}
                  style={periodeResto === key
                    ? { backgroundColor: 'var(--primary)' }
                    : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {!finPeriode ? (
            <p className="text-sm mt-4" style={{ color: 'var(--text-3)' }}>Calcul en cours…</p>
          ) : (
            <>
              {finPeriode.erreur && (
                <p className="text-xs mt-3 text-red-600">Certaines données n'ont pas pu être lues : {finPeriode.erreur}</p>
              )}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Chiffre d'affaires</p>
                  <p className="text-xl font-bold mt-1" style={{ color: 'var(--text)' }}>{formatFCFA(finPeriode.total.ca)}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Encaissé</p>
                  <p className="text-xl font-bold mt-1 text-green-600">{formatFCFA(finPeriode.total.encaisse)}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Reste à encaisser</p>
                  <p className="text-xl font-bold mt-1 text-yellow-600">{formatFCFA(finPeriode.total.reste)}</p>
                </div>
              </div>
              <div className="overflow-x-auto mt-4">
                <table className="w-full">
                  <thead style={{ backgroundColor: 'var(--bg-2)' }}>
                    <tr>
                      <th className="table-th">Activité</th>
                      <th className="table-th text-right">Nb</th>
                      <th className="table-th text-right">Chiffre d'affaires</th>
                      <th className="table-th text-right">Encaissé</th>
                      <th className="table-th text-right">Reste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SOURCES_CA.map(src => {
                      const l = finPeriode.parSource[src.cle]
                      return (
                        <tr key={src.cle} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                          <td className="table-td">{src.icone} {src.label}</td>
                          <td className="table-td text-right">{l.nb}</td>
                          <td className="table-td text-right font-medium whitespace-nowrap">{formatFCFA(l.ca)}</td>
                          <td className="table-td text-right text-green-600 whitespace-nowrap">{formatFCFA(l.encaisse)}</td>
                          <td className="table-td text-right text-yellow-600 whitespace-nowrap">{formatFCFA(l.reste)}</td>
                        </tr>
                      )
                    })}
                    <tr className="border-t-2 font-bold" style={{ borderColor: 'var(--border)' }}>
                      <td className="table-td">Total</td>
                      <td className="table-td text-right">{finPeriode.total.nb}</td>
                      <td className="table-td text-right whitespace-nowrap">{formatFCFA(finPeriode.total.ca)}</td>
                      <td className="table-td text-right text-green-600 whitespace-nowrap">{formatFCFA(finPeriode.total.encaisse)}</td>
                      <td className="table-td text-right text-yellow-600 whitespace-nowrap">{formatFCFA(finPeriode.total.reste)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>
                Commandes, ventes et séjours sont comptés une seule fois (leurs factures ne s'ajoutent pas). Hébergement : date d'arrivée, encaissé = avances. Événements : encaissé = acomptes. Annulations exclues.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Commandes (Restaurant & Bar + Boutique) : détail du chiffre d'affaires ci-dessus */}
      <div className="card mb-6">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-2)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>🧾 Commandes et chiffre d'affaires</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                {cmdValides.length} commande{cmdValides.length > 1 ? 's' : ''} {libellePeriode}
                {liste.length !== cmdValides.length && ` · ${liste.length - cmdValides.length} annulée${liste.length - cmdValides.length > 1 ? 's' : ''} non comptée${liste.length - cmdValides.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <Link href="/dashboard/restaurant" className="hover:underline" style={{ color: 'var(--primary)' }}>Restaurant & Bar →</Link>
              <Link href="/dashboard/boutique" className="hover:underline" style={{ color: 'var(--primary)' }}>Boutique →</Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {SOURCES.map(([key, label]) => (
              <button key={key} onClick={() => setSourceCmd(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${sourceCmd === key ? 'text-white' : 'border hover:opacity-80'}`}
                style={sourceCmd === key
                  ? { backgroundColor: '#0C3A3D' }
                  : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Chiffre d'affaires</p>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--text)' }}>{formatFCFA(totalResto)}</p>
              {sourceCmd === 'tous' && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                  Resto {formatFCFA(caRestaurant)} · Boutique {formatFCFA(caBoutique)}
                </p>
              )}
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Encaissé</p>
              <p className="text-xl font-bold mt-1 text-green-600">{formatFCFA(caEncaisse)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>À encaisser</p>
              <p className="text-xl font-bold mt-1 text-yellow-600">{formatFCFA(caAEncaisser)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Panier moyen</p>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--text)' }}>{formatFCFA(panierMoyen)}</p>
            </div>
          </div>
        </div>
        <div className="overflow-auto max-h-[28rem]">
          <table className="w-full">
            <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Date / Heure</th>
                <th className="table-th">Origine</th>
                <th className="table-th">Client</th>
                <th className="table-th">Numéro</th>
                <th className="table-th">Articles</th>
                <th className="table-th">Total</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-8" style={{ color: 'var(--text-3)' }}>
                  Aucune commande sur cette période
                </td></tr>
              ) : liste.slice(0, 300).map(c => (
                <tr key={`${c.source}-${c.id}`} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td text-xs whitespace-nowrap" style={{ color: 'var(--text-3)' }}>
                    {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="table-td text-xs whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                    {c.source === 'boutique' ? '🛍️ Boutique' : '🍽️ Resto & Bar'}
                  </td>
                  <td className="table-td font-medium" style={{ color: 'var(--text)' }}>
                    {c.nom_client}
                    {c.table_num && <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-3)' }}>· {c.table_num}</span>}
                  </td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{c.telephone || '—'}</td>
                  <td className="table-td text-xs" style={{ color: 'var(--text-2)' }}>
                    {(c.lignes || []).map(l => `${l.nom} ×${l.qte}`).join(', ') || '—'}
                  </td>
                  <td className="table-td font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>{formatFCFA(c.montant_total)}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUT_RESTO_COLORS[c.statut]}`}>{STATUT_RESTO[c.statut] || c.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prochains séjours */}
      <div className="card">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-2)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Prochains séjours</h2>
          <Link href="/dashboard/reservations" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>
            Voir tout →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Client</th>
                <th className="table-th">Duplex</th>
                <th className="table-th">Dates</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length === 0 ? (
                <tr><td colSpan={4} className="table-td text-center py-8" style={{ color: 'var(--text-3)' }}>
                  Aucune réservation à venir
                </td></tr>
              ) : upcoming.map(r => (
                <tr key={r.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td font-medium" style={{ color: 'var(--text)' }}>{r.nom_client}</td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{r.duplex_id || '—'}</td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>
                    {formatDateShort(r.date_arrivee)} → {formatDateShort(r.date_depart)}
                  </td>
                  <td className="table-td">
                    <span className={`badge ${STATUT_COLORS[r.statut]}`}>{STATUT_LABELS[r.statut]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
