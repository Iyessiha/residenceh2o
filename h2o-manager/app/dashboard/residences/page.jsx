'use client'
import { useState } from 'react'
import { Edit, Trash, Plus, Upload, X } from 'lucide-react'

const RESIDENCES = [
  {
    id: 'deluxe',
    nom: 'Duplex Deluxe',
    prix: 150,
    capacite: '2-4 personnes',
    description: 'Notre entrée de gamme offre le confort essentiel avec style.',
    nbImages: 4,
    features: 11,
  },
  {
    id: 'jardin',
    nom: 'Duplex Jardin',
    prix: 200,
    capacite: '2-6 personnes',
    description: 'Avec jardin privatif et vue panoramique sur la lagune.',
    nbImages: 4,
    features: 9,
  },
  {
    id: 'presidential',
    nom: 'Duplex Presidential',
    prix: 350,
    capacite: '2-8 personnes',
    description: 'L\'apothéose du luxe avec tous les services premium.',
    nbImages: 4,
    features: 11,
  },
]

export default function ResidencesManager() {
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const handleEdit = (residence) => {
    setForm({
      ...residence,
      features: 'Piscine privée\nPontoon\nCuisine équipée',
    })
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/residences/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setEditing(false)
        setForm(null)
      }
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résidences</h1>
          <p className="text-gray-500 text-sm">Gérez les 3 duplexes, images et tarifs</p>
        </div>
        <button className="btn-primary">+ Nouvelle résidence</button>
      </div>

      {/* Residences Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {RESIDENCES.map(residence => (
          <div
            key={residence.id}
            onClick={() => setSelected(residence.id)}
            className={`card p-5 cursor-pointer transition-all ${
              selected === residence.id ? 'ring-2 ring-teal-500 bg-teal-50' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{residence.nom}</h3>
                <p className="text-xs text-gray-500 mt-1">{residence.capacite}</p>
              </div>
              <span className="text-xl font-bold text-teal-600">€{residence.prix}</span>
            </div>

            <p className="text-sm text-gray-600 mb-4 h-8 overflow-hidden">{residence.description}</p>

            <div className="flex justify-between text-xs text-gray-500 mb-4">
              <span>🖼️ {residence.nbImages} images</span>
              <span>✓ {residence.features} équipements</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(residence)}
                className="flex-1 text-xs btn-secondary flex items-center justify-center gap-1"
              >
                <Edit size={14} /> Modifier
              </button>
              <button className="flex-1 text-xs btn bg-red-50 text-red-600 hover:bg-red-100">
                <Trash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor */}
      {editing && form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{form.nom}</h2>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nom *</label>
                  <input
                    className="input"
                    value={form.nom}
                    onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Prix (€/nuit) *</label>
                  <input
                    className="input"
                    type="number"
                    value={form.prix}
                    onChange={e => setForm(p => ({ ...p, prix: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Capacité *</label>
                <input
                  className="input"
                  value={form.capacite}
                  onChange={e => setForm(p => ({ ...p, capacite: e.target.value }))}
                  placeholder="ex: 2-4 personnes"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Équipements (un par ligne)</label>
                <textarea
                  className="input font-mono text-xs"
                  rows={6}
                  value={form.features}
                  onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="label mb-2">📸 Images</label>
                <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition">
                  <div className="text-center">
                    <Upload size={24} className="text-gray-400 mx-auto mb-1" />
                    <span className="text-sm text-gray-600">Cliquez pour ajouter des photos</span>
                  </div>
                  <input type="file" multiple accept="image/*" className="hidden" />
                </label>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[...Array(form.nbImages)].map((_, i) => (
                    <div key={i} className="relative h-24 bg-gray-200 rounded overflow-hidden">
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
                        Photo {i + 1}
                      </div>
                      <button className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded hover:bg-red-700">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">
                Annuler
              </button>
              <button onClick={handleSave} className="btn-primary flex-1">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
