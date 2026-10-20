'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'h2o_pwa_dismissed'

export default function InstallPWA() {
  const [prompt,  setPrompt]  = useState(null)
  const [isIOS,   setIsIOS]   = useState(false)
  const [visible, setVisible] = useState(false)
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    try { if (localStorage.getItem(STORAGE_KEY)) return } catch {}

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (ios) { setIsIOS(true); setVisible(true); return }

    const handler = (e) => {
      e.preventDefault()
      window.__h2oInstallPrompt = e
      setPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', dismiss)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', dismiss)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    setShowTip(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
  }

  async function install() {
    if (isIOS) { setShowTip(p => !p); return }
    const p = prompt || window.__h2oInstallPrompt
    if (!p) { setShowTip(p => !p); return }
    p.prompt()
    const { outcome } = await p.userChoice
    if (outcome === 'accepted') dismiss()
    window.__h2oInstallPrompt = null
    setPrompt(null)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {showTip && (
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64 text-sm">
          <p className="font-bold text-gray-900 mb-2">📲 Installer l'application</p>
          <p className="text-gray-600 text-xs leading-relaxed">
            <span className="font-semibold">iPhone / iPad :</span><br/>
            Appuyez sur <span className="font-semibold">Partager 📤</span> puis <span className="font-semibold">"Sur l'écran d'accueil"</span>
          </p>
          <p className="text-gray-600 text-xs leading-relaxed mt-2">
            <span className="font-semibold">Android :</span><br/>
            Menu <span className="font-semibold">⋮</span> → <span className="font-semibold">"Ajouter à l'écran d'accueil"</span>
          </p>
          <button onClick={() => { setShowTip(false); dismiss() }}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Compris — fermer
          </button>
        </div>
      )}
      <div className="pointer-events-auto flex items-center gap-2">
        <button onClick={dismiss}
          className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-sm font-bold text-gray-500 shadow-lg hover:bg-white transition-colors">
          ×
        </button>
        <button onClick={install}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl text-white font-semibold text-sm shadow-2xl active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg,#0C3A3D 0%,#1a7a82 100%)' }}>
          <span>📲</span>
          <span>Installer l'app</span>
        </button>
      </div>
    </div>
  )
}
