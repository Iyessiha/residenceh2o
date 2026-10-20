'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', icon: '📊', label: 'Tableau de bord' },

  { section: 'Hébergement' },
  { href: '/dashboard/reservations', icon: '📅', label: 'Réservations' },
  { href: '/dashboard/duplexes',     icon: '🏠', label: 'Duplexes' },
  { href: '/dashboard/chambres',     icon: '🛏️', label: 'Chambres' },
  { href: '/dashboard/clients',      icon: '👥', label: 'Clients' },

  { section: 'Services' },
  { href: '/dashboard/restaurant',   icon: '🍽️', label: 'Restaurant & Bar', badge: 'restaurant' },
  { href: '/dashboard/boutique',     icon: '🛍️', label: 'Boutique',          badge: 'boutique' },
  { href: '/dashboard/assistance',   icon: '🔔', label: 'Assistance',        badge: 'assistance' },

  { section: 'Événements' },
  { href: '/dashboard/evenements',   icon: '🎪', label: 'Événements' },

  { section: 'Finance' },
  { href: '/dashboard/facturation',  icon: '🧾', label: 'Facturation' },
  { href: '/dashboard/rapports',     icon: '📈', label: 'Rapports' },

  { section: 'Gestion' },
  { href: '/dashboard/photos',       icon: '🖼️', label: 'Photos' },
  { href: '/dashboard/equipe',       icon: '👨‍👩‍👧', label: 'Équipe' },
  { href: '/dashboard/parametres',   icon: '⚙️', label: 'Paramètres' },
]

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const times = [0, 0.18, 0.36]
    times.forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0, ctx.currentTime + t)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.15)
    })
  } catch {}
}

function sendBrowserNotification(title, body) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.svg' })
  }
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [counts, setCounts] = useState({ restaurant: 0, assistance: 0, boutique: 0 })
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSTip, setShowIOSTip] = useState(false)
  const isFirstLoad = useRef(true)
  const supabase = createClient()

  // Capturer l'événement d'installation PWA
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstallPrompt(null); setInstalled(true) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (isIOS) { setShowIOSTip(p => !p); return }
    if (!installPrompt) { setShowIOSTip(p => !p); return }
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  const loadCounts = useCallback(async () => {
    try {
      const [r, a, b] = await Promise.all([
        supabase.from('commandes_restaurant').select('*', { count: 'exact', head: true }).eq('statut', 'en_cours'),
        supabase.from('demandes_assistance').select('*', { count: 'exact', head: true }).eq('statut', 'nouveau'),
        supabase.from('ventes').select('*', { count: 'exact', head: true }).eq('statut', 'en_attente'),
      ])
      setCounts({
        restaurant: r.count || 0,
        assistance: a.count || 0,
        boutique: b.count || 0,
      })
    } catch {}
  }, [supabase])

  const handleNewEvent = useCallback((table) => {
    if (isFirstLoad.current) return
    playNotificationSound()
    const labels = {
      commandes_restaurant: 'Nouvelle commande restaurant',
      demandes_assistance:  'Nouvelle demande d\'assistance',
      ventes:               'Nouvelle vente boutique',
    }
    sendBrowserNotification('H2O Manager', labels[table] || 'Nouvel événement')
    loadCounts()
  }, [loadCounts])

  useEffect(() => {
    loadCounts().then(() => { isFirstLoad.current = false })

    // Request notification permission once
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const channel = supabase
      .channel('shell_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'commandes_restaurant' },
        () => handleNewEvent('commandes_restaurant'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'demandes_assistance' },
        () => handleNewEvent('demandes_assistance'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ventes' },
        () => handleNewEvent('ventes'))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const Sidebar = () => (
    <aside className="w-56 bg-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏊</span>
          <div>
            <p className="text-white text-sm font-bold leading-tight tracking-wide">H2O Manager</p>
            <p className="text-white/40 text-xs">Résidences H2O</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {NAV.map((item, i) => {
          if (item.section) {
            return (
              <p key={`s-${i}`}
                className="px-3 pt-4 pb-1 text-xs font-bold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                {item.section}
              </p>
            )
          }
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const badgeCount = item.badge ? counts[item.badge] : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                active
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: '#E8513A', color: '#fff' }}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-white/10 space-y-1">
        {!installed && (
          <div>
            <button
              onClick={handleInstall}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span>📲</span>
              <span>Installer l'app</span>
            </button>
            {showIOSTip && (
              <div className="mx-1 mb-1 bg-white/5 rounded-lg px-3 py-2 text-xs text-white/50 leading-relaxed">
                <span className="text-white/70 font-medium">iPhone :</span> Partager 📤 → Sur l'écran d'accueil<br/>
                <span className="text-white/70 font-medium">Android :</span> Menu ⋮ → Ajouter à l'écran
                <button onClick={() => setShowIOSTip(false)} className="block mt-1 text-white/30 hover:text-white/60 transition-colors">ok</button>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <span>🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex flex-col w-56">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="border-b px-4 sm:px-6 h-14 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border-2)' }}>
          <button
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {(installPrompt || isIOS) && !installed && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 animate-pulse"
                style={{ backgroundColor: 'var(--primary)' }}
                title="Installer H2O Manager sur cet appareil"
              >
                <span>📲</span>
                <span className="hidden sm:inline">Installer l'app</span>
              </button>
            )}
            <span>📍 Résidences H2O</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ backgroundColor: 'var(--bg-2)', color: 'var(--text)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
