'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const ROLES = [
  { key: 'menage',       label: 'Ménage',       emoji: '🧹' },
  { key: 'restauration', label: 'Restauration',  emoji: '🍽️' },
  { key: 'reception',    label: 'Réception',     emoji: '🛎️' },
  { key: 'maintenance',  label: 'Maintenance',   emoji: '🔧' },
]

const EMPTY = { nom: '', role: 'menage', telephone: '', actif: true }

function genToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

function staffUrl(token) {
  const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  return `${base}/staff/${token}`
}

export default function Equipe() {
  const supabase = createClient()
  const [staff,    setStaff]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [copied,   setCopied]   = useState(null)
  const [filterRole, setFilterRole] = useState('tous')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false })
    setStaff(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setForm({ ...EMPTY, token: genToken() })
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(s) {
    setForm({ nom: s.nom, role: s.role, telephone: s.telephone || '', actif: s.actif, token: s.token })
    setEditId(s.id)
    setShowForm(true)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      nom: form.nom,
      role: form.role,
      telephone: form.telephone,
      actif: form.actif,
      token: form.token || genToken(),
    }
    if (editId) {
      await supabase.from('staff').update(payload).eq('id', editId)
    } else {
      await supabase.from('staff').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function toggleActif(s) {
    await supabase.from('staff').update({ actif: !s.actif }).eq('id', s.id)
    load()
  }

  async function copyLink(token) {
    const url = staffUrl(token)
    await navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = filterRole === 'tous'
    ? staff
    : staff.filter(s => s.role === filterRole)

  const roleInfo = Object.fromEntries(ROLES.map(r => [r.key, r]))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Équipe</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez le personnel et leurs liens d'accès</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          + Ajouter un membre
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['tous', ...ROLES.map(r => r.key)].map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterRole === r
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {r === 'tous' ? 'Tous' : `${roleInfo[r]?.emoji} ${roleInfo[r]?.label}`}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">👷</p>
          <p className="font-medium text-gray-600">Aucun membre dans cette catégorie</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter un membre" pour commencer.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => {
            const ri = roleInfo[s.role] || { emoji: '👤', label: s.role }
            return (
              <div key={s.id} className={`card p-4 ${!s.actif ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ri.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{s.nom}</p>
                      <p className="text-xs text-gray-500">{ri.label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActif(s)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {s.actif ? 'Actif' : 'Inactif'}
                  </button>
                </div>

                {s.telephone && (
                  <p className="text-xs text-gray-500 mb-3">📞 {s.telephone}</p>
                )}

                {/* Lien staff */}
                <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Lien favori</p>
                  <p className="text-xs text-gray-600 break-all font-mono">/staff/{s.token}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(s.token)}
                    className="flex-1 text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                  >
                    {copied === s.token ? '✓ Copié !' : '📋 Copier le lien'}
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-xs"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editId ? 'Modifier le membre' : 'Nouveau membre'}
            </h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="label">Nom complet *</label>
                <input
                  className="input" required
                  value={form.nom}
                  onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                  placeholder="Ex: Aminata Koné"
                />
              </div>
              <div>
                <label className="label">Rôle *</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                >
                  {ROLES.map(r => (
                    <option key={r.key} value={r.key}>{r.emoji} {r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  className="input"
                  value={form.telephone}
                  onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                  placeholder="+225 07 00 00 00 00"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="actif" checked={form.actif}
                  onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="actif" className="text-sm text-gray-700">Membre actif</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.nom}
                  className="flex-1 btn-primary"
                >
                  {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
