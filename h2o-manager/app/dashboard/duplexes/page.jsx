'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { DUPLEX_STATUT_COLORS, emptyToNull } from '@/lib/utils'

const STATUT_LABELS = { disponible: 'Disponible', occupe: 'Occupé', maintenance: 'Maintenance' }
const EMPTY = { nom: '', code: '', capacite: 2, surface_m2: '', description: '', tarif_nuit: '', statut: 'disponible' }

export default function Duplexes() {
  const supabase = createClient()
  const [duplexes, setDuplexes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('duplexes').select('*').order('code')
    setDuplexes(data || [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, capacite: parseInt(form.capacite) || 2, tarif_nuit: form.tarif_nuit ? parseInt(form.tarif_nuit) : null, surface_m2: form.surface_m2 ? parseInt(form.surface_m2) : null }
    await supabase.from('duplexes').insert([emptyToNull(payload)])
    setShowForm(false); setForm(EMPTY); load()
    setSaving(false)
  }

  async function changeStatut(id, statut) {
    await supabase.from('duplexes').update({ statut }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Duplexes & Logements</h1>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }} className="btn-primary">+ Ajouter un duplex</button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {duplexes.map(d => (
            <div key={d.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-bold text-gray-400">{d.code}</span>
                  <h3 className="font-semibold text-gray-900">{d.nom}</h3>
                </div>
                <span className={`badge ${DUPLEX_STATUT_COLORS[d.statut]}`}>{STATUT_LABELS[d.statut]}</span>
              </div>

              <div className="text-sm text-gray-500 space-y-1 mb-4">
                <p>👥 {d.capacite} personnes max</p>
                {d.surface_m2 && <p>📐 {d.surface_m2} m²</p>}
                {d.tarif_nuit && <p>💰 {new Intl.NumberFormat('fr-FR').format(d.tarif_nuit)} FCFA / nuit</p>}
                {d.description && <p className="text-xs text-gray-400 mt-2">{d.description}</p>}
              </div>

              <div className="border-t pt-3">
                <label className="label">Changer le statut</label>
                <select value={d.statut} onChange={e => changeStatut(d.id, e.target.value)}
                  className="input text-xs py-1.5">
                  {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
          ))}

          {duplexes.length === 0 && (
            <div className="col-span-3 text-center text-gray-400 py-16">
              Aucun duplex enregistré. Ajoutez votre premier duplex.
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Nouveau duplex</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Code (ex: D-1)</label>
                  <input className="input" value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value}))} placeholder="D-1" />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input className="input" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} placeholder="Duplex Lac" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Capacité</label>
                  <input className="input" type="number" min="1" value={form.capacite} onChange={e => setForm(p => ({...p, capacite: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Surface (m²)</label>
                  <input className="input" type="number" value={form.surface_m2} onChange={e => setForm(p => ({...p, surface_m2: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Tarif / nuit (FCFA)</label>
                <input className="input" type="number" value={form.tarif_nuit} onChange={e => setForm(p => ({...p, tarif_nuit: e.target.value}))} placeholder="120000" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Vue lac, piscine 20m²..." />
              </div>
              <div>
                <label className="label">Statut initial</label>
                <select className="input" value={form.statut} onChange={e => setForm(p => ({...p, statut: e.target.value}))}>
                  {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom} className="btn-primary flex-1">
                {saving ? 'Enregistrement...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
