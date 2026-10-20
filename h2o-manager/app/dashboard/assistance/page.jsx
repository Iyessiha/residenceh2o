'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const STATUTS = { nouveau: 'Nouveau', en_cours: 'En cours', resolu: 'Résolu' }
const STATUT_COLORS = {
  nouveau:  'bg-red-100 text-red-700',
  en_cours: 'bg-yellow-100 text-yellow-800',
  resolu:   'bg-green-100 text-green-800',
}

export default function Assistance() {
  const supabase = createClient()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('actifs') // 'actifs' | 'tous' | statut

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('demandes_assistance').select('*').order('created_at', { ascending: false })
    if (filter === 'actifs')      q = q.in('statut', ['nouveau', 'en_cours'])
    else if (filter !== 'tous')   q = q.eq('statut', filter)
    const { data } = await q
    setDemandes(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  // Realtime : rafraîchir dès qu'une demande arrive via le guest portal
  useEffect(() => {
    const channel = supabase
      .channel('demandes_assistance_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'demandes_assistance' }, () => {
        load()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  async function updateStatut(id, statut) {
    await supabase.from('demandes_assistance').update({ statut }).eq('id', id)
    load()
  }

  const countNew = demandes.filter(d => d.statut === 'nouveau').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Demandes d'assistance</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Requêtes envoyées par les clients via le portail invité
          </p>
        </div>
        {countNew > 0 && (
          <span className="px-3 py-1.5 rounded-full text-sm font-bold text-white animate-pulse"
            style={{ backgroundColor: '#DC2626' }}>
            {countNew} nouvelle{countNew > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          ['actifs', 'En attente'],
          ['tous',   'Toutes'],
          ['nouveau',  'Nouvelles'],
          ['en_cours', 'En cours'],
          ['resolu',   'Résolues'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === key ? 'text-white' : 'border hover:opacity-80'}`}
            style={filter === key ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>Chargement…</div>
      ) : demandes.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Aucune demande en attente</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Tout est tranquille côté clients.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {demandes.map(d => (
            <div key={d.id} className={`card p-5 border-l-4 ${d.statut === 'nouveau' ? 'border-l-red-500' : d.statut === 'en_cours' ? 'border-l-yellow-400' : 'border-l-green-500'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-bold text-sm px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--primary-lt)', color: 'var(--primary)' }}>
                      {d.duplex_code || '—'} — {d.duplex_nom || '—'}
                    </span>
                    <span className={`badge ${STATUT_COLORS[d.statut]}`}>{STATUTS[d.statut]}</span>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {new Date(d.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{d.message}</p>

                  {/* Client */}
                  {(d.nom_client || d.telephone) && (
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {d.nom_client && <span>{d.nom_client}</span>}
                      {d.nom_client && d.telephone && ' · '}
                      {d.telephone && <span>{d.telephone}</span>}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {d.statut === 'nouveau' && (
                    <button onClick={() => updateStatut(d.id, 'en_cours')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                      style={{ backgroundColor: '#D97706' }}>
                      Prendre en charge
                    </button>
                  )}
                  {d.statut === 'en_cours' && (
                    <button onClick={() => updateStatut(d.id, 'resolu')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                      style={{ backgroundColor: '#008A05' }}>
                      Marquer résolu
                    </button>
                  )}
                  {d.statut === 'resolu' && (
                    <span className="text-xs px-2 py-1 rounded text-green-700 bg-green-50 font-medium">✓ Résolu</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
