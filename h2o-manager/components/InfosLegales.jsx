'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const CHAMPS = [
  { cle: 'rccm', label: 'RCCM', aide: 'Registre du commerce et du crédit mobilier' },
  { cle: 'ifu', label: 'N° IFU', aide: 'Identifiant fiscal unique' },
  { cle: 'tva', label: 'N° TVA', aide: "Numéro d'assujetti à la TVA, s'il existe" },
]

const VIDE = { rccm: '', ifu: '', tva: '', tva_taux: 0, taxes: [] }

// Mentions légales et taxes affichées ou appliquées sur les factures
export default function InfosLegales() {
  const supabase = createClient()
  const [infos, setInfos] = useState(VIDE)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    supabase.from('entreprise').select('rccm, ifu, tva, tva_taux, taxes').eq('id', 1).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setInfos({
            rccm: data.rccm || '',
            ifu: data.ifu || '',
            tva: data.tva || '',
            tva_taux: Number(data.tva_taux) || 0,
            taxes: Array.isArray(data.taxes) ? data.taxes : [],
          })
        }
      })
  }, [])

  function modifierTaxe(index, champ, valeur) {
    setInfos((p) => ({
      ...p,
      taxes: p.taxes.map((t, i) => (i === index ? { ...t, [champ]: valeur } : t)),
    }))
  }

  async function enregistrer(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const taxes = infos.taxes
      .filter((t) => t.nom.trim() && Number(t.taux) > 0)
      .map((t) => ({ nom: t.nom.trim(), taux: Number(t.taux) }))
    const { error } = await supabase
      .from('entreprise')
      .upsert({
        id: 1,
        rccm: infos.rccm,
        ifu: infos.ifu,
        tva: infos.tva,
        tva_taux: Number(infos.tva_taux) || 0,
        taxes,
        updated_at: new Date().toISOString(),
      })
    setSaving(false)
    setMessage(error
      ? { type: 'error', text: `Erreur : ${error.message}` }
      : { type: 'success', text: 'Informations enregistrées. Elles s’appliquent aux prochaines factures.' })
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-gray-800 mb-1">Informations légales et taxes (factures)</h2>
      <p className="text-sm text-gray-500 mb-4">Affichées sur chaque facture. Laissez vide ce qui ne s'applique pas.</p>
      <form onSubmit={enregistrer} className="space-y-6">
        <div className="space-y-4">
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
        </div>

        <div className="border-t border-gray-100 pt-5 space-y-4">
          <div>
            <p className="font-medium text-gray-800">Taxes</p>
            <p className="text-sm text-gray-500">
              Les montants des factures sont saisis TTC. Le HT et chaque taxe sont calculés à partir du total.
            </p>
          </div>

          <div>
            <label className="label">Taux de TVA (%)</label>
            <input
              type="number" min="0" step="0.01" className="input w-40"
              value={infos.tva_taux}
              onChange={(e) => setInfos((p) => ({ ...p, tva_taux: e.target.value }))}
              placeholder="0 = pas de TVA"
            />
          </div>

          <div className="space-y-2">
            <label className="label">Autres taxes</label>
            {infos.taxes.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="input flex-1" value={t.nom} placeholder="Nom de la taxe"
                  onChange={(e) => modifierTaxe(i, 'nom', e.target.value)}
                />
                <input
                  type="number" min="0" step="0.01" className="input w-28" value={t.taux} placeholder="%"
                  onChange={(e) => modifierTaxe(i, 'taux', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setInfos((p) => ({ ...p, taxes: p.taxes.filter((_, j) => j !== i) }))}
                  className="btn-secondary"
                  aria-label="Supprimer la taxe"
                >×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setInfos((p) => ({ ...p, taxes: [...p.taxes, { nom: '', taux: '' }] }))}
              className="btn-secondary"
            >+ Ajouter une taxe</button>
          </div>
        </div>

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
