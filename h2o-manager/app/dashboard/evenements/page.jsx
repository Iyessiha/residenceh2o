'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, formatFCFA, emptyToNull } from '@/lib/utils'

const TYPES = ['mariage', 'anniversaire', 'bapteme', 'seminaire', 'fete_privee', 'autre']
const TYPE_LABELS = { mariage: '💍 Mariage', anniversaire: '🎂 Anniversaire', bapteme: '🍼 Baptême', seminaire: '💼 Séminaire', fete_privee: '🎉 Fête privée', autre: '🎪 Autre' }
const STATUTS = { en_attente: 'En attente', confirme: 'Confirmé', en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé' }
const STATUT_COLORS = { en_attente: 'bg-yellow-100 text-yellow-800', confirme: 'bg-green-100 text-green-800', en_cours: 'bg-blue-100 text-blue-800', termine: 'bg-gray-100 text-gray-600', annule: 'bg-red-100 text-red-700' }

const EMPTY = { nom_client: '', telephone: '', email: '', type_evenement: 'mariage', date_evenement: '', heure_debut: '17:00', nb_invites: '', montant_devis: '', acompte: '', notes: '', statut: 'en_attente', espace: 'pergola' }

export default function Evenements() {
  const supabase = createClient()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('evenements').select('*').order('date_evenement', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, nb_invites: form.nb_invites ? parseInt(form.nb_invites) : null, montant_devis: form.montant_devis ? parseInt(form.montant_devis) : null, acompte: form.acompte ? parseInt(form.acompte) : null }
    await supabase.from('evenements').insert([emptyToNull(payload)])
    setShowForm(false); setForm(EMPTY); load()
    setSaving(false)
  }

  async function updateStatut(id, statut) {
    await supabase.from('evenements').update({ statut }).eq('id', id)
    load()
  }

  const upcoming = events.filter(e => new Date(e.date_evenement) >= new Date())
  const past = events.filter(e => new Date(e.date_evenement) < new Date())

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Événements</h1>
          <p className="text-gray-500 text-sm">Pergola & Espaces — Mariages, Anniversaires, Séminaires...</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }} className="btn-primary">+ Nouvel événement</button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : (
        <>
          {/* Upcoming events */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">À venir ({upcoming.length})</h2>
          <div className="space-y-3 mb-8">
            {upcoming.length === 0 ? (
              <div className="card p-6 text-center text-gray-400">Aucun événement à venir</div>
            ) : upcoming.map(ev => (
              <div key={ev.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-3xl">{TYPE_LABELS[ev.type_evenement]?.split(' ')[0]}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{ev.nom_client}</h3>
                    <span className={`badge ${STATUT_COLORS[ev.statut]}`}>{STATUTS[ev.statut]}</span>
                    <span className="badge bg-gray-100 text-gray-600">{TYPE_LABELS[ev.type_evenement]}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    📅 {formatDate(ev.date_evenement)} à {ev.heure_debut || '—'} &nbsp;·&nbsp;
                    👥 {ev.nb_invites || '?'} invités &nbsp;·&nbsp;
                    🎪 {ev.espace}
                  </p>
                  {ev.montant_devis && (
                    <p className="text-sm text-gray-500">
                      💰 Devis : {formatFCFA(ev.montant_devis)} &nbsp;·&nbsp;
                      Acompte : {formatFCFA(ev.acompte)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(ev)} className="btn-secondary text-xs">Détails</button>
                  <select value={ev.statut} onChange={e => updateStatut(ev.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500">
                    {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Past events */}
          {past.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Historique ({past.length})</h2>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-th">Client</th>
                      <th className="table-th">Type</th>
                      <th className="table-th">Date</th>
                      <th className="table-th">Invités</th>
                      <th className="table-th">Montant</th>
                      <th className="table-th">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {past.map(ev => (
                      <tr key={ev.id} className="hover:bg-gray-50/50">
                        <td className="table-td font-medium">{ev.nom_client}</td>
                        <td className="table-td">{TYPE_LABELS[ev.type_evenement]}</td>
                        <td className="table-td text-gray-400">{formatDate(ev.date_evenement)}</td>
                        <td className="table-td">{ev.nb_invites || '—'}</td>
                        <td className="table-td">{formatFCFA(ev.montant_devis)}</td>
                        <td className="table-td"><span className={`badge ${STATUT_COLORS[ev.statut]}`}>{STATUTS[ev.statut]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Event detail */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Événement</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><p className="label">Client</p><p className="font-semibold">{selected.nom_client}</p></div>
              <div><p className="label">Type</p><p>{TYPE_LABELS[selected.type_evenement]}</p></div>
              <div><p className="label">Date</p><p>{formatDate(selected.date_evenement)} à {selected.heure_debut}</p></div>
              <div><p className="label">Espace</p><p>{selected.espace}</p></div>
              <div><p className="label">Nombre d'invités</p><p>{selected.nb_invites || '—'}</p></div>
              <div><p className="label">Montant devis</p><p>{formatFCFA(selected.montant_devis)}</p></div>
              <div><p className="label">Acompte reçu</p><p>{formatFCFA(selected.acompte)}</p></div>
              <div><p className="label">Solde restant</p><p className="font-semibold text-orange-600">{formatFCFA((selected.montant_devis || 0) - (selected.acompte || 0))}</p></div>
              <div><p className="label">Contact</p><p>{selected.telephone}</p></div>
              <div><p className="label">Notes</p><p className="text-gray-500">{selected.notes || '—'}</p></div>
            </div>
            <div className="mt-5 flex gap-3">
              <a href={`https://wa.me/${(selected.telephone || '').replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 btn bg-green-600 hover:bg-green-700 text-white text-center">
                💬 WhatsApp
              </a>
              <button onClick={() => setSelected(null)} className="flex-1 btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* New event form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Nouvel événement</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nom client *</label><input className="input" value={form.nom_client} onChange={e => setForm(p => ({...p, nom_client: e.target.value}))} /></div>
                <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} /></div>
              </div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Type d'événement</label>
                  <select className="input" value={form.type_evenement} onChange={e => setForm(p => ({...p, type_evenement: e.target.value}))}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div><label className="label">Espace</label>
                  <select className="input" value={form.espace} onChange={e => setForm(p => ({...p, espace: e.target.value}))}>
                    <option value="pergola">Pergola</option>
                    <option value="jardins">Jardins</option>
                    <option value="full_site">Site complet</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Date</label><input className="input" type="date" value={form.date_evenement} onChange={e => setForm(p => ({...p, date_evenement: e.target.value}))} /></div>
                <div><label className="label">Heure début</label><input className="input" type="time" value={form.heure_debut} onChange={e => setForm(p => ({...p, heure_debut: e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nbre invités</label><input className="input" type="number" value={form.nb_invites} onChange={e => setForm(p => ({...p, nb_invites: e.target.value}))} /></div>
                <div><label className="label">Statut</label>
                  <select className="input" value={form.statut} onChange={e => setForm(p => ({...p, statut: e.target.value}))}>
                    {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Montant devis (FCFA)</label><input className="input" type="number" value={form.montant_devis} onChange={e => setForm(p => ({...p, montant_devis: e.target.value}))} /></div>
                <div><label className="label">Acompte reçu (FCFA)</label><input className="input" type="number" value={form.acompte} onChange={e => setForm(p => ({...p, acompte: e.target.value}))} /></div>
              </div>
              <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom_client} className="btn-primary flex-1">{saving ? '...' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
