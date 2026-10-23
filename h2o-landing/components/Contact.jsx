'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatFCFA } from '@/lib/residences'

// Formules proposées pour une villa ou une chambre (fiche : nuit 24/24 et matinée)
const FORMULES = {
  nuit: { libelle: 'Nuit complète 24/24', detail: 'Petit déjeuner inclus' },
  matinee: { libelle: 'Matinée', detail: 'Demi-journée, sans nuitée' },
}

const MIN_NUITS_VILLA = 2
const VIDE = {
  nom: '',
  telephone: '',
  email: '',
  duplex: '',
  chambre: '',
  formule: 'nuit',
  date_arrivee: '',
  date_depart: '',
  nb_personnes: '',
  message: '',
  type: 'sejour',
}

function nombreDeNuits(arrivee, depart) {
  if (!arrivee || !depart) return 0
  const jours = (new Date(depart) - new Date(arrivee)) / 86400000
  return jours > 0 ? jours : 0
}

// Tarifs de la villa ou de la chambre choisie. null si rien n'est sélectionné.
function tarifsChoisis(form, duplexes, chambres) {
  if (form.type === 'sejour') {
    const villa = duplexes.find((d) => d.id === form.duplex)
    return villa ? { nuit: villa.prix, matinee: villa.prixJournee, capacite: 10 } : null
  }
  if (form.type === 'chambre') {
    const chambre = chambres.find((c) => c.nom === form.chambre)
    return chambre ? { nuit: chambre.tarif_nuit, matinee: chambre.tarif_journee, capacite: 2 } : null
  }
  return null
}

// Total estimé selon la formule. null si la formule ou les dates ne permettent pas de calculer.
function estimation(form, tarifs) {
  if (!tarifs) return null
  if (form.formule === 'matinee') {
    return tarifs.matinee ? { total: tarifs.matinee, detail: 'Matinée · 1 demi-journée' } : null
  }
  const nuits = nombreDeNuits(form.date_arrivee, form.date_depart)
  if (!nuits) return null
  return { total: tarifs.nuit * nuits, detail: `${formatFCFA(tarifs.nuit)} × ${nuits} nuit${nuits > 1 ? 's' : ''}` }
}

