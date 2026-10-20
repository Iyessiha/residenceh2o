'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Client Supabase anon — lecture publique + insertions invitées
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ── Catégories menu ───────────────────────────────────────
const CATS = [
  { key: 'plat',    label: 'Plats',           emoji: '🍽️' },
  { key: 'entree',  label: 'Entrées',          emoji: '🥗' },
  { key: 'dessert', label: 'Desserts',         emoji: '🍮' },
  { key: 'vin',     label: 'Vins & Cocktails', emoji: '🍷' },
  { key: 'jus',     label: 'Jus & Smoothies',  emoji: '🧃' },
  { key: 'boisson', label: 'Boissons',         emoji: '🥤' },
  { key: 'autre',   label: 'Autre',            emoji: '📦' },
]
const CAT_LABEL = Object.fromEntries(CATS.map(c => [c.key, c.label]))
const CAT_EMOJI = Object.fromEntries(CATS.map(c => [c.key, c.emoji]))

const SECTIONS_GUEST = [
  { key: 'food',   label: 'À manger', emoji: '🍽️', cats: ['plat', 'entree', 'dessert'] },
  { key: 'drinks', label: 'À boire',  emoji: '🍹', cats: ['vin', 'jus', 'boisson', 'autre'] },
]

function fcfa(n) {
  if (!n) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

// ── Composant panier ──────────────────────────────────────
function CartBar({ cart, onOpen }) {
  const total = cart.reduce((s, i) => s + i.prix * i.qte, 0)
  const count = cart.reduce((s, i) => s + i.qte, 0)
  if (count === 0) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-4 safe-area-pb">
      <button
        onClick={onOpen}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-white shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#1A0A04,#E8513A)' }}
      >
        <span className="flex items-center gap-2">
          <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">{count}</span>
          <span className="font-semibold">Voir ma commande</span>
        </span>
        <span className="font-bold">{fcfa(total)}</span>
      </button>
    </div>
  )
}

