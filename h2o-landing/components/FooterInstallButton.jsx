'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'h2o_pwa_dismissed'

export default function FooterInstallButton() {
  const [show,    setShow]    = useState(false)
  const [isIOS,   setIsIOS]   = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [prompt,  setPrompt]  = useState(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    setShow(true)
    const handler = (e) => {
      e.preventDefault()
      window.__h2oInstallPrompt = e
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setShow(false))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (isIOS) { setShowTip(p => !p); return }
    const p = prompt || window.__h2oInstallPrompt
    if (!p) { setShowTip(p => !p); return }
    p.prompt()
    const { outcome } = await p.userChoice
    if (outcome === 'accepted') setShow(false)
    window.__h2oInstallPrompt = null
    setPrompt(null)
  }

  if (!show) return null

  return (
    <div className="relative">
      <button
        onClick={install}
        className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs"
      >
        <span>📲</span>
        <span>Installer l'app</span>
      </button>
      {showTip && (
        <div className="absolute bottom-8 right-0 bg-white text-gray-900 rounded-xl shadow-2xl p-4 w-56 text-xs z-50">
          <p className="font-semibold mb-2">📲 Installer l'application</p>
          <p className="text-gray-600 leading-relaxed">
            <span className="font-medium">iPhone :</span> Partager 📤 → Sur l'écran d'accueil
          </p>
          <p className="text-gray-600 leading-relaxed mt-1.5">
            <span className="font-medium">Android :</span> Menu ⋮ → Ajouter à l'écran d'accueil
          </p>
          <button onClick={() => setShowTip(false)} className="mt-2 text-gray-400 hover:text-gray-600 transition-colors">
            Fermer
          </button>
        </div>
      )}
    </div>
  )
}