export default function Contact({ duplexes, chambres = [] }) {
  const [form, setForm] = useState(VIDE)
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [erreur, setErreur] = useState('')

  // Pré-remplit le formulaire avec la sélection faite dans le widget de réservation
  useEffect(() => {
    const onReservation = (e) => {
      const { duplex, arrivee, depart, voyageurs, formule } = e.detail
      const matinee = formule === 'matinee'
      setForm(prev => ({
        ...prev,
        type: 'sejour',
        duplex: duplex || '',
        formule: matinee ? 'matinee' : 'nuit',
        date_arrivee: arrivee || '',
        date_depart: matinee ? arrivee || '' : depart || '',
        nb_personnes: voyageurs ? String(voyageurs) : '',
      }))
      setStatus(null)
      setErreur('')
    }
    window.addEventListener('h2o:reservation', onReservation)
    return () => window.removeEventListener('h2o:reservation', onReservation)
  }, [])

  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : null

  const reserve = form.type === 'sejour' || form.type === 'chambre'
  const tarifs = tarifsChoisis(form, duplexes, chambres)
  const estim = reserve ? estimation(form, tarifs) : null

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // En matinée, la date de départ suit toujours la date d'arrivée
  const handleArrivee = (e) => {
    const arrivee = e.target.value
    setForm(prev => ({
      ...prev,
      date_arrivee: arrivee,
      date_depart: prev.formule === 'matinee' ? arrivee : prev.date_depart,
    }))
  }

  const choisirFormule = (cle) => {
    setForm(prev => ({
      ...prev,
      formule: cle,
      date_depart: cle === 'matinee' ? prev.date_arrivee : prev.date_depart,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')

    if (reserve) {
      if (!form.date_arrivee) return setErreur("Choisissez une date d'arrivée.")
      if (form.formule === 'nuit' && form.date_depart <= form.date_arrivee) {
        return setErreur("La date de départ doit être après la date d'arrivée.")
      }
      if (form.type === 'sejour' && form.formule === 'nuit' && nombreDeNuits(form.date_arrivee, form.date_depart) < MIN_NUITS_VILLA) {
        return setErreur(`Minimum ${MIN_NUITS_VILLA} nuits pour une villa.`)
      }
    }

    setStatus('loading')
    try {
      if (supabase) {
        const lignes = []
        if (form.type === 'chambre' && form.chambre) lignes.push(`Chambre souhaitée : ${form.chambre}`)
        if (reserve) {
          const libelle = FORMULES[form.formule].libelle
          lignes.push(`Formule : ${libelle}${estim ? ` — estimation ${formatFCFA(estim.total)}` : ''}`)
        }
        if (form.message) lignes.push(form.message)

        const { error } = await supabase.from('reservations').insert([{
          nom_client: form.nom,
          telephone: form.telephone,
          email: form.email,
          duplex_id: form.type === 'chambre' ? null : (form.duplex || null),
          date_arrivee: form.date_arrivee || null,
          date_depart: (form.formule === 'matinee' ? form.date_arrivee : form.date_depart) || null,
          nb_personnes: form.nb_personnes ? parseInt(form.nb_personnes) : null,
          notes: lignes.join('\n'),
          type: form.type,
          statut: 'en_attente',
          source: 'site_web',
        }])
        if (error) throw error
      } else {
        // Fallback simulation when supabase is not configured
        await new Promise(r => setTimeout(r, 600))
      }
      setStatus('success')
      setForm(VIDE)
    } catch {
      setStatus('error')
    }
  }

  const champDate = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'
  const champSelect = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'

  return (
    <section id="contact" className="py-12 sm:py-16 lg:py-20 bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Left: info */}
          <div>
            <span className="section-label">Contact & Réservation</span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-teal-900 mt-3 mb-6">
              Planifiez votre séjour
            </h2>
            <p className="text-gray-600 mb-8">
              Remplissez le formulaire et nous vous répondons sous 24h. Vous pouvez aussi nous
              contacter directement par WhatsApp.
            </p>

            <div className="space-y-4">
              <a
                href="https://wa.me/2250705259234?text=Bonjour%2C%20je%20souhaite%20réserver%20une%20villa%20aux%20Résidences%20H2O"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
              >
                <span className="text-xl">💬</span>
                <span>WhatsApp — Réponse rapide</span>
              </a>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                <p className="font-semibold text-teal-900">+225 07 49 19 49 52</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Localisation</p>
                <p className="font-semibold text-teal-900">Villa Poton — Ancienne route de Bassam, au lac</p>
                <p className="text-sm text-gray-500">{"À 10 min de la plage · 30 min de l'aéroport et d'Abidjan"}</p>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
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
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type de demande</label>
                  <select name="type" value={form.type} onChange={handleChange} className={champSelect}>
                    <option value="sejour">Villa entière</option>
                    <option value="chambre">Chambre</option>
                    <option value="evenement">Événement / espace événementiel</option>
                    <option value="renseignement">Simple renseignement</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                {reserve && (
                  <>
                    {/* Villa ou chambre */}
                    {form.type === 'sejour' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Villa souhaitée</label>
                        <select name="duplex" value={form.duplex} onChange={handleChange} className={champSelect}>
                          <option value="">— Choisissez une villa —</option>
                          {duplexes.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.nom} — {formatFCFA(d.prix)} / nuit{d.prixJournee ? ` · matinée ${formatFCFA(d.prixJournee)}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chambre souhaitée</label>
                        <select name="chambre" value={form.chambre} onChange={handleChange} className={champSelect}>
                          <option value="">— Choisissez une chambre —</option>
                          {chambres.filter(c => c.statut !== 'occupee').map((c) => (
                            <option key={c.nom} value={c.nom}>
                              {c.nom} — {formatFCFA(c.tarif_nuit)} / nuit{c.tarif_journee ? ` · journée ${formatFCFA(c.tarif_journee)}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Formule */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Formule</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(FORMULES).map(([cle, f]) => (
                          <button
                            type="button"
                            key={cle}
                            onClick={() => choisirFormule(cle)}
                            className={`text-left rounded-xl border-2 px-3 py-2.5 transition-colors ${
                              form.formule === cle ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
                            }`}
                          >
                            <span className="block text-sm font-semibold text-gray-900">{f.libelle}</span>
                            <span className="block text-xs text-gray-500">{f.detail}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className={form.formule === 'matinee' ? '' : 'grid grid-cols-2 gap-3'}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {form.formule === 'matinee' ? 'Date de la matinée' : 'Arrivée'}
                        </label>
                        <input name="date_arrivee" type="date" value={form.date_arrivee} onChange={handleArrivee}
                          min={new Date().toISOString().split('T')[0]} className={champDate} />
                      </div>
                      {form.formule === 'nuit' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Départ</label>
                          <input name="date_depart" type="date" value={form.date_depart} onChange={handleChange}
                            min={form.date_arrivee || new Date().toISOString().split('T')[0]} className={champDate} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de personnes</label>
                      <input name="nb_personnes" type="number" min="1" max={tarifs?.capacite ?? 10} value={form.nb_personnes} onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="2" />
                      {form.type === 'chambre' && <p className="text-xs text-gray-500 mt-1">2 personnes maximum par chambre.</p>}
                    </div>

                    {/* Estimation */}
                    {estim && (
                      <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 text-sm">
                        <p className="text-gray-600">{estim.detail}</p>
                        <p className="font-bold text-teal-900">Total estimé : {formatFCFA(estim.total)}</p>
                        <p className="text-xs text-gray-500">Disponibilité et tarif confirmés par notre équipe sous 24 h.</p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Précisions, questions particulières..." />
                </div>

                {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
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
