'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const CHAMPS = [
  { cle: 'rccm', label: 'RCCM', aide: 'Registre du commerce et du crédit mobilier' },
  { cle: 'ifu', label: 'N° IFU', aide: 'Identifiant fiscal unique' },
  { cle: 'tva', label: 'N° TVA', aide: "Numéro d'assujetti à la TVA, s'il existe" },
]

// Mentions légales affichées sur les factures (bloc « Émis par »)
export default function InfosLegales() {
  const supabase = createClient()
  const [infos, setInfos] = useState({ rccm: '', ifu: '', tva: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    supabase.from('entreprise').select('rccm, ifu, tva').eq('id', 1).maybeSingle()
      .then(({ data }) => {
        if (data) setInfos({ rccm: data.rccm || '', ifu: data.ifu || '', tva: data.tva || '' })
      })
  }, [])

  async function enregistrer(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const { error } = await supabase
      .from('entreprise')
      .upsert({ id: 1, ...infos, updated_at: new Date().toISOString() })
    setSaving(false)
    setMessage(error
      ? { type: 'error', text: `Erreur : ${error.message}` }
      : { type: 'success', text: 'Informations enregistrées. Elles figurent sur les prochaines factures.' })
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-gray-800 mb-1">Informations légales (factures)</h2>
      <p className="text-sm text-gray-500 mb-4">Affichées sur chaque facture. Laissez vide ce qui ne s'applique pas.</p>
      <form onSubmit={enregistrer} className="space-y-4">
        {CHAMPS.map(({ cle, label, aide }) => (
          <div key={cle}>
            <label className="label">{label}</label>
            <input
              className="input font-mono"
              value={infos[cle]}
              onChange={(e) => setInfos((p) => ({ ...p, [cle]: e.target.value }))}
              placeholder={aide}
            />
          </div>
        ))}
        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{message.text}</p>
        )}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
