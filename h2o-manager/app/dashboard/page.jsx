'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { formatFCFA, formatDateShort, STATUT_COLORS, STATUT_LABELS } from '@/lib/utils'
import { chargerFinances, chargerTresorerie, bornesPeriode, ymd, SOURCES as SOURCES_CA } from '@/lib/finance'
import { useRole, estGestion } from '@/lib/useRole'
import Link from 'next/link'

// Raccourcis : une seule ligne compacte sous l'en-tête
const ACTIONS_RAPIDES = [
  { href: '/dashboard/reservations?new=1', icon: '📅', label: 'Réservation' },
  { href: '/dashboard/facturation', icon: '🧾', label: 'Facture' },
  { href: '/dashboard/restaurant', icon: '🍽️', label: 'Commande resto' },
  { href: '/dashboard/boutique', icon: '🛍️', label: 'Vente boutique' },
  { href: '/dashboard/evenements', icon: '🎪', label: 'Événement' },
  { href: '/dashboard/clients', icon: '👥', label: 'Client' },
]

const PERIODES = [['jour', "Aujourd'hui"], ['semaine', '7 jours'], ['mois', 'Ce mois'], ['tout', 'Tout']]
const LIBELLE_PERIODE = { jour: "aujourd'hui", semaine: 'sur 7 jours', mois: 'ce mois-ci', tout: 'au total' }
const SOURCES_CMD = [['tous', 'Tout'], ['restaurant', '🍽️ Restaurant & Bar'], ['boutique', '🛍️ Boutique']]
const STATUT_CMD = { en_cours: 'En cours', servie: 'Servie', en_attente: 'En attente', payee: 'Payée', annulee: 'Annulée' }
const STATUT_CMD_COLORS = {
  en_cours: 'bg-yellow-100 text-yellow-800', en_attente: 'bg-yellow-100 text-yellow-800',
  servie: 'bg-blue-100 text-blue-700', payee: 'bg-green-100 text-green-800', annulee: 'bg-gray-100 text-gray-500',
}
const NB_COMMANDES_VISIBLES = 8

const titreSection = { color: 'var(--text)' }
const texte3 = { color: 'var(--text-3)' }

