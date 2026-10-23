'use client'
import { useState } from 'react'
import { Upload, X, Edit, Plus } from 'lucide-react'

const SERVICES = [
  { id: 'piscine', nom: '🏊 Piscine privée', desc: 'Piscine privée et pontoon dans chaque villa, jusqu\'à 10 personnes' },
  { id: 'restaurant', nom: '🍽️ Restaurant & bar', desc: 'Petit déjeuner inclus, carte de volailles, poissons et boissons' },
  { id: 'events', nom: '🎉 Espace événementiel', desc: 'Espace événementiel au bord du lac, jusqu\'à 200 invités, pontoon, bar climatisé 10–15 pers.' },
  { id: 'menage', nom: '🧹 Ménage & buanderie', desc: 'Ménage quotidien inclus, ménage 2× par semaine pour les longs séjours, buanderie et repassage' },
  { id: 'securite', nom: '🛡️ Sécurité', desc: 'Caméras de surveillance, agent de sécurité, groupe électrogène' },
  { id: 'connectivite', nom: '📶 Wi-Fi 5G & TV', desc: 'Wi-Fi 5G, TV salon et chambre, enceinte Bluetooth, télécommandes' },
]

export default function Services() {
  const [selected, setSelected] = useState(null)
  const [photos, setPhotos] = useState({})
  const [uploading, setUploading] = useState(null)

  const handleFileChange = async (serviceId, file) => {
    if (!file) return

    setUploading(serviceId)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('serviceId', serviceId)

    try {
      const res = await fetch('/api/services/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setPhotos(p => ({
          ...p,
          [serviceId]: [...(p[serviceId] || []), { id: Date.now(), url: data.url, name: file.name }]
        }))
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(null)
    }
  }

  const removePhoto = (serviceId, photoId) => {
    setPhotos(p => ({
      ...p,
      [serviceId]: p[serviceId].filter(ph => ph.id !== photoId)
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services & Événementiels</h1>
          <p className="text-gray-500 text-sm">Gérez les photos et descriptions de chaque service</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {SERVICES.map(service => (
          <div
            key={service.id}
            onClick={() => setSelected(service.id)}
            className={`card p-5 cursor-pointer transition-all ${
              selected === service.id ? 'ring-2 ring-teal-500 bg-teal-50' : 'hover:shadow-md'
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">{service.nom}</h3>
            <p className="text-sm text-gray-600 mb-3">{service.desc}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="badge bg-gray-100 text-gray-600">
                {photos[service.id]?.length || 0} photo(s)
              </span>
              <button className="text-teal-600 hover:text-teal-700">
                <Edit size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Editor */}
      {selected && (
        <div className="card p-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">
                {SERVICES.find(s => s.id === selected)?.nom}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Téléchargez les photos pour ce service
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Upload Zone */}
          <div className="mb-6">
            <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition">
              <div className="text-center">
                <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-600">
                  Déposez les photos ici ou cliquez pour sélectionner
                </span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  Array.from(e.target.files || []).forEach(file => {
                    handleFileChange(selected, file)
                  })
                }}
              />
            </label>
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos[selected]?.map(photo => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => removePhoto(selected, photo.id)}
                    className="opacity-0 group-hover:opacity-100 transition bg-red-600 text-white p-2 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 truncate">{photo.name}</p>
              </div>
            ))}
          </div>

          {!photos[selected] && (
            <div className="text-center py-12 text-gray-400">
              Aucune photo téléchargée pour ce service
            </div>
          )}

          {/* Save button */}
          <button className="btn-primary w-full mt-6">
            Enregistrer les modifications
          </button>
        </div>
      )}
    </div>
  )
}
