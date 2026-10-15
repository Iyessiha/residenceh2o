'use client'
import { useState, useEffect } from 'react'

const DUPLEXES_TARIFS = {
  '':    { label: '— Choisir un duplex —', prix: 0 },
  'D-1': { label: 'Duplex Lac (D-1)',      prix: 120000 },
  'D-2': { label: 'Duplex Jardin (D-2)',   prix: 150000 },
  'D-3': { label: 'Duplex Premium (D-3)',  prix: 220000 },
}

const FRAIS_SERVICE_RATE = 0.08 // 8 %

function formatFCFA(n) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function diffNuits(a, b) {
  if (!a || !b) return 0
  const diff = (new Date(b) - new Date(a)) / 86400000
  return diff > 0 ? diff : 0
}

export default function BookingWidget() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen]       = useState(false)  // mobile sheet
  const [duplex, setDuplex]   = useState('')
  const [arrivee, setArrivee] = useState('')
  const [depart, setDepart]   = useState('')
  const [voyageurs, setVoyageurs] = useState(2)

  // Afficher le widget après avoir scrollé de 80vh
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.75)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const tarif  = DUPLEXES_TARIFS[duplex]?.prix || 120000
  const nuits  = diffNuits(arrivee, depart)
  const base   = tarif * nuits
  const frais  = Math.round(base * FRAIS_SERVICE_RATE)
  const total  = base + frais

  const labelPrix = duplex ? DUPLEXES_TARIFS[duplex].label : 'À partir de'
  const prixAff   = duplex ? formatFCFA(tarif) : formatFCFA(120000)

  function goReserver() {
    // Scroll vers le formulaire contact avec les données pré-remplies
    const el = document.getElementById('contact')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setOpen(false)
  }

  const WidgetContent = () => (
    <div className="flex flex-col gap-4">
      {/* Prix */}
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {prixAff}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-3)' }}> / nuit</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-sm" style={{ color: 'var(--text-3)' }}>
          <span style={{ color: 'var(--gold)' }}>★★★★★</span>
          <span className="font-medium" style={{ color: 'var(--text)' }}>5,0</span>
          <span>· Coup de cœur voyageurs</span>
        </div>
      </div>

      {/* Sélecteur duplex */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>
          Duplex
        </label>
        <select
          value={duplex}
          onChange={e => setDuplex(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
        >
          {Object.entries(DUPLEXES_TARIFS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>
            Arrivée
          </label>
          <input
            type="date" value={arrivee}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => { setArrivee(e.target.value); if (depart && e.target.value >= depart) setDepart('') }}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none border"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>
            Départ
          </label>
          <input
            type="date" value={depart}
            min={arrivee || new Date().toISOString().split('T')[0]}
            onChange={e => setDepart(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none border"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* Voyageurs */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>
          Voyageurs
        </label>
        <div className="flex items-center gap-3 border rounded-lg px-3 py-2.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
          <button
            onClick={() => setVoyageurs(v => Math.max(1, v - 1))}
            className="w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold transition-colors hover:opacity-70 min-w-[44px] min-h-[44px]"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="Moins de voyageurs"
          >−</button>
          <span className="flex-1 text-center text-sm font-medium" style={{ color: 'var(--text)' }}>
            {voyageurs} voyageur{voyageurs > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setVoyageurs(v => Math.min(8, v + 1))}
            className="w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold transition-colors hover:opacity-70 min-w-[44px] min-h-[44px]"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="Plus de voyageurs"
          >+</button>
        </div>
      </div>

      {/* Bouton réserver */}
      <button
        onClick={goReserver}
        className="w-full text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 min-h-[44px]"
        style={{ background: 'linear-gradient(135deg, #1A0A04 0%, #3A1408 50%, #E8513A 100%)' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Réserver
      </button>
      <p className="text-center text-xs" style={{ color: 'var(--text-3)' }}>Aucun débit maintenant</p>

      {/* Détail du calcul — visible si dates sélectionnées */}
      {nuits > 0 && (
        <div className="border-t pt-4 space-y-2 text-sm" style={{ borderColor: 'var(--border-2)' }}>
          <div className="flex justify-between" style={{ color: 'var(--text-2)' }}>
            <span>{formatFCFA(tarif)} × {nuits} nuit{nuits > 1 ? 's' : ''}</span>
            <span>{formatFCFA(base)}</span>
          </div>
          <div className="flex justify-between" style={{ color: 'var(--text-2)' }}>
            <span>Frais de service (8 %)</span>
            <span>{formatFCFA(frais)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2" style={{ borderColor: 'var(--border-2)', color: 'var(--text)' }}>
            <span>Total</span>
            <span>{formatFCFA(total)}</span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ── Desktop : widget fixe à droite ─────────────────────── */}
      <aside
        className={`hidden lg:block fixed top-24 right-8 w-80 rounded-2xl shadow-2xl p-6 z-40 transition-all duration-500 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-2)' }}
        aria-label="Widget de réservation"
      >
        <WidgetContent />
      </aside>

      {/* ── Mobile : bouton flottant + sheet ───────────────────── */}
      <div className={`lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <button
          onClick={() => setOpen(true)}
          className="text-white font-semibold px-8 py-3.5 rounded-full shadow-xl min-h-[44px] whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #1A0A04 0%, #3A1408 50%, #E8513A 100%)' }}
        >
          Réserver — dès {formatFCFA(120000)} / nuit
        </button>
      </div>

      {/* Sheet mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div
            className="relative rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Réserver un duplex</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-2xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                style={{ color: 'var(--text-3)' }}
                aria-label="Fermer"
              >×</button>
            </div>
            <WidgetContent />
          </div>
        </div>
      )}
    </>
  )
}
