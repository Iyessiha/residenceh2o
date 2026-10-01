'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase-config'

export default function Contact() {
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    email: '',
    duplex: '',
    date_arrivee: '',
    date_depart: '',
    nb_personnes: '',
    message: '',
    type: 'sejour',
  })
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { error } = await supabase.from('reservations').insert([{
        nom_client: form.nom,
        telephone: form.telephone,
        email: form.email,
        duplex_id: form.duplex || null,
        date_arrivee: form.date_arrivee || null,
        date_depart: form.date_depart || null,
        nb_personnes: form.nb_personnes ? parseInt(form.nb_personnes) : null,
        notes: form.message,
        type: form.type,
        statut: 'en_attente',
        source: 'site_web',
      }])
      if (error) throw error
      setStatus('success')
      setForm({ nom: '', telephone: '', email: '', duplex: '', date_arrivee: '', date_depart: '', nb_personnes: '', message: '', type: 'sejour' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="py-20 bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: info */}
          <div>
            <span className="section-label">Contact & Réservation</span>
            <h2 className="font-serif text-4xl font-bold text-teal-900 mt-3 mb-6">
              Planifiez votre séjour
            </h2>
            <p className="text-gray-600 mb-8">
              Remplissez le formulaire et nous vous répondons sous 24h. Vous pouvez aussi nous
              contacter directement par WhatsApp.
            </p>

            <div className="space-y-4">
              <a
                href="https://wa.me/2250500446464?text=Bonjour%2C%20je%20souhaite%20réserver%20un%20duplex%20aux%20Résidences%20H2O"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
              >
                <span className="text-xl">💬</span>
                <span>WhatsApp — Réponse rapide</span>
              </a>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                <p className="font-semibold text-teal-900">+225 07 XX XX XX XX</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Localisation</p>
                <p className="font-semibold text-teal-900">Route de Grand-Bassam, Modeste Beach</p>
                <p className="text-sm text-gray-500">À 30 min du Plateau, Abidjan</p>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {status === 'success' ? (
              <div className="text-center py-8">
                <span className="text-5xl">✅</span>
                <h3 className="font-serif text-2xl font-bold text-teal-900 mt-4 mb-2">
                  Demande envoyée !
                </h3>
                <p className="text-gray-600">
                  Nous vous recontactons dans les 24h pour confirmer votre réservation.
                </p>
                <button
                  onClick={() => setStatus(null)}
                  className="mt-6 text-teal-600 underline text-sm"
                >
                  Faire une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de demande</label>
                  <select name="type" value={form.type} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="sejour">Séjour en duplex</option>
                    <option value="evenement">Événement / Pergola</option>
                    <option value="renseignement">Simple renseignement</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                    <input required name="nom" value={form.nom} onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Koné Aminata" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input required name="telephone" value={form.telephone} onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="+225 07 XX XX XX" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="email@exemple.com" />
                </div>

                {form.type === 'sejour' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duplex souhaité</label>
                      <select name="duplex" value={form.duplex} onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">— Pas de préférence —</option>
                        <option value="D-1">Duplex Lac (D-1)</option>
                        <option value="D-2">Duplex Jardin (D-2)</option>
                        <option value="D-3">Duplex Premium (D-3)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Arrivée</label>
                        <input name="date_arrivee" type="date" value={form.date_arrivee} onChange={handleChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Départ</label>
                        <input name="date_depart" type="date" value={form.date_depart} onChange={handleChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de personnes</label>
                      <input name="nb_personnes" type="number" min="1" max="20" value={form.nb_personnes} onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="2" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Précisions, questions particulières..." />
                </div>

                {status === 'error' && (
                  <p className="text-red-600 text-sm">Une erreur est survenue. Contactez-nous par WhatsApp.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {status === 'loading' ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
