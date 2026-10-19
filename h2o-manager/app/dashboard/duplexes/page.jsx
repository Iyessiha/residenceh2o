'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { DUPLEX_STATUT_COLORS, formatFCFA } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'

const STATUT_LABELS = { disponible: 'Disponible', occupe: 'Occupé', maintenance: 'Maintenance' }
const EMPTY = { nom: '', code: '', capacite: 2, chambres: 5, surface_m2: '', description: '', tagline: '', badge: '', features: '', tarif_nuit: '', statut: 'disponible' }

export default function Duplexes() {
  const supabase = createClient()
  const [duplexes, setDuplexes]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY)
  const [editId, setEditId]         = useState(null)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [qrDuplex, setQrDuplex]     = useState(null) // duplex pour lequel afficher le QR

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('duplexes').select('*').order('code')
    setDuplexes(data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(d) {
    setEditId(d.id)
    setForm({
      nom:         d.nom         || '',
      code:        d.code        || '',
      capacite:    d.capacite    ?? 2,
      chambres:    d.chambres    ?? 5,
      surface_m2:  d.surface_m2  ?? '',
      description: d.description || '',
      tagline:     d.tagline     || '',
      badge:       d.badge       || '',
      features:    (d.features || []).join('\n'),
      tarif_nuit:  d.tarif_nuit  ?? '',
      statut:      d.statut      || 'disponible',
    })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const payload = {
      ...form,
      capacite:   parseInt(form.capacite)   || 2,
      chambres:   parseInt(form.chambres)   || 5,
      tarif_nuit: form.tarif_nuit ? parseInt(form.tarif_nuit) : null,
      surface_m2: form.surface_m2 ? parseInt(form.surface_m2) : null,
      features:   form.features.split('\n').map(f => f.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    }

    if (editId) {
      await supabase.from('duplexes').update(payload).eq('id', editId)
    } else {
      await supabase.from('duplexes').insert([payload])
    }

    setShowForm(false)
    setForm(EMPTY)
    setEditId(null)
    load()
    setSaving(false)
  }

  async function confirmDelete() {
    setDeleting(true)
    await supabase.from('duplexes').delete().eq('id', deleteId)
    setDeleteId(null)
    setDeleting(false)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Duplexes & Logements</h1>
        <button onClick={openCreate} className="btn-primary">+ Ajouter un duplex</button>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>Chargement...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {duplexes.map(d => (
            <div key={d.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>{d.code}</span>
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{d.nom}</h3>
                </div>
                <span className={`badge ${DUPLEX_STATUT_COLORS[d.statut]}`}>{STATUT_LABELS[d.statut]}</span>
              </div>

              <div className="text-sm space-y-1 mb-4" style={{ color: 'var(--text-3)' }}>
                <p>👥 {d.capacite} personnes max</p>
                {d.surface_m2 && <p>📐 {d.surface_m2} m²</p>}
                {d.tarif_nuit && (
                  <p className="font-semibold" style={{ color: 'var(--primary)' }}>
                    {formatFCFA(d.tarif_nuit)} / nuit
                  </p>
                )}
                {d.description && (
                  <p className="text-xs mt-2 italic" style={{ color: 'var(--text-3)' }}>{d.description}</p>
                )}
              </div>

              <div className="border-t pt-3 flex gap-2" style={{ borderColor: 'var(--border-2)' }}>
                <button
                  onClick={() => openEdit(d)}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => setQrDuplex(d)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg border transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--border)', color: 'var(--primary)', backgroundColor: 'var(--bg)' }}
                  title="Voir le QR Code invité"
                >
                  QR
                </button>
                <button
                  onClick={() => setDeleteId(d.id)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg border transition-opacity hover:opacity-70"
                  style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: '#FEF2F2' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {duplexes.length === 0 && (
            <div className="col-span-3 text-center py-16" style={{ color: 'var(--text-3)' }}>
              Aucun duplex enregistré. Ajoutez votre premier duplex.
            </div>
          )}
        </div>
      )}

      {/* Modal création / édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editId ? 'Modifier le duplex' : 'Nouveau duplex'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Code (ex: D-1)</label>
                  <input className="input" value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value}))} placeholder="D-1" />
                </div>
                <div>
                  <label className="label">Nom *</label>
                  <input className="input" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} placeholder="Duplex Lac" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Capacité (pers.)</label>
                  <input className="input" type="number" min="1" value={form.capacite} onChange={e => setForm(p => ({...p, capacite: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Chambres</label>
                  <input className="input" type="number" min="1" value={form.chambres} onChange={e => setForm(p => ({...p, chambres: e.target.value}))} />
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
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Vue lac, piscine 20m²..." />
              </div>
              <div>
                <label className="label">Accroche (affichée sur le site)</label>
                <input className="input" value={form.tagline} onChange={e => setForm(p => ({...p, tagline: e.target.value}))} placeholder="Vue panoramique sur la lagune" />
              </div>
              <div>
                <label className="label">Badge</label>
                <input className="input" value={form.badge} onChange={e => setForm(p => ({...p, badge: e.target.value}))} placeholder="Vue Lagune, Idéal Famille, Prestige VIP" />
              </div>
              <div>
                <label className="label">Équipements (un par ligne, affichés sur le site)</label>
                <textarea className="input font-mono text-xs" rows={5} value={form.features} onChange={e => setForm(p => ({...p, features: e.target.value}))} placeholder={'Piscine privée 20m²\nPontoon privé'} />
              </div>
              <div>
                <label className="label">Statut</label>
                <select className="input" value={form.statut} onChange={e => setForm(p => ({...p, statut: e.target.value}))}>
                  {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom} className="btn-primary flex-1">
                {saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code invité */}
      {qrDuplex && (() => {
        const guestUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/guest/${qrDuplex.id}`
          : `/guest/${qrDuplex.id}`
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl text-center" style={{ backgroundColor: 'var(--bg)' }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
                QR Code — {qrDuplex.nom}
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
                À imprimer et coller dans le duplex {qrDuplex.code}
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-2xl shadow-inner inline-block">
                  <QRCodeSVG
                    value={guestUrl}
                    size={220}
                    level="M"
                    includeMargin={false}
                    fgColor="#1A0A04"
                  />
                </div>
              </div>

              {/* Label sous le QR */}
              <div className="mb-5">
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  Les Résidences H₂O — {qrDuplex.nom}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  Scannez pour commander ou demander de l'aide
                </p>
                <p className="text-xs font-mono mt-2 break-all px-2" style={{ color: 'var(--text-3)' }}>
                  {guestUrl}
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setQrDuplex(null)} className="btn-secondary flex-1">Fermer</button>
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex-1"
                >
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Supprimer ce duplex ?</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
              Cette action est irréversible. Les réservations liées ne seront pas supprimées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#DC2626' }}>
                {deleting ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
