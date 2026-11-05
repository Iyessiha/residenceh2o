'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export const TAUX_PAR_DEFAUT = 10

// Formulaire création / modification d'un démarcheur (nom, prénom, téléphone, taux de commission)
export default function DemarcheurForm({ initial = null, onClose, onSaved }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    nom: initial?.nom || '',
    prenom: initial?.prenom || '',
    telephone: initial?.telephone || '',
    taux_commission: initial ? String(Number(initial.taux_commission)) : String(TAUX_PAR_DEFAUT),
  })
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState(null)

  const taux = Number(form.taux_commission)
  const tauxValide = form.taux_commission !== '' && Number.isFinite(taux) && taux >= 0 && taux <= 100

  async function save() {
    setSaving(true)
    setErreur(null)
    const payload = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      taux_commission: taux,
    }
    const { error } = initial
      ? await supabase.from('demarcheurs').update(payload).eq('id', initial.id)
      : await supabase.from('demarcheurs').insert([payload])
    setSaving(false)
    if (error) { setErreur(error.message); return }
    onSaved?.()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{initial ? 'Modifier le démarcheur' : 'Nouveau démarcheur'}</h2>
          <button onClick={onClose} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nom *</label>
            <input className="input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
          </div>
          <div>
            <label className="label">Prénom</label>
            <input className="input" value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Taux de commission (%)</label>
            <input className="input" type="number" min="0" max="100" step="0.5" value={form.taux_commission}
              onChange={e => setForm(p => ({ ...p, taux_commission: e.target.value }))} />
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>
          La commission se calcule sur le montant de chaque réservation apportée : montant × taux / 100.
          Le taux est figé à l'enregistrement de chaque réservation.
        </p>
        {erreur && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4">{erreur}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={save} disabled={saving || !form.nom.trim() || !tauxValide} className="btn-primary flex-1">
            {saving ? '...' : initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
