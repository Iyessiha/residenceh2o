'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatFCFA } from '@/lib/utils'

export default function Rapports() {
  const supabase = createClient()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('mois') // mois | trimestre | annee

  useEffect(() => { load() }, [periode])

  async function load() {
    setLoading(true)
    const now = new Date()
    let from

    if (periode === 'mois') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (periode === 'trimestre') {
      const q = Math.floor(now.getMonth() / 3)
      from = new Date(now.getFullYear(), q * 3, 1).toISOString()
    } else {
      from = new Date(now.getFullYear(), 0, 1).toISOString()
    }

    const [resvRes, factRes, duplexRes, evtRes] = await Promise.all([
      supabase.from('reservations').select('statut, montant_total, date_arrivee, date_depart, duplex_id').gte('created_at', from),
      supabase.from('factures').select('statut, montant_total, type_prestation').gte('created_at', from),
      supabase.from('duplexes').select('code, statut'),
      supabase.from('evenements').select('statut, montant_devis').gte('date_evenement', from),
    ])

    const reservations = resvRes.data || []
    const factures = factRes.data || []
    const duplexes = duplexRes.data || []
    const evenements = evtRes.data || []

    const revenuTotal = factures.filter(f => f.statut === 'paye').reduce((s, f) => s + (f.montant_total || 0), 0)
    const revenuSejour = factures.filter(f => f.statut === 'paye' && f.type_prestation === 'sejour').reduce((s, f) => s + (f.montant_total || 0), 0)
    const revenuEvenement = factures.filter(f => f.statut === 'paye' && f.type_prestation === 'evenement').reduce((s, f) => s + (f.montant_total || 0), 0)
    const totalDuplexes = duplexes.length || 1
    const occupes = duplexes.filter(d => d.statut === 'occupe').length

    const nbSejours = reservations.filter(r => ['confirme', 'en_sejour', 'cloture'].includes(r.statut)).length
    const nbEvenements = evenements.filter(e => ['confirme', 'termine'].includes(e.statut)).length

    const durations = reservations
      .filter(r => r.date_arrivee && r.date_depart)
      .map(r => (new Date(r.date_depart) - new Date(r.date_arrivee)) / 86400000)
    const avgDuration = durations.length ? (durations.reduce((s, d) => s + d, 0) / durations.length).toFixed(1) : '—'

    // Occupation par duplex
    const byDuplex = {}
    duplexes.forEach(d => { byDuplex[d.code] = 0 })
    reservations.filter(r => r.duplex_id).forEach(r => {
      if (byDuplex[r.duplex_id] !== undefined) byDuplex[r.duplex_id]++
      else byDuplex[r.duplex_id] = 1
    })

    setData({ revenuTotal, revenuSejour, revenuEvenement, totalDuplexes, occupes, nbSejours, nbEvenements, avgDuration, byDuplex })
    setLoading(false)
  }

  const PERIODE_LABELS = { mois: 'Ce mois', trimestre: 'Ce trimestre', annee: 'Cette année' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Analytics</h1>
        <div className="flex gap-2">
          {Object.entries(PERIODE_LABELS).map(([v, l]) => (
            <button key={v} onClick={() => setPeriode(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${periode === v ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement des données...</div>
      ) : !data ? null : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Revenus totaux</p>
              <p className="text-2xl font-bold text-green-600">{formatFCFA(data.revenuTotal)}</p>
              <p className="text-xs text-gray-400 mt-1">{PERIODE_LABELS[periode]}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Taux d'occupation</p>
              <p className="text-2xl font-bold text-teal-600">{data.totalDuplexes ? Math.round((data.occupes / data.totalDuplexes) * 100) : 0}%</p>
              <p className="text-xs text-gray-400 mt-1">{data.occupes}/{data.totalDuplexes} duplexes</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Séjours</p>
              <p className="text-2xl font-bold text-blue-600">{data.nbSejours}</p>
              <p className="text-xs text-gray-400 mt-1">Durée moy. {data.avgDuration} nuits</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Événements</p>
              <p className="text-2xl font-bold text-purple-600">{data.nbEvenements}</p>
              <p className="text-xs text-gray-400 mt-1">{formatFCFA(data.revenuEvenement)}</p>
            </div>
          </div>

          {/* Revenue breakdown */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Répartition des revenus</h3>
              <div className="space-y-3">
                {[
                  { label: 'Séjours duplexes', value: data.revenuSejour, color: 'bg-teal-500' },
                  { label: 'Événements / Pergola', value: data.revenuEvenement, color: 'bg-purple-500' },
                  { label: 'Autres', value: data.revenuTotal - data.revenuSejour - data.revenuEvenement, color: 'bg-gray-300' },
                ].map(item => {
                  const pct = data.revenuTotal ? Math.round((item.value / data.revenuTotal) * 100) : 0
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold">{formatFCFA(item.value)} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Réservations par duplex</h3>
              {Object.keys(data.byDuplex).length === 0 ? (
                <p className="text-gray-400 text-sm">Aucune donnée sur la période</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.byDuplex).sort((a, b) => b[1] - a[1]).map(([code, count]) => {
                    const max = Math.max(...Object.values(data.byDuplex)) || 1
                    return (
                      <div key={code}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 font-medium">{code}</span>
                          <span className="font-semibold">{count} réservation{count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Export note */}
          <div className="card p-4 flex items-center gap-3 text-sm text-gray-500 bg-gray-50">
            <span className="text-xl">📊</span>
            <p>Pour exporter ce rapport en PDF, utilisez la fonction d'impression de votre navigateur (Ctrl+P / Cmd+P) et choisissez "Enregistrer en PDF".</p>
          </div>
        </>
      )}
    </div>
  )
}
