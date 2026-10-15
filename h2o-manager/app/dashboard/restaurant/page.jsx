'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatFCFA } from '@/lib/utils'

const STATUTS = { en_cours: 'En cours', servie: 'Servie', payee: 'Payée', annulee: 'Annulée' }
const STATUT_COLORS = {
  en_cours: 'bg-yellow-100 text-yellow-800',
  servie:   'bg-blue-100 text-blue-700',
  payee:    'bg-green-100 text-green-800',
  annulee:  'bg-gray-100 text-gray-500',
}
const PAIEMENTS = { especes: 'Espèces', mobile_money: 'Mobile Money', carte: 'Carte', virement: 'Virement' }
const EMPTY_LIGNE = { nom: '', qte: 1, prix: 0 }
const EMPTY = { nom_client: '', telephone: '', table_num: '', lignes: [{ ...EMPTY_LIGNE }], mode_paiement: 'especes', statut: 'en_cours', notes: '' }

function LignesEditor({ lignes, onChange }) {
  function update(i, field, val) {
    const next = lignes.map((l, idx) => idx === i ? { ...l, [field]: val } : l)
    onChange(next)
  }
  function add() { onChange([...lignes, { ...EMPTY_LIGNE }]) }
  function remove(i) { onChange(lignes.filter((_, idx) => idx !== i)) }

  const total = lignes.reduce((s, l) => s + (parseInt(l.qte) || 0) * (parseInt(l.prix) || 0), 0)

  return (
    <div>
      <label className="label">Articles / Plats</label>
      <div className="space-y-2 mb-2">
        <div className="grid grid-cols-12 gap-1 text-xs font-semibold px-1" style={{ color: 'var(--text-3)' }}>
          <span className="col-span-5">Désignation</span>
          <span className="col-span-2 text-center">Qté</span>
          <span className="col-span-3 text-right">Prix unit.</span>
          <span className="col-span-2" />
        </div>
        {lignes.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-1 items-center">
            <input
              className="input py-1.5 text-sm col-span-5"
              placeholder="Plat, boisson…"
              value={l.nom}
              onChange={e => update(i, 'nom', e.target.value)}
            />
            <input
              className="input py-1.5 text-sm col-span-2 text-center"
              type="number" min="1"
              value={l.qte}
              onChange={e => update(i, 'qte', e.target.value)}
            />
            <input
              className="input py-1.5 text-sm col-span-3 text-right"
              type="number" min="0"
              value={l.prix}
              onChange={e => update(i, 'prix', e.target.value)}
            />
            <button
              onClick={() => remove(i)}
              disabled={lignes.length === 1}
              className="col-span-2 flex items-center justify-center h-8 rounded text-xs disabled:opacity-30 hover:opacity-70 transition-opacity"
              style={{ color: '#DC2626' }}
            >✕</button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-1">
        <button
          onClick={add}
          className="text-xs font-semibold hover:opacity-70 transition-opacity"
          style={{ color: 'var(--primary)' }}
        >+ Ajouter une ligne</button>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          Total : {formatFCFA(total)}
        </span>
      </div>
    </div>
  )
}

export default function Restaurant() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [commandes, setCommandes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('tous')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [editId, setEditId]       = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('commandes_restaurant').select('*').order('created_at', { ascending: false })
    if (filter !== 'tous') q = q.eq('statut', filter)
    const { data } = await q
    setCommandes(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  // Pré-remplissage depuis CRM (URL params)
  useEffect(() => {
    const clientId  = searchParams.get('client')
    const nom       = searchParams.get('nom')
    const tel       = searchParams.get('tel')
    if (nom) {
      setForm(p => ({ ...p, nom_client: nom, telephone: tel || '', client_id: clientId || undefined }))
      setShowForm(true)
    }
  }, [searchParams])

  function totalLignes(lignes) {
    return (lignes || []).reduce((s, l) => s + (parseInt(l.qte) || 0) * (parseInt(l.prix) || 0), 0)
  }

  function openCreate() {
    setEditId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(c) {
    setEditId(c.id)
    setForm({
      nom_client:    c.nom_client    || '',
      telephone:     c.telephone     || '',
      table_num:     c.table_num     || '',
      lignes:        c.lignes?.length ? c.lignes : [{ ...EMPTY_LIGNE }],
      mode_paiement: c.mode_paiement || 'especes',
      statut:        c.statut        || 'en_cours',
      notes:         c.notes         || '',
    })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const montant_total = totalLignes(form.lignes)
    const payload = { ...form, montant_total }

    if (editId) {
      await supabase.from('commandes_restaurant').update(payload).eq('id', editId)
    } else {
      await supabase.from('commandes_restaurant').insert([payload])
    }

    setShowForm(false); setForm(EMPTY); setEditId(null); load()
    setSaving(false)
  }

  async function updateStatut(id, statut) {
    await supabase.from('commandes_restaurant').update({ statut }).eq('id', id)
    load()
  }

  const aujourdhui = new Date().toISOString().slice(0, 10)
  const cmdAujourd = commandes.filter(c => c.created_at?.slice(0, 10) === aujourdhui)
  const caAujourd  = cmdAujourd.filter(c => c.statut === 'payee').reduce((s, c) => s + (c.montant_total || 0), 0)
  const enCours    = commandes.filter(c => c.statut === 'en_cours').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Restaurant & Bar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Gestion des commandes</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Nouvelle commande</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Commandes aujourd'hui</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{cmdAujourd.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>En cours</p>
          <p className="text-2xl font-bold text-yellow-600">{enCours}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>CA encaissé aujourd'hui</p>
          <p className="text-2xl font-bold text-green-600">{formatFCFA(caAujourd)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['tous', ...Object.keys(STATUTS)].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === s ? 'text-white' : 'border hover:opacity-80'}`}
            style={filter === s ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
            {s === 'tous' ? 'Toutes' : STATUTS[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Date / Heure</th>
                <th className="table-th">Client</th>
                <th className="table-th">Table</th>
                <th className="table-th">Articles</th>
                <th className="table-th">Total</th>
                <th className="table-th">Paiement</th>
                <th className="table-th">Statut</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement...</td></tr>
              ) : commandes.length === 0 ? (
                <tr><td colSpan={8} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Aucune commande</td></tr>
              ) : commandes.map(c => (
                <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td text-xs" style={{ color: 'var(--text-3)' }}>
                    {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="table-td">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>{c.nom_client}</p>
                    {c.telephone && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.telephone}</p>}
                  </td>
                  <td className="table-td" style={{ color: 'var(--text-2)' }}>{c.table_num || '—'}</td>
                  <td className="table-td">
                    <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                      {(c.lignes || []).slice(0, 2).map(l => `${l.nom} ×${l.qte}`).join(', ')}
                      {(c.lignes || []).length > 2 && ` +${c.lignes.length - 2}`}
                    </p>
                  </td>
                  <td className="table-td font-semibold" style={{ color: 'var(--text)' }}>{formatFCFA(c.montant_total)}</td>
                  <td className="table-td text-xs" style={{ color: 'var(--text-3)' }}>{PAIEMENTS[c.mode_paiement] || c.mode_paiement}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUT_COLORS[c.statut]}`}>{STATUTS[c.statut]}</span>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <select
                        value={c.statut}
                        onChange={e => updateStatut(c.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                      >
                        {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs px-2 py-1 border rounded hover:opacity-70"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}
                      >Éditer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editId ? 'Modifier la commande' : 'Nouvelle commande'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Client *</label>
                  <input className="input" value={form.nom_client} onChange={e => setForm(p => ({...p, nom_client: e.target.value}))} placeholder="Nom du client" />
                </div>
                <div>
                  <label className="label">Téléphone</label>
                  <input className="input" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Table / Espace</label>
                <input className="input" value={form.table_num} onChange={e => setForm(p => ({...p, table_num: e.target.value}))} placeholder="Table 3, Terrasse, Bar…" />
              </div>

              <LignesEditor
                lignes={form.lignes}
                onChange={lignes => setForm(p => ({ ...p, lignes }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Mode de paiement</label>
                  <select className="input" value={form.mode_paiement} onChange={e => setForm(p => ({...p, mode_paiement: e.target.value}))}>
                    {Object.entries(PAIEMENTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Statut</label>
                  <select className="input" value={form.statut} onChange={e => setForm(p => ({...p, statut: e.target.value}))}>
                    {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes (optionnel)</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Allergie, préférence…" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom_client} className="btn-primary flex-1">
                {saving ? '...' : editId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