function Kpi({ titre, valeur, detail, couleur, className = '' }) {
  return (
    <div className={`card p-4 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={texte3}>{titre}</p>
      <p className="text-xl sm:text-2xl lg:text-xl 2xl:text-2xl font-bold mt-1 leading-tight" style={{ color: couleur || 'var(--text)' }}>{valeur}</p>
      {detail && <p className="text-xs mt-1" style={texte3}>{detail}</p>}
    </div>
  )
}

function Pastille({ href, icone, label, valeur, actif }) {
  return (
    <Link href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-shadow hover:shadow-md"
      style={{
        borderColor: actif ? 'var(--primary)' : 'var(--border)',
        backgroundColor: actif ? 'var(--primary-lt)' : 'var(--bg)',
      }}>
      <span className="text-xl">{icone}</span>
      <span className="min-w-0">
        <span className="block text-lg font-bold leading-none" style={{ color: actif ? 'var(--primary-dk)' : 'var(--text)' }}>{valeur}</span>
        <span className="block text-xs mt-1 leading-tight" style={texte3}>{label}</span>
      </span>
    </Link>
  )
}

function ListeMouvements({ titre, couleur, items, vide }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: couleur }}>{titre} ({items.length})</p>
      {items.length === 0 ? (
        <p className="text-xs" style={texte3}>{vide}</p>
      ) : items.map(r => (
        <div key={r.id} className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs text-white font-bold"
            style={{ backgroundColor: couleur }}>
            {r.nom_client?.[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{r.nom_client}</p>
            <p className="text-xs truncate" style={texte3}>{[r.duplex_id, r.telephone].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const supabase = createClient()
  const [periode, setPeriode] = useState('mois')
  const [stats, setStats] = useState({ occupees: 0, total: 0, sejours: 0 })
  const [aujourdhui, setAujourdhui] = useState({ arrivees: [], departs: [] })
  const [aVenir, setAVenir] = useState([])
  const [semaine, setSemaine] = useState([])
  const [alertes, setAlertes] = useState({ commandes: 0, assistance: 0, enAttente: 0, commissions: 0 })
  const [cmdResto, setCmdResto] = useState([])
  const [ventes, setVentes] = useState([])
  const [fin, setFin] = useState(null)
  const [treso, setTreso] = useState(null)   // dépenses / recettes (admin et gérance uniquement)
  const role = useRole()
  const gestion = estGestion(role)
  const [sourceCmd, setSourceCmd] = useState('tous')
  const [toutVoir, setToutVoir] = useState(false)
  const [chargement, setChargement] = useState(true)

  // Occupation, arrivées/départs, prochains séjours, points à traiter : indépendants de la période
  const chargerActivite = useCallback(async () => {
    const aujourdhuiStr = ymd(new Date())
    const debutSemaine = new Date(); debutSemaine.setDate(debutSemaine.getDate() - 6)
    const compter = (table, filtre) => filtre(supabase.from(table).select('id', { count: 'exact', head: true }))

    const [duplexes, arrivees, departs, prochains, recents, cEnCours, assistance, enAttente, enSejour, commissions] = await Promise.all([
      supabase.from('duplexes').select('id, statut'),
      supabase.from('reservations').select('id, nom_client, duplex_id, telephone')
        .eq('date_arrivee', aujourdhuiStr).not('statut', 'in', '("annule","cloture")'),
      supabase.from('reservations').select('id, nom_client, duplex_id, telephone')
        .eq('date_depart', aujourdhuiStr).not('statut', 'in', '("annule","cloture")'),
      supabase.from('reservations').select('*')
        .in('statut', ['confirme', 'en_sejour', 'en_attente']).gte('date_depart', aujourdhuiStr)
        .order('date_arrivee', { ascending: true }).limit(6),
      supabase.from('reservations').select('date_arrivee, date_depart, statut')
        .lte('date_arrivee', aujourdhuiStr).gte('date_depart', ymd(debutSemaine)).neq('statut', 'annule').limit(2000),
      compter('commandes_restaurant', q => q.eq('statut', 'en_cours')),
      compter('demandes_assistance', q => q.eq('statut', 'nouveau')),
      compter('reservations', q => q.eq('statut', 'en_attente')),
      compter('reservations', q => q.eq('statut', 'en_sejour')),
      supabase.from('reservations').select('commission_montant').eq('commission_statut', 'a_payer').limit(2000),
    ])

    const liste = duplexes.data || []
    const jours = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = ymd(d)
      const nb = (recents.data || []).filter(r => r.date_arrivee <= ds && r.date_depart > ds).length
      jours.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), nb, aujourdhui: i === 0 })
    }

    setStats({
      occupees: liste.filter(d => d.statut === 'occupe').length,
      total: liste.length,
      sejours: enSejour.count || 0,
    })
    setAujourdhui({ arrivees: arrivees.data || [], departs: departs.data || [] })
    setAVenir(prochains.data || [])
    setSemaine(jours)
    setAlertes({
      commandes: cEnCours.count || 0,
      assistance: assistance.count || 0,
      enAttente: enAttente.count || 0,
      commissions: (commissions.data || []).reduce((s, r) => s + (r.commission_montant || 0), 0),
    })
    setChargement(false)
  }, [])

  // Chiffre d'affaires, encaissements et commandes de la période choisie (mêmes règles partout : lib/finance)
  const chargerPeriode = useCallback(async () => {
    const { debut, fin: finPeriode } = bornesPeriode(periode)
    const charger = (table) => {
      let q = supabase.from(table)
        .select('id, nom_client, telephone, lignes, montant_total, statut, created_at' + (table === 'commandes_restaurant' ? ', table_num' : ''))
        .order('created_at', { ascending: false }).limit(2000)
      if (debut) q = q.gte('created_at', debut.toISOString())
      if (finPeriode) q = q.lt('created_at', finPeriode.toISOString())
      return q
    }
    const [resto, boutique, finances, tresorerie] = await Promise.all([
      charger('commandes_restaurant'), charger('ventes'), chargerFinances(supabase, periode),
      gestion ? chargerTresorerie(supabase, periode) : Promise.resolve(null),
    ])
    setCmdResto(resto.data || [])
    setVentes(boutique.data || [])
    setFin(finances)
    setTreso(tresorerie)
  }, [periode, gestion])

  useEffect(() => { chargerActivite() }, [chargerActivite])
  useEffect(() => { chargerPeriode() }, [chargerPeriode])

  // Mise à jour en direct dès qu'une réservation, commande, vente, facture ou demande change
  useEffect(() => {
    // Plusieurs changements d'affilée (facture + commande + notification…) ne relancent qu'un seul rechargement
    let minuteur
    const maj = () => { clearTimeout(minuteur); minuteur = setTimeout(() => { chargerActivite(); chargerPeriode() }, 700) }
    let channel = supabase.channel('dashboard_direct')
    for (const table of ['commandes_restaurant', 'ventes', 'reservations', 'factures', 'demandes_assistance', 'tresorerie']) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, maj)
    }
    channel.subscribe()
    return () => { clearTimeout(minuteur); supabase.removeChannel(channel) }
  }, [chargerActivite, chargerPeriode])

  if (chargement) return (
    <div className="flex items-center justify-center h-64" style={texte3}>
      <span className="animate-spin text-2xl mr-3">⏳</span> Chargement…
    </div>
  )

  const total = fin?.total
  const tauxEncaisse = total && total.ca > 0 ? Math.round((total.encaisse / total.ca) * 100) : 0
  const tauxOccupation = stats.total ? Math.round((stats.occupees / stats.total) * 100) : 0
  const maxSemaine = Math.max(...semaine.map(d => d.nb), 1)

  const toutes = [
    ...cmdResto.map(c => ({ ...c, source: 'restaurant' })),
    ...ventes.map(v => ({ ...v, source: 'boutique' })),
  ].sort((x, y) => (x.created_at < y.created_at ? 1 : -1))
  const liste = sourceCmd === 'tous' ? toutes : toutes.filter(c => c.source === sourceCmd)
  const valides = liste.filter(c => c.statut !== 'annulee')
  const panierMoyen = valides.length ? Math.round(valides.reduce((t, c) => t + (c.montant_total || 0), 0) / valides.length) : 0
  const visibles = toutVoir ? liste.slice(0, 300) : liste.slice(0, NB_COMMANDES_VISIBLES)

  const maintenant = new Date()
  const dateLongue = maintenant.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5 min-w-0">
      {/* En-tête + période (la période s'applique à tous les chiffres ci-dessous) */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={titreSection}>Tableau de bord</h1>
          <p className="text-sm capitalize mt-0.5" style={texte3}>{dateLongue}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border p-0.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
            {PERIODES.map(([cle, label]) => (
              <button key={cle} onClick={() => setPeriode(cle)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={periode === cle ? { backgroundColor: 'var(--primary)', color: '#fff' } : { color: 'var(--text-2)' }}>
                {label}
              </button>
            ))}
          </div>
          <Link href="/dashboard/reservations?new=1" className="btn-primary">+ Nouvelle réservation</Link>
        </div>
      </div>

      {/* Raccourcis */}
      <div className="flex gap-2 overflow-x-auto pb-1 min-w-0">
        {ACTIONS_RAPIDES.map(a => (
          <Link key={a.href} href={a.href}
            className="shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold hover:shadow-sm transition-shadow"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}>
            <span>{a.icon}</span>{a.label}
          </Link>
        ))}
      </div>

      {/* Chiffres clés */}
      <div className={`grid grid-cols-2 gap-3 ${gestion ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
        <Kpi titre="Chiffre d'affaires" valeur={total ? formatFCFA(total.ca) : '…'}
          detail={total ? `${total.nb} opération${total.nb > 1 ? 's' : ''} ${LIBELLE_PERIODE[periode]}` : null} />
        <Kpi titre="Encaissé" valeur={total ? formatFCFA(total.encaisse) : '…'} couleur="var(--success)"
          detail={total ? `${tauxEncaisse} % du chiffre d'affaires` : null} />
        <Kpi titre="Reste à encaisser" valeur={total ? formatFCFA(total.reste) : '…'} couleur="#B45309"
          detail="Avances, commandes non payées, acomptes" />
        <Kpi titre="Occupation" valeur={`${tauxOccupation} %`} couleur="var(--primary-dk)"
          detail={`${stats.occupees} / ${stats.total} villa${stats.total > 1 ? 's' : ''} occupée${stats.occupees > 1 ? 's' : ''}`} />
        <Kpi titre="Séjours en cours" valeur={stats.sejours} couleur="#2563EB" detail="Clients présents" className={gestion ? '' : 'col-span-2 lg:col-span-1'} />
        {gestion && (
          <Link href="/dashboard/tresorerie" className="block min-w-0">
            <Kpi titre="Dépenses" valeur={treso ? formatFCFA(treso.depenses) : '…'} couleur="#DC2626" className="h-full"
              detail={treso ? (treso.nbDepenses > 0 ? `${treso.nbDepenses} dépense${treso.nbDepenses > 1 ? 's' : ''} ${LIBELLE_PERIODE[periode]}` : `Aucune dépense ${LIBELLE_PERIODE[periode]}`) : null} />
          </Link>
        )}
      </div>

      {/* Aujourd'hui + répartition du chiffre d'affaires */}
      <div className="grid lg:grid-cols-5 gap-5">
        <div className="card p-5 lg:col-span-3 space-y-5 min-w-0">
          <div>
            <h2 className="font-semibold mb-3" style={titreSection}>À traiter</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Pastille href="/dashboard/restaurant" icone="🍽️" label="Commandes en cours" valeur={alertes.commandes} actif={alertes.commandes > 0} />
              <Pastille href="/dashboard/assistance" icone="🔔" label="Demandes d'assistance" valeur={alertes.assistance} actif={alertes.assistance > 0} />
              <Pastille href="/dashboard/reservations" icone="📅" label="Réservations en attente" valeur={alertes.enAttente} actif={alertes.enAttente > 0} />
              <Pastille href="/dashboard/demarcheurs" icone="🤝" label="Commissions à payer" valeur={formatFCFA(alertes.commissions)} actif={alertes.commissions > 0} />
            </div>
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'var(--border-2)' }}>
            <h2 className="font-semibold mb-3" style={titreSection}>
              Aujourd'hui <span className="text-sm font-normal" style={texte3}>· arrivées et départs</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <ListeMouvements titre="▲ Arrivées" couleur="var(--success)" items={aujourdhui.arrivees} vide="Aucune arrivée" />
              <ListeMouvements titre="▼ Départs" couleur="var(--primary)" items={aujourdhui.departs} vide="Aucun départ" />
            </div>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2 min-w-0">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-semibold" style={titreSection}>Chiffre d'affaires par activité</h2>
            <span className="text-xs" style={texte3}>{LIBELLE_PERIODE[periode]}</span>
          </div>
          {!fin ? (
            <p className="text-sm" style={texte3}>Calcul en cours…</p>
          ) : (
            <div className="space-y-3.5">
              {fin.erreur && <p className="text-xs text-red-600">Données partielles : {fin.erreur}</p>}
              {SOURCES_CA.map(src => {
                const l = fin.parSource[src.cle]
                const part = total.ca > 0 ? (l.ca / total.ca) * 100 : 0
                return (
                  <div key={src.cle}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span style={{ color: 'var(--text-2)' }}>{src.icone} {src.label}</span>
                      <span className="font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>{formatFCFA(l.ca)}</span>
                    </div>
                    <div className="h-2 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: 'var(--bg-2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${part}%`, backgroundColor: 'var(--primary)' }} />
                    </div>
                    <p className="text-xs mt-1" style={texte3}>
                      Encaissé {formatFCFA(l.encaisse)}{l.reste > 0 ? ` · reste ${formatFCFA(l.reste)}` : ''} · {l.nb}
                    </p>
                  </div>
                )
              })}
              <p className="text-xs pt-2 border-t" style={{ ...texte3, borderColor: 'var(--border-2)' }}>
                Chaque opération est comptée une seule fois. Hébergement : date d'arrivée, encaissé = avances. Annulations exclues.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prochains séjours + occupation */}
      <div className="grid lg:grid-cols-5 gap-5">
        <div className="card lg:col-span-3 min-w-0">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-2)' }}>
            <h2 className="font-semibold" style={titreSection}>Prochains séjours</h2>
            <Link href="/dashboard/reservations" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>Voir tout →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-2)' }}>
                <tr>
                  <th className="table-th">Client</th>
                  <th className="table-th">Hébergement</th>
                  <th className="table-th">Dates</th>
                  <th className="table-th">Paiement</th>
                  <th className="table-th">Statut</th>
                </tr>
              </thead>
              <tbody>
                {aVenir.length === 0 ? (
                  <tr><td colSpan={5} className="table-td text-center py-8" style={texte3}>Aucune réservation à venir</td></tr>
                ) : aVenir.map(r => {
                  const reste = Math.max(0, (r.montant_total || 0) - (r.avance || 0))
                  return (
                    <tr key={r.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                      <td className="table-td font-medium" style={{ color: 'var(--text)' }}>{r.nom_client}</td>
                      <td className="table-td" style={{ color: 'var(--text-2)' }}>
                        {r.duplex_id || r.notes?.match(/^Chambre souhait[ée]e? : (.+?)(\n|$)/i)?.[1] || '—'}
                      </td>
                      <td className="table-td whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                        {formatDateShort(r.date_arrivee)} → {formatDateShort(r.date_depart)}
                      </td>
                      <td className="table-td whitespace-nowrap">
                        {r.montant_total > 0
                          ? (reste > 0
                              ? <span className="badge bg-amber-100 text-amber-800">Reste {formatFCFA(reste)}</span>
                              : <span className="badge bg-green-100 text-green-700">Soldé</span>)
                          : <span style={texte3}>—</span>}
                      </td>
                      <td className="table-td"><span className={`badge ${STATUT_COLORS[r.statut]}`}>{STATUT_LABELS[r.statut]}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2 min-w-0">
          <h2 className="font-semibold mb-4" style={titreSection}>Séjours sur 7 jours</h2>
          <div className="flex items-end gap-2 h-32">
            {semaine.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{d.nb}</span>
                <div className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${(d.nb / maxSemaine) * 80}%`, minHeight: 4,
                    backgroundColor: d.aujourdhui ? 'var(--primary)' : 'var(--primary-lt)',
                    border: '1px solid var(--primary)',
                  }} />
                <span className="text-xs capitalize" style={d.aujourdhui ? { color: 'var(--primary-dk)', fontWeight: 700 } : texte3}>{d.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={texte3}>Nombre de séjours présents chaque jour</p>
        </div>
      </div>

      {/* Dépenses et résultat (admin et gérance) */}
      {gestion && (
        <div className="grid lg:grid-cols-5 gap-5">
          <div className="card p-5 lg:col-span-2 min-w-0">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-semibold" style={titreSection}>Dépenses et résultat</h2>
              <span className="text-xs" style={texte3}>{LIBELLE_PERIODE[periode]}</span>
            </div>
            {!treso || !fin ? (
              <p className="text-sm" style={texte3}>Calcul en cours…</p>
            ) : (() => {
              const resultat = fin.total.encaisse + treso.recettes - treso.depenses
              const ligneRes = (label, valeur, couleur, signe) => (
                <div className="flex items-baseline justify-between text-sm">
                  <span style={{ color: 'var(--text-2)' }}>{label}</span>
                  <span className="font-semibold whitespace-nowrap" style={{ color: couleur }}>{signe}{formatFCFA(valeur)}</span>
                </div>
              )
              return (
                <div className="space-y-2.5">
                  {treso.erreur && <p className="text-xs text-red-600">Dépenses non lues : {treso.erreur}</p>}
                  {ligneRes('Encaissé clients', fin.total.encaisse, 'var(--success)', '+ ')}
                  {ligneRes('Autres recettes', treso.recettes, 'var(--success)', '+ ')}
                  {ligneRes('Dépenses', treso.depenses, '#DC2626', '− ')}
                  <div className="flex items-baseline justify-between pt-3 mt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span className="font-semibold" style={titreSection}>Résultat</span>
                    <span className="text-xl font-bold whitespace-nowrap" style={{ color: resultat < 0 ? '#DC2626' : 'var(--success)' }}>{formatFCFA(resultat)}</span>
                  </div>
                  <p className="text-xs" style={texte3}>Encaissements − dépenses de la période (salaires inclus dès qu'une fiche de paie est payée).</p>
                </div>
              )
            })()}
          </div>

          <div className="card p-5 lg:col-span-3 min-w-0">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-semibold" style={titreSection}>Dépenses par catégorie</h2>
              <Link href="/dashboard/tresorerie" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>Trésorerie →</Link>
            </div>
            {!treso ? (
              <p className="text-sm" style={texte3}>Calcul en cours…</p>
            ) : treso.parCategorie.length === 0 ? (
              <div className="text-sm" style={texte3}>
                Aucune dépense enregistrée {LIBELLE_PERIODE[periode]}.{' '}
                <Link href="/dashboard/tresorerie" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>Ajouter une dépense →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {treso.parCategorie.slice(0, 6).map(([categorie, montant]) => {
                  const part = treso.depenses > 0 ? (montant / treso.depenses) * 100 : 0
                  return (
                    <div key={categorie}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="truncate pr-2" style={{ color: 'var(--text-2)' }}>{categorie}</span>
                        <span className="font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                          {formatFCFA(montant)} <span className="text-xs font-normal" style={texte3}>({Math.round(part)} %)</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: 'var(--bg-2)' }}>
                        <div className="h-full rounded-full" style={{ width: `${part}%`, backgroundColor: '#DC2626' }} />
                      </div>
                    </div>
                  )
                })}
                {treso.parCategorie.length > 6 && (
                  <p className="text-xs" style={texte3}>+ {treso.parCategorie.length - 6} autre{treso.parCategorie.length - 6 > 1 ? 's' : ''} catégorie{treso.parCategorie.length - 6 > 1 ? 's' : ''} · {treso.nbDepenses} dépense{treso.nbDepenses > 1 ? 's' : ''} au total</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commandes : les dernières, la liste complète au clic */}
      <div className="card">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-2)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold" style={titreSection}>🧾 Commandes {LIBELLE_PERIODE[periode]}</h2>
              <p className="text-xs mt-0.5" style={texte3}>
                {valides.length} commande{valides.length > 1 ? 's' : ''} · panier moyen {formatFCFA(panierMoyen)}
                {liste.length !== valides.length && ` · ${liste.length - valides.length} annulée${liste.length - valides.length > 1 ? 's' : ''} non comptée${liste.length - valides.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOURCES_CMD.map(([cle, label]) => (
                <button key={cle} onClick={() => { setSourceCmd(cle); setToutVoir(false) }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${sourceCmd === cle ? 'text-white' : 'border hover:opacity-80'}`}
                  style={sourceCmd === cle
                    ? { backgroundColor: '#0C3A3D' }
                    : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Date / Heure</th>
                <th className="table-th">Origine</th>
                <th className="table-th">Client</th>
                <th className="table-th">Téléphone</th>
                <th className="table-th">Articles</th>
                <th className="table-th">Total</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-8" style={texte3}>Aucune commande sur cette période</td></tr>
              ) : visibles.map(c => (
                <tr key={`${c.source}-${c.id}`} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td text-xs whitespace-nowrap" style={texte3}>
                    {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="table-td text-xs whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                    {c.source === 'boutique' ? '🛍️ Boutique' : '🍽️ Resto & Bar'}
                  </td>
                  <td className="table-td font-medium" style={{ color: 'var(--text)' }}>
                    {c.nom_client}
                    {c.table_num && <span className="text-xs font-normal ml-1" style={texte3}>· {c.table_num}</span>}
                  </td>
                  <td className="table-td whitespace-nowrap" style={{ color: 'var(--text-2)' }}>{c.telephone || '—'}</td>
                  <td className="table-td text-xs" style={{ color: 'var(--text-2)' }}>
                    {(c.lignes || []).map(l => `${l.nom} ×${l.qte}`).join(', ') || '—'}
                  </td>
                  <td className="table-td font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>{formatFCFA(c.montant_total)}</td>
                  <td className="table-td"><span className={`badge ${STATUT_CMD_COLORS[c.statut]}`}>{STATUT_CMD[c.statut] || c.statut}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'var(--border-2)' }}>
          {liste.length > NB_COMMANDES_VISIBLES ? (
            <button onClick={() => setToutVoir(v => !v)} className="text-sm font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
              {toutVoir ? 'Réduire la liste' : `Afficher les ${liste.length} commandes`}
            </button>
          ) : <span />}
          <div className="flex gap-4 text-sm">
            <Link href="/dashboard/restaurant" className="hover:underline" style={{ color: 'var(--primary)' }}>Restaurant & Bar →</Link>
            <Link href="/dashboard/boutique" className="hover:underline" style={{ color: 'var(--primary)' }}>Boutique →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
