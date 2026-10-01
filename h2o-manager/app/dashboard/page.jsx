'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatFCFA, formatDateShort, STATUT_COLORS, STATUT_LABELS } from '@/lib/utils'
import Link from 'next/link'

export default function Dashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ occupation: 0, sejours: 0, revenu: 0, totalDuplexes: 0 })
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const today = new Date().toISOString().split('T')[0]

    const [duplexRes, resvRes] = await Promise.all([
      supabase.from('duplexes').select('id, statut'),
      supabase.from('reservations')
        .select('id, nom_client, duplex_id, date_arrivee, date_depart, statut, montant_total')
        .in('statut', ['confirme', 'en_sejour', 'en_attente'])
        .order('date_arrivee', { ascending: true })
        .limit(10),
    ])

    const duplexes = duplexRes.data || []
    const reservations = resvRes.data || []

    const total = duplexes.length || 1
    const occupied = duplexes.filter(d => d.statut === 'occupe').length
    const enSejour = reservations.filter(r => r.statut === 'en_sejour').length

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    const { data: monthRevenu } = await supabase
      .from('factures')
      .select('montant_total')
      .eq('statut', 'paye')
      .gte('created_at', startOfMonth.toISOString())
    const revenu = (monthRevenu || []).reduce((s, f) => s + (f.montant_total || 0), 0)

    setStats({ occupation: Math.round((occupied / total) * 100), sejours: enSejour, revenu, totalDuplexes: total })
    setUpcoming(reservations.slice(0, 6))
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <span className="animate-spin text-2xl mr-3">⏳</span> Chargement...
    </div>
  )

  const today = new Date()
  const monthLabel = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm capitalize">{monthLabel}</p>
        </div>
        <Link href="/dashboard/reservations?new=1" className="btn-primary">
          + Nouvelle réservation
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Taux d'occupation</p>
          <p className="text-3xl font-bold text-teal-600">{stats.occupation}%</p>
          <p className="text-xs text-gray-400 mt-1">{stats.totalDuplexes} duplexes au total</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Séjours en cours</p>
          <p className="text-3xl font-bold text-blue-600">{stats.sejours}</p>
          <p className="text-xs text-gray-400 mt-1">Clients présents aujourd'hui</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Revenus du mois</p>
          <p className="text-3xl font-bold text-green-600">{formatFCFA(stats.revenu)}</p>
          <p className="text-xs text-gray-400 mt-1">Factures encaissées</p>
        </div>
      </div>

      {/* Upcoming */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Prochains départs & arrivées</h2>
          <Link href="/dashboard/reservations" className="text-teal-600 text-sm hover:underline">Voir tout</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Client</th>
                <th className="table-th">Duplex</th>
                <th className="table-th">Dates</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {upcoming.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-td text-center text-gray-400 py-8">
                    Aucune réservation à venir
                  </td>
                </tr>
              ) : upcoming.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="table-td font-medium">{r.nom_client}</td>
                  <td className="table-td text-gray-500">{r.duplex_id || '—'}</td>
                  <td className="table-td text-gray-500">
                    {formatDateShort(r.date_arrivee)} → {formatDateShort(r.date_depart)}
                  </td>
                  <td className="table-td">
                    <span className={`badge ${STATUT_COLORS[r.statut]}`}>
                      {STATUT_LABELS[r.statut]}
                    </span>
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