// ── Modal validation commande ─────────────────────────────
function OrderModal({ cart, onClose, onConfirm }) {
  const [nom, setNom]     = useState('')
  const [note, setNote]   = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult]   = useState(null) // { id, type } après succès
  const [erreur, setErreur]   = useState('')

  const total = cart.reduce((s, i) => s + i.prix * i.qte, 0)

  async function submit() {
    setSending(true)
    setErreur('')
    try {
      const res = await onConfirm({ nom, note })
      setResult(res)
    } catch {
      setErreur('Erreur lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setSending(false)
    }
  }

  if (result) return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Commande reçue !</h2>
        <p className="text-gray-500 text-sm mb-6">Notre équipe prend en charge votre commande.</p>
        <button onClick={() => onClose(result)} className="w-full py-3 rounded-xl text-white font-semibold"
          style={{ backgroundColor: '#E8513A' }}>Suivre ma commande</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Confirmer la commande</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        {/* Récapitulatif */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-2">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.nom} <span className="text-gray-400">×{item.qte}</span></span>
              <span className="font-medium text-gray-900">{fcfa(item.prix * item.qte)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
            <span>Total</span>
            <span style={{ color: '#E8513A' }}>{fcfa(total)}</span>
          </div>
        </div>

        {/* Infos optionnelles */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Votre prénom (optionnel)
            </label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Kofi, Marie…" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Note (optionnel)
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="Sans piment, sans gluten…" />
          </div>
        </div>

        {erreur && (
          <p className="text-red-500 text-sm text-center mb-3 font-medium">{erreur}</p>
        )}

        <button onClick={submit} disabled={sending}
          className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#1A0A04,#E8513A)' }}>
          {sending ? 'Envoi en cours…' : 'Passer la commande'}
        </button>
      </div>
    </div>
  )
}

// ── Suivi en temps réel ───────────────────────────────────
function SuiviCommande({ orderId, orderType, onRetour }) {
  const [statut, setStatut] = useState(orderType === 'restaurant' ? 'en_cours' : 'en_attente')

  useEffect(() => {
    const table = orderType === 'restaurant' ? 'commandes_restaurant' : 'ventes'
    sb.from(table).select('statut').eq('id', orderId).single()
      .then(({ data }) => { if (data?.statut) setStatut(data.statut) })

    const channel = sb.channel(`suivi-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table,
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        if (payload.new?.statut) setStatut(payload.new.statut)
      })
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [orderId, orderType])

  const STEPS = orderType === 'restaurant'
    ? [
        { key: 'en_cours', label: 'Commande reçue',      emoji: '✅' },
        { key: 'servie',   label: 'En cours de service', emoji: '🔥' },
        { key: 'payee',    label: 'Réglée — Bon appétit !', emoji: '🎉' },
      ]
    : [
        { key: 'en_attente', label: 'Commande reçue', emoji: '✅' },
        { key: 'confirme',   label: 'Confirmée',       emoji: '📦' },
        { key: 'livre',      label: 'Livré',            emoji: '🎉' },
      ]

  const currentIdx = Math.max(0, STEPS.findIndex(s => s.key === statut))
  const isDelivered = orderType === 'restaurant' ? statut === 'payee' : statut === 'livre'

  return (
    <div className="px-4 pt-5">
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">{isDelivered ? '🎉' : '⏳'}</div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isDelivered ? 'Commande livrée !' : 'Commande en cours'}
            </h2>
            <p className="text-xs text-gray-400">
              {isDelivered ? 'Bon appétit !' : 'La page se met à jour automatiquement'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          {STEPS.map((step, idx) => {
            const done = idx < currentIdx
            const active = idx === currentIdx
            const isLast = idx === STEPS.length - 1
            return (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-all ${
                      done ? 'bg-green-100 text-green-700' : !active ? 'bg-gray-100 text-gray-300' : ''
                    }`}
                    style={active ? { backgroundColor: '#E8513A', color: '#fff' } : {}}
                  >
                    {done ? '✓' : step.emoji}
                  </div>
                  {!isLast && <div className={`w-0.5 h-8 mt-1 ${done ? 'bg-green-200' : 'bg-gray-100'}`} />}
                </div>
                <div className="pt-2 pb-5">
                  <p className={`font-semibold text-sm ${active ? 'text-gray-900' : done ? 'text-green-700' : 'text-gray-300'}`}>
                    {step.label}
                  </p>
                  {active && !isDelivered && (
                    <p className="text-xs mt-0.5 animate-pulse" style={{ color: '#E8513A' }}>En cours…</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={onRetour}
          className={`w-full py-3 rounded-2xl font-semibold text-sm ${isDelivered ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
          style={isDelivered ? { backgroundColor: '#E8513A' } : {}}
        >
          {isDelivered ? "Retour à l'accueil" : "Retour à l'accueil (commande en cours)"}
        </button>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────
export default function GuestPortal({ params }) {
  const { id } = params

  const [duplex, setDuplex]   = useState(null)
  const [menu, setMenu]       = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [view, setView] = useState('home') // 'home' | 'restaurant' | 'boutique' | 'assistance'
  const [catFilter, setCatFilter] = useState('tous')
  const [cart, setCart]         = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  // Assistance
  const [assistMsg, setAssistMsg]   = useState('')
  const [assistNom, setAssistNom]   = useState('')
  const [assistSent, setAssistSent] = useState(false)
  const [assistSending, setAssistSending] = useState(false)

  // Suivi commande
  const [lastOrderId,   setLastOrderId]   = useState(null)
  const [lastOrderType, setLastOrderType] = useState(null) // 'restaurant' | 'boutique'

  useEffect(() => {
    async function load() {
      const [duplexRes, menuRes, articlesRes] = await Promise.all([
        sb.from('duplexes').select('id, nom, code').eq('id', id).single(),
        sb.from('menu_restaurant').select('*').eq('disponible', true).order('categorie').order('nom'),
        sb.from('articles').select('*').eq('actif', true).order('nom'),
      ])
      if (!duplexRes.data) { setNotFound(true); setLoading(false); return }
      setDuplex(duplexRes.data)
      setMenu(menuRes.data || [])
      setArticles(articlesRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.findIndex(i => i.id === item.id)
      if (existing >= 0) {
        return prev.map((i, idx) => idx === existing ? { ...i, qte: i.qte + 1 } : i)
      }
      return [...prev, { ...item, qte: 1 }]
    })
  }
  function removeFromCart(itemId) {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, qte: i.qte - 1 } : i).filter(i => i.qte > 0))
  }
  function qteOf(itemId) { return cart.find(i => i.id === itemId)?.qte || 0 }

  async function confirmOrder({ nom, note }) {
    const lignes = cart.map(i => ({ nom: i.nom, qte: i.qte, prix: i.prix }))
    const montant_total = cart.reduce((s, i) => s + i.prix * i.qte, 0)
    const nom_client = nom || `Duplex ${duplex.code}`

    if (view === 'restaurant') {
      const { data, error } = await sb.from('commandes_restaurant').insert([{
        nom_client,
        table_num: duplex.code,
        lignes, montant_total,
        mode_paiement: 'especes', statut: 'en_cours',
        notes: note || null,
      }]).select('id').single()
      if (error) throw new Error(error.message)
      setCart([])
      return { id: data?.id, type: 'restaurant' }
    } else {
      const { data, error } = await sb.from('ventes').insert([{
        nom_client,
        lignes, montant_total,
        mode_paiement: 'especes', statut: 'en_attente',
        notes: note || null,
      }]).select('id').single()
      if (error) throw new Error(error.message)
      setCart([])
      return { id: data?.id, type: 'boutique' }
    }
  }

  async function sendAssistance() {
    if (!assistMsg.trim()) return
    setAssistSending(true)
    await sb.from('demandes_assistance').insert([{
      duplex_id: duplex.id,
      duplex_code: duplex.code,
      duplex_nom: duplex.nom,
      message: assistMsg.trim(),
      nom_client: assistNom || null,
      statut: 'nouveau',
    }])
    setAssistSent(true)
    setAssistSending(false)
  }

  function goBack() {
    setView('home')
    setCart([])
    setCatFilter('tous')
    setAssistMsg('')
    setAssistNom('')
    setAssistSent(false)
    setLastOrderId(null)
    setLastOrderType(null)
  }

  // ── Rendu loading / not found ─────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg,#1A0A04 0%,#3A1408 60%,#E8513A 100%)' }}>
      <div className="text-white text-center">
        <div className="text-4xl mb-3 animate-pulse">🏊</div>
        <p className="text-white/70 text-sm">Chargement…</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Duplex introuvable</h1>
        <p className="text-gray-500 text-sm">Ce QR code n'est plus valide. Contactez la réception.</p>
      </div>
    </div>
  )

  // Filtrage menu
  const menuFiltered = catFilter === 'tous' ? menu : menu.filter(m => m.categorie === catFilter)
  const catsPresentes = CATS.filter(c => menu.some(m => m.categorie === c.key))

  // ── Rendu ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-28" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-6 text-white"
        style={{ background: 'linear-gradient(135deg,#1A0A04 0%,#3A1408 60%,#E8513A 100%)' }}>
        {view !== 'home' && (
          <button onClick={goBack} className="flex items-center gap-1 text-white/70 text-sm mb-3 hover:text-white">
            ← Retour
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">🏊</div>
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Les Résidences H₂O</p>
            <h1 className="text-lg font-bold leading-tight">
              {view === 'home'       ? duplex.nom
              : view === 'restaurant' ? 'Restaurant & Bar'
              : view === 'boutique'   ? 'Boutique'
              : view === 'suivi'      ? 'Suivi de commande'
              : 'Assistance'}
            </h1>
          </div>
        </div>
        {view === 'home' && (
          <p className="mt-3 text-white/70 text-sm">
            Bonjour ! Comment pouvons-nous vous aider ?
          </p>
        )}
      </div>

      {/* ── Vue Accueil ─────────────────────────────────── */}
      {view === 'home' && (
        <div className="px-4 pt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setView('restaurant')}
              className="bg-white rounded-2xl p-5 text-left shadow-sm active:scale-95 transition-transform">
              <span className="text-3xl block mb-2">🍽️</span>
              <p className="font-bold text-gray-900 text-base leading-tight">Restaurant</p>
              <p className="font-bold text-gray-900 text-base leading-tight">& Bar</p>
              <p className="text-xs text-gray-400 mt-1">Plats, vins, boissons</p>
            </button>
            <button onClick={() => setView('boutique')}
              className="bg-white rounded-2xl p-5 text-left shadow-sm active:scale-95 transition-transform">
              <span className="text-3xl block mb-2">🛍️</span>
              <p className="font-bold text-gray-900 text-base leading-tight">Boutique</p>
              <p className="text-xs text-gray-400 mt-1">Souvenirs & articles</p>
            </button>
          </div>
          <button onClick={() => setView('assistance')}
            className="w-full bg-white rounded-2xl p-5 text-left shadow-sm active:scale-95 transition-transform flex items-center gap-4">
            <span className="text-3xl">🔔</span>
            <div>
              <p className="font-bold text-gray-900">Demander de l'assistance</p>
              <p className="text-xs text-gray-400 mt-0.5">Besoin d'aide ? Notre équipe vous répond</p>
            </div>
          </button>

          <div className="pt-2 pb-4 text-center">
            <p className="text-xs text-gray-400">
              {duplex.code} · Résidences H₂O, Modeste Beach
            </p>
          </div>
        </div>
      )}

      {/* ── Vue Restaurant ──────────────────────────────── */}
      {view === 'restaurant' && (
        <div className="px-4 pt-5">
          {menu.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="font-semibold text-gray-700 mb-1">Menu momentanément indisponible</p>
              <p className="text-sm text-gray-400">Contactez la réception pour commander.</p>
            </div>
          ) : (
            <>
              {/* Filtres catégorie */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                <button onClick={() => setCatFilter('tous')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${catFilter === 'tous' ? 'text-white' : 'bg-white text-gray-600'}`}
                  style={catFilter === 'tous' ? { backgroundColor: '#E8513A' } : {}}>
                  Tout
                </button>
                {catsPresentes.map(cat => (
                  <button key={cat.key} onClick={() => setCatFilter(cat.key)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${catFilter === cat.key ? 'text-white' : 'bg-white text-gray-600'}`}
                    style={catFilter === cat.key ? { backgroundColor: '#E8513A' } : {}}>
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              {/* Items groupés par section */}
              <div className="space-y-6">
                {SECTIONS_GUEST.map(section => {
                  const sectionItems = menuFiltered.filter(m => section.cats.includes(m.categorie))
                  if (sectionItems.length === 0) return null
                  return (
                    <div key={section.key}>
                      {/* En-tête de section — masqué si catFilter est spécifique */}
                      {catFilter === 'tous' && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">{section.emoji}</span>
                          <p className="font-bold text-gray-700 text-sm uppercase tracking-wide">{section.label}</p>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      )}
                      <div className="space-y-3">
                        {sectionItems.map(item => {
                          const qte = qteOf(item.id)
                          return (
                            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-sm">{CAT_EMOJI[item.categorie]}</span>
                                  <span className="text-xs text-gray-400">{CAT_LABEL[item.categorie]}</span>
                                </div>
                                <p className="font-semibold text-gray-900 truncate">{item.nom}</p>
                                {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                                <p className="font-bold mt-1" style={{ color: '#E8513A' }}>{fcfa(item.prix)}</p>
                              </div>
                              <div className="flex-shrink-0">
                                {qte === 0 ? (
                                  <button onClick={() => addToCart(item)}
                                    className="w-9 h-9 rounded-full text-white text-xl flex items-center justify-center font-bold active:scale-90 transition-transform"
                                    style={{ backgroundColor: '#E8513A' }}>+</button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => removeFromCart(item.id)}
                                      className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-lg flex items-center justify-center font-bold">−</button>
                                    <span className="w-5 text-center font-bold text-gray-900">{qte}</span>
                                    <button onClick={() => addToCart(item)}
                                      className="w-8 h-8 rounded-full text-white text-lg flex items-center justify-center font-bold"
                                      style={{ backgroundColor: '#E8513A' }}>+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Vue Boutique ────────────────────────────────── */}
      {view === 'boutique' && (
        <div className="px-4 pt-5">
          {articles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🛍️</p>
              <p className="font-semibold text-gray-700 mb-1">Boutique momentanément indisponible</p>
              <p className="text-sm text-gray-400">Contactez la réception pour plus d'informations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map(item => {
                const qte = qteOf(item.id)
                return (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {item.categorie && <p className="text-xs text-gray-400 mb-0.5">{item.categorie}</p>}
                      <p className="font-semibold text-gray-900 truncate">{item.nom}</p>
                      {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                      <p className="font-bold mt-1" style={{ color: '#E8513A' }}>{fcfa(item.prix)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {qte === 0 ? (
                        <button onClick={() => addToCart(item)}
                          className="w-9 h-9 rounded-full text-white text-xl flex items-center justify-center font-bold active:scale-90 transition-transform"
                          style={{ backgroundColor: '#E8513A' }}>+</button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-lg flex items-center justify-center font-bold">−</button>
                          <span className="w-5 text-center font-bold text-gray-900">{qte}</span>
                          <button onClick={() => addToCart(item)}
                            className="w-8 h-8 rounded-full text-white text-lg flex items-center justify-center font-bold"
                            style={{ backgroundColor: '#E8513A' }}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Vue Assistance ──────────────────────────────── */}
      {view === 'assistance' && (
        <div className="px-4 pt-5">
          {assistSent ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Message envoyé !</h2>
              <p className="text-gray-500 text-sm mb-6">Notre équipe prend en charge votre demande et sera là très rapidement.</p>
              <button onClick={goBack}
                className="w-full py-3 rounded-2xl text-white font-semibold"
                style={{ backgroundColor: '#E8513A' }}>Retour à l'accueil</button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Comment pouvons-nous vous aider ?</h2>
              <p className="text-sm text-gray-400 mb-5">Notre équipe sera là dans les plus brefs délais.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Votre message *
                  </label>
                  <textarea value={assistMsg} onChange={e => setAssistMsg(e.target.value)} rows={4}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    placeholder="Ex : J'ai besoin d'une serviette supplémentaire, la climatisation ne fonctionne pas…" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Votre prénom (optionnel)
                  </label>
                  <input value={assistNom} onChange={e => setAssistNom(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Kofi, Marie…" />
                </div>
                <button onClick={sendAssistance} disabled={assistSending || !assistMsg.trim()}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#1A0A04,#E8513A)' }}>
                  {assistSending ? 'Envoi en cours…' : 'Envoyer ma demande'}
                </button>
              </div>

              {/* Raccourcis assistance rapide */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Demandes fréquentes</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['🛁', 'Serviettes supplémentaires'],
                    ['❄️', 'Problème de climatisation'],
                    ['🔑', 'Problème avec la clé'],
                    ['🍽️', 'Service en chambre'],
                  ].map(([icon, label]) => (
                    <button key={label} onClick={() => setAssistMsg(label)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-left text-xs text-gray-700 hover:bg-gray-100 active:scale-95 transition-all">
                      <span>{icon}</span><span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Vue Suivi commande ──────────────────────────── */}
      {view === 'suivi' && lastOrderId && (
        <SuiviCommande
          orderId={lastOrderId}
          orderType={lastOrderType}
          onRetour={goBack}
        />
      )}

      {/* Barre panier */}
      {(view === 'restaurant' || view === 'boutique') && (
        <CartBar cart={cart} onOpen={() => setCartOpen(true)} />
      )}

      {/* Modal commande */}
      {cartOpen && (
        <OrderModal
          cart={cart}
          onClose={(result) => {
            setCartOpen(false)
            if (result?.id) {
              setLastOrderId(result.id)
              setLastOrderType(result.type)
              setView('suivi')
            }
          }}
          onConfirm={confirmOrder}
        />
      )}
    </div>
  )
}
