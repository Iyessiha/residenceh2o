'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatFCFA } from '@/lib/utils'
import DemarcheurForm from '@/components/DemarcheurForm'
import { nomDemarcheur, calculerTotaux } from '@/lib/demarcheurs'

export default function Demarcheurs() {
  const supabase = createClient()
  const [demarcheurs, setDemarcheurs] = useState([])
  const [totaux, setTotaux] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: dem }, { data: cli }, { data: resv }] = await Promise.all([
      supabase.from('demarcheurs').select('*').order('nom'),
      supabase.from('clients').select('demarcheur_id').not('demarcheur_id', 'is', null),
      supabase.from('reservations').select('demarcheur_id, commission_montant, commission_statut').not('demarcheur_id', 'is', null),
    ])
    setDemarcheurs(dem || [])
    setTotaux(calculerTotaux(cli || [], resv || []))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function supprimer(d) {
    const t = totaux[d.id]
    if (t?.reservations > 0) {
      setMessage({ type: 'error', text: `${nomDemarcheur(d)} a ${t.reservations} réservation(s) avec commission : suppression impossible pour garder l'historique.` })
      return
    }
    if (!confirm(`Supprimer le démarcheur ${nomDemarcheur(d)} ? Ses clients restent, sans démarcheur.`)) return
    const { error } = await supabase.from('demarcheurs').delete().eq('id', d.id)
    setMessage(error ? { type: 'error', text: error.message } : null)
    load()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Démarcheurs</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            Prestataires qui apportent des clients. Leur commission apparaît dans les rapports financiers.
          </p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary">+ Nouveau démarcheur</button>
      </div>

      {message && (
        <p className={`text-sm px-3 py-2 rounded-lg mb-4 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Démarcheur</th>
                <th className="table-th">Téléphone</th>
                <th className="table-th">Taux</th>
                <th className="table-th">Clients apportés</th>
                <th className="table-th">Commissions dues</th>
                <th className="table-th">Déjà versé</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement...</td></tr>
              ) : demarcheurs.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Aucun démarcheur</td></tr>
              ) : demarcheurs.map(d => {
                const t = totaux[d.id] || { clients: 0, dues: 0, versees: 0 }
                return (
                  <tr key={d.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                    <td className="table-td">
                      <Link href={`/dashboard/demarcheurs/${d.id}`} className="font-medium hover:underline" style={{ color: 'var(--text)' }}>
                        {nomDemarcheur(d)}
                      </Link>
                    </td>
                    <td className="table-td" style={{ color: 'var(--text-2)' }}>{d.telephone || '—'}</td>
                    <td className="table-td" style={{ color: 'var(--text-2)' }}>{Number(d.taux_commission)} %</td>
                    <td className="table-td" style={{ color: 'var(--text-2)' }}>{t.clients}</td>
                    <td className="table-td font-semibold" style={{ color: t.dues > 0 ? '#B45309' : 'var(--text-2)' }}>{formatFCFA(t.dues)}</td>
                    <td className="table-td" style={{ color: 'var(--text-2)' }}>{formatFCFA(t.versees)}</td>
                    <td className="table-td">
                      <div className="flex gap-3">
                        <Link href={`/dashboard/demarcheurs/${d.id}`} className="text-xs hover:underline" style={{ color: 'var(--primary)' }}>Fiche</Link>
                        <button onClick={() => { setEditing(d); setShowForm(true) }} className="text-xs hover:underline" style={{ color: 'var(--text-2)' }}>Modifier</button>
                        <button onClick={() => supprimer(d)} className="text-xs hover:underline" style={{ color: '#DC2626' }}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <DemarcheurForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}
