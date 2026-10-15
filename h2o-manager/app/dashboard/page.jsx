'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatFCFA, formatDateShort, STATUT_COLORS, STATUT_LABELS } from '@/lib/utils'
import Link from 'next/link'

export default function Dashboard() {
  const supabase = createClient()
  const [stats,    setStats]    = useState({ occupation: 0, sejours: 0, revenu: 0, totalDuplexes: 0 })
  const [today,    setToday]    = useState({ arrivals: [], departures: [] })
  const [upcoming, setUpcoming] = useState([])
  const [weekData, setWeekData] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { loadData() }, [])

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

    const startOfMonth = new Date(); startOfMonth.setDate(1)
    const { data: monthRevenu } = await supabase
      .from('factures')
      .select('montant_total')
      .eq('statut', 'paye')
      .gte('created_at', startOfMonth.toISOString())
    const revenu = (monthRevenu || []).reduce((s, f) => s + (f.montant_total || 0), 0)

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

    setStats({ occupation: Math.round((occupied / total) * 100), sejours: enSejour, revenu, totalDuplexes: total })
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
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Revenus du mois</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--success)' }}>{formatFCFA(stats.revenu)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Factures encaissées</p>
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
