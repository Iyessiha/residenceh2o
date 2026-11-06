'use client'
import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { renderToStaticMarkup } from 'react-dom/server'

const DEFAUT = [...Array.from({ length: 10 }, (_, i) => `Table ${i + 1}`), 'Bar', 'Terrasse', 'Piscine'].join('\n')
const CLE = 'h2o_qr_commande_emplacements'

function lienCommande(origin, emplacement) {
  return emplacement ? `${origin}/commander?table=${encodeURIComponent(emplacement)}` : `${origin}/commander`
}

export default function QRCommande() {
  const [origin, setOrigin] = useState('')
  const [texte, setTexte] = useState(DEFAUT)
  const canvasRef = useRef(null)

  useEffect(() => {
    setOrigin(window.location.origin)
    try { const t = localStorage.getItem(CLE); if (t) setTexte(t) } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem(CLE, texte) } catch {} }, [texte])

  const emplacements = texte.split('\n').map(t => t.trim()).filter(Boolean).slice(0, 100)
  const lienGeneral = lienCommande(origin, '')

  function telechargerPNG() {
    const a = document.createElement('a')
    a.href = canvasRef.current.toDataURL('image/png')
    a.download = 'qr-commande-restaurant-bar.png'
    document.body.appendChild(a); a.click(); a.remove()
  }

  // Ouvre une page prête à imprimer : une carte par QR code
  function imprimer(liste) {
    const cartes = liste.map(({ titre, sous, url }) => `
      <div class="carte">
        <p class="marque">Les Résidences H₂O</p>
        <h2>${titre.replace(/</g, '&lt;')}</h2>
        <div class="qr">${renderToStaticMarkup(<QRCodeSVG value={url} size={220} level="M" includeMargin />)}</div>
        <p class="invite">Scannez pour commander</p>
        <p class="sous">${sous}</p>
      </div>`).join('')
    const w = window.open('', '_blank')
    if (!w) { window.alert("Autorisez les fenêtres pop-up pour imprimer."); return }
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>QR codes — commande</title>
      <style>
        @page { size: A4; margin: 10mm }
        body { font-family: system-ui, sans-serif; margin: 0; color: #1F2A2B }
        .grille { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm }
        .carte { border: 2px solid #0C3A3D; border-radius: 12px; padding: 12px; text-align: center; break-inside: avoid }
        .marque { margin: 0; font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase; color: #0C3A3D; font-weight: 700 }
        h2 { margin: 6px 0; font-size: 24px }
        .qr svg { width: 200px; height: 200px }
        .invite { margin: 4px 0 0; font-weight: 700; font-size: 16px }
        .sous { margin: 2px 0 0; font-size: 12px; color: #6B7678 }
      </style></head><body><div class="grille">${cartes}</div>
      <script>window.onload = function () { window.print() }<\/script></body></html>`)
    w.document.close()
  }

  const cartesTables = emplacements.map(e => ({ titre: e, sous: 'Restaurant & Bar', url: lienCommande(origin, e) }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>QR codes de commande</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
        Le client scanne, choisit ses plats et boissons, et la commande arrive directement dans Restaurant & Bar (avec l'alerte sonore et la facture).
      </p>

      {/* QR général */}
      <div className="card p-5 mb-6 flex flex-wrap items-center gap-6">
        <div className="bg-white p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          {origin ? <QRCodeSVG value={lienGeneral} size={180} level="M" /> : <div style={{ width: 180, height: 180 }} />}
        </div>
        <div className="flex-1 min-w-[240px]">
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>QR général — Restaurant & Bar</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Pour l'entrée, la carte, les flyers. Le client indique lui-même sa table.</p>
          <p className="text-xs mt-2 break-all font-mono" style={{ color: 'var(--text-2)' }}>{lienGeneral}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn-primary" onClick={() => imprimer([{ titre: 'Restaurant & Bar', sous: 'Commandez depuis votre téléphone', url: lienGeneral }])}>Imprimer</button>
            <button className="btn-secondary" onClick={telechargerPNG}>Télécharger (PNG)</button>
            <a className="btn-secondary" href={lienGeneral} target="_blank" rel="noreferrer">Tester la page</a>
          </div>
        </div>
        <QRCodeCanvas ref={canvasRef} value={lienGeneral} size={1024} level="M" includeMargin style={{ display: 'none' }} />
      </div>

      {/* QR par table */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>QR par table / emplacement</h2>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>La table est déjà remplie quand le client scanne. Un emplacement par ligne.</p>
          </div>
          <button className="btn-primary" onClick={() => imprimer(cartesTables)} disabled={emplacements.length === 0}>
            Imprimer les {emplacements.length} QR codes
          </button>
        </div>
        <textarea className="input font-mono text-sm" rows={6} value={texte} onChange={e => setTexte(e.target.value)} aria-label="Liste des tables et emplacements" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {origin && cartesTables.map(c => (
            <div key={c.titre} className="rounded-xl border p-3 text-center bg-white" style={{ borderColor: 'var(--border)' }}>
              <QRCodeSVG value={c.url} size={110} level="M" style={{ margin: '0 auto' }} />
              <p className="text-sm font-semibold mt-2" style={{ color: '#1F2A2B' }}>{c.titre}</p>
              <button className="text-xs mt-1 hover:underline" style={{ color: 'var(--primary)' }} onClick={() => imprimer([c])}>Imprimer</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
