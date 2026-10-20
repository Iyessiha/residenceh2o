'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { formatFCFA } from '@/lib/utils'

const TYPE_LABELS  = { standard: 'Standard', vip: 'VIP' }
const TYPE_COLORS  = { standard: 'bg-blue-100 text-blue-700', vip: 'bg-amber-100 text-amber-700' }
const STATUT_LABELS = { disponible: 'Disponible', occupee: 'Occupée', maintenance: 'Maintenance' }
const STATUT_COLORS = {
  disponible:  'bg-green-100 text-green-700',
  occupee:     'bg-red-100 text-red-700',
  maintenance: 'bg-gray-100 text-gray-500',
}

const EMPTY = {
  duplex_id: '', nom: '', code: '', type: 'standard', tarif_nuit: 60000,
  statut: 'disponible', capacite: 1, description: '', features: '',
}

export default function Chambres() {
  const supabase = createClient()

  const [chambres, setChambres]   = useState([])
  const [duplexes, setDuplexes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filterDuplex, setFilterDuplex] = useState('tous')
  const [filterType, setFilterType]     = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')

  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [saving, setSaving]       = useState(false)
  const [deleteId, setDeleteId]   = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const load = useCallback(async () => {
    const [{ data: ch }, { data: dx }] = await Promise.all([
      supabase.from('chambres').select('*, duplexes(nom)').order('duplex_id').order('code'),
      supabase.from('duplexes').select('id, nom, code').order('code'),
    ])
    setChambres(ch || [])
    setDuplexes(dx || [])
    setLoading(false)
  }, [])

  useEffect(() => { setLoading(true); load() }, [load])

  function openCreate() { setEditId(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(c) {
    setEditId(c.id)
    setForm({
      duplex_id:   c.duplex_id   || '',
      nom:         c.nom         || '',
      code:        c.code        || '',
      type:        c.type        || 'standard',
      tarif_nuit:  c.tarif_nuit  ?? 60000,
      statut:      c.statut      || 'disponible',
      capacite:    c.capacite    ?? 1,
      description: c.description || '',
      features:    (c.features || []).join('\n'),
    })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const duplex = duplexes.find(d => d.id === form.duplex_id)
    const payload = {
      duplex_id:   form.duplex_id || null,
      duplex_nom:  duplex?.nom || null,
      nom:         form.nom,
      code:        form.code || null,
      type:        form.type,
      tarif_nuit:  parseInt(form.tarif_nuit) || 60000,
      statut:      form.statut,
      capacite:    parseInt(form.capacite) || 1,
      description: form.description || null,
      features:    form.features.split('\n').map(f => f.trim()).filter(Boolean),
      updated_at:  new Date().toISOString(),
    }
    if (editId) await supabase.from('chambres').update(payload).eq('id', editId)
    else        await supabase.from('chambres').insert([payload])
    setShowForm(false); setForm(EMPTY); setEditId(null); load()
    setSaving(false)
  }

  async function updateStatut(id, statut) {
    await supabase.from('chambres').update({ statut, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  async function confirmDelete() {
    setDeleting(true)
    await supabase.from('chambres').delete().eq('id', deleteId)
    setDeleteId(null); setDeleting(false); load()
  }

  // Filtrage
  const filtered = chambres.filter(c => {
    if (filterDuplex !== 'tous' && c.duplex_id !== filterDuplex) return false
    if (filterType   !== 'tous' && c.type      !== filterType)   return false
    if (filterStatut !== 'tous' && c.statut    !== filterStatut) return false
    return true
  })

  // Stats
  const total       = chambres.length
  const disponibles = chambres.filter(c => c.statut === 'disponible').length
  const occupees    = chambres.filter(c => c.statut === 'occupee').length
  const vips        = chambres.filter(c => c.type === 'vip').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Chambres</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Chambres standard et VIP dans les duplexes
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Ajouter une chambre</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Total</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{total}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Disponibles</p>
          <p className="text-2xl font-bold text-green-600">{disponibles}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Occupées</p>
          <p className="text-2xl font-bold text-red-600">{occupees}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Chambres VIP</p>
          <p className="text-2xl font-bold text-amber-600">{vips}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Duplex */}
        <select
          value={filterDuplex}
          onChange={e => setFilterDuplex(e.target.value)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}
        >
          <option value="tous">Tous les duplexes</option>
          {duplexes.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>

        {/* Type */}
        {['tous', 'standard', 'vip'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filterType === t ? 'text-white' : 'border hover:opacity-80'}`}
            style={filterType === t ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
            {t === 'tous' ? 'Tous types' : TYPE_LABELS[t]}
          </button>
        ))}

        {/* Statut */}
        {['tous', 'disponible', 'occupee', 'maintenance'].map(s => (
          <button key={s} onClick={() => setFilterStatut(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filterStatut === s ? 'text-white' : 'border hover:opacity-80'}`}
            style={filterStatut === s ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
            {s === 'tous' ? 'Tous statuts' : STATUT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🛏️</p>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Aucune chambre trouvée</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            {chambres.length === 0 ? 'Ajoutez votre première chambre.' : 'Modifiez les filtres.'}
          </p>
          {chambres.length === 0 && (
            <button onClick={openCreate} className="btn-primary mt-4">+ Ajouter une chambre</button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  {c.code && (
                    <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>{c.code}</span>
                  )}
                  <h3 className="font-semibold truncate" style={{ color: 'var(--text)' }}>{c.nom}</h3>
                  {(c.duplexes?.nom || c.duplex_nom) && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      📍 {c.duplexes?.nom || c.duplex_nom}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                  <span className={`badge ${TYPE_COLORS[c.type]}`}>{TYPE_LABELS[c.type]}</span>
                  <span className={`badge ${STATUT_COLORS[c.statut]}`}>{STATUT_LABELS[c.statut]}</span>
                </div>
              </div>

              <div className="text-sm space-y-1 mb-4" style={{ color: 'var(--text-3)' }}>
                <p className="font-semibold text-base" style={{ color: 'var(--primary)' }}>
                  {formatFCFA(c.tarif_nuit)} / nuit
                </p>
                <p>👤 {c.capacite} personne{c.capacite > 1 ? 's' : ''}</p>
                {c.description && (
                  <p className="text-xs italic line-clamp-2">{c.description}</p>
                )}
                {(c.features || []).length > 0 && (
                  <p className="text-xs">✓ {c.features.slice(0, 2).join(' · ')}{c.features.length > 2 ? ` +${c.features.length - 2}` : ''}</p>
                )}
              </div>

              <div className="border-t pt-3 flex gap-2" style={{ borderColor: 'var(--border-2)' }}>
                <select
                  value={c.statut}
                  onChange={e => updateStatut(c.id, e.target.value)}
                  className="flex-1 text-xs border rounded-lg px-2 py-1.5 font-semibold"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                >
                  {Object.entries(STATUT_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <button
                  onClick={() => openEdit(c)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg border transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteId(c.id)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg border transition-opacity hover:opacity-70"
                  style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: '#FEF2F2' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création / édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editId ? 'Modifier la chambre' : 'Nouvelle chambre'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>

            <div className="space-y-3">
              {/* Duplex */}
              <div>
                <label className="label">Duplex rattaché</label>
                <select className="input" value={form.duplex_id} onChange={e => setForm(p => ({ ...p, duplex_id: e.target.value }))}>
                  <option value="">— Aucun —</option>
                  {duplexes.map(d => <option key={d.id} value={d.id}>{d.nom} ({d.code})</option>)}
                </select>
              </div>

              {/* Nom + Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nom *</label>
                  <input className="input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Chambre Bleue" />
                </div>
                <div>
                  <label className="label">Code</label>
                  <input className="input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="D1-C1" />
                </div>
              </div>

              {/* Type + Statut */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="standard">Standard</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="label">Statut</label>
                  <select className="input" value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}>
                    {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Tarif + Capacité */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tarif / nuit (FCFA)</label>
                  <input className="input" type="number" min="0" value={form.tarif_nuit} onChange={e => setForm(p => ({ ...p, tarif_nuit: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Capacité (pers.)</label>
                  <input className="input" type="number" min="1" value={form.capacite} onChange={e => setForm(p => ({ ...p, capacite: e.target.value }))} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Vue piscine, lit king size…" />
              </div>

              {/* Équipements */}
              <div>
                <label className="label">Équipements (un par ligne)</label>
                <textarea className="input font-mono text-xs" rows={4} value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} placeholder={'Climatisation\nSalle de bain privée\nTV écran plat'} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom} className="btn-primary flex-1">
                {saving ? 'Enregistrement…' : editId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Supprimer cette chambre ?</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#DC2626' }}>
                {deleting ? '…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
