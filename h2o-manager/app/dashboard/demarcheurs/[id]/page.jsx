'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatFCFA, formatDate } from '@/lib/utils'
import { nomDemarcheur, calculerTotaux } from '@/lib/demarcheurs'
import DemarcheurForm from '@/components/DemarcheurForm'

export default function FicheDemarcheur() {
  const { id } = useParams()
  const supabase = createClient()
  const [demarcheur, setDemarcheur] = useState(null)
  const [clients, setClients] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [savingId, setSavingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: d }, { data: cli }, { data: resv }] = await Promise.all([
      supabase.from('demarcheurs').select('*').eq('id', id).maybeSingle(),
      supabase.from('clients').select('id, nom, type, telephone, created_at, demarcheur_id, entreprise:entreprises(nom)')
        .eq('demarcheur_id', id).order('created_at', { ascending: false }),
      supabase.from('reservations')
        .select('id, nom_client, date_arrivee, date_depart, montant_total, commission_taux, commission_montant, commission_statut, commission_payee_le')
        .eq('demarcheur_id', id).order('date_arrivee', { ascending: false }),
    ])
    setDemarcheur(d || null)
    setClients(cli || [])
    setReservations(resv || [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function marquerPayee(r) {
    setSavingId(r.id)
    await supabase.from('reservations').update({ commission_statut: 'payee' }).eq('id', r.id)
    setSavingId(null)
    load()
  }

  if (loading) {
    return <p className="text-center py-16" style={{ color: 'var(--text-3)' }}>Chargement...</p>
  }

  if (!demarcheur) {
    return (
      <div>
        <Link href="/dashboard/demarcheurs" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>← Démarcheurs</Link>
        <p className="mt-6" style={{ color: 'var(--text-2)' }}>Démarcheur introuvable.</p>
      </div>
    )
  }

  const totaux = calculerTotaux(clients, reservations)[demarcheur.id] || { clients: 0, dues: 0, versees: 0 }
  const commissionsDues = reservations.filter(r => r.commission_statut !== 'payee')

  return (
    <div>
      <Link href="/dashboard/demarcheurs" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>← Démarcheurs</Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{nomDemarcheur(demarcheur)}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            {demarcheur.telephone || 'Pas de numéro'} · Taux de commission {Number(demarcheur.taux_commission)} %
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-secondary">Modifier</button>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>Clients apportés</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{totaux.clients}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>Commissions dues</p>
          <p className="text-2xl font-bold" style={{ color: '#B45309' }}>{formatFCFA(totaux.dues)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>Total déjà versé</p>
          <p className="text-2xl font-bold text-green-600">{formatFCFA(totaux.versees)}</p>
        </div>
      </div>

      {/* Commissions par réservation */}
      <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>
        Commissions sur réservations {commissionsDues.length > 0 && <span className="text-sm font-normal" style={{ color: 'var(--text-3)' }}>({commissionsDues.length} à payer)</span>}
      </h2>
      <div className="card overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Client</th>
                <th className="table-th">Séjour</th>
                <th className="table-th">Montant</th>
                <th className="table-th">Commission</th>
                <th className="table-th">Statut</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center py-8" style={{ color: 'var(--text-3)' }}>Aucune réservation apportée</td></tr>
              ) : reservations.map(r => {
                const payee = r.commission_statut === 'payee'
                return (
                  <tr key={r.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                    <td className="table-td font-medium" style={{ color: 'var(--text)' }}>{r.nom_client}</td>
                    <td className="table-td text-xs" style={{ color: 'var(--text-2)' }}>
                      {formatDate(r.date_arrivee)} → {formatDate(r.date_depart)}
                    </td>
                    <td className="table-td" style={{ color: 'var(--text-2)' }}>{formatFCFA(r.montant_total)}</td>
                    <td className="table-td font-semibold" style={{ color: 'var(--text)' }}>
                      {formatFCFA(r.commission_montant)}
                      {r.commission_taux != null && <span className="block text-xs font-normal" style={{ color: 'var(--text-3)' }}>{Number(r.commission_taux)} %</span>}
                    </td>
                    <td className="table-td">
                      {payee ? (
                        <span className="badge bg-green-100 text-green-700">Payée {r.commission_payee_le ? `le ${formatDate(r.commission_payee_le)}` : ''}</span>
                      ) : (
                        <span className="badge bg-amber-100 text-amber-800">À payer</span>
                      )}
                    </td>
                    <td className="table-td">
                      {!payee && (
                        <button onClick={() => marquerPayee(r)} disabled={savingId === r.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                          style={{ backgroundColor: 'var(--primary)' }}>
                          {savingId === r.id ? '...' : 'Marquer comme payée'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clients apportés */}
      <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Clients apportés ({clients.length})</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Client</th>
                <th className="table-th">Type</th>
                <th className="table-th">Téléphone</th>
                <th className="table-th">Depuis</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={4} className="table-td text-center py-8" style={{ color: 'var(--text-3)' }}>Aucun client rattaché</td></tr>
              ) : clients.map(c => (
                <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>{c.nom}</p>
                    {c.type === 'entreprise' && c.entreprise?.nom && (
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.entreprise.nom}</p>
                    )}
                  </td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{c.type === 'entreprise' ? 'Entreprise' : 'Particulier'}</td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{c.telephone || '—'}</td>
                  <td className="table-td" style={{ color: 'var(--text-3)' }}>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <DemarcheurForm
          initial={demarcheur}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}
