'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { afficherNotification, demanderPermissionNotifications } from '@/lib/notifications'
import { activerSon, sonPret, jouerSon, lireSonsActifs, ecrireSonsActifs } from '@/lib/alertes'
import { formatFCFA } from '@/lib/utils'
import { estGestion } from '@/lib/useRole'

const NAV = [
  { href: '/dashboard', icon: '📊', label: 'Tableau de bord' },

  { section: 'Hébergement' },
  { href: '/dashboard/reservations', icon: '📅', label: 'Réservations' },
  { href: '/dashboard/calendrier',  icon: '🗓️', label: 'Calendrier' },
  { href: '/dashboard/duplexes',     icon: '🏠', label: 'Villas' },
  { href: '/dashboard/chambres',     icon: '🛏️', label: 'Chambres' },

  { section: 'Clients & partenaires' },
  { href: '/dashboard/clients',      icon: '👥', label: 'Clients' },
  { href: '/dashboard/entreprises',  icon: '🏢', label: 'Entreprises' },
  { href: '/dashboard/demarcheurs',  icon: '🤝', label: 'Démarcheurs' },

  { section: 'Restaurant & ventes' },
  { href: '/dashboard/restaurant',   icon: '🍽️', label: 'Restaurant & Bar', badge: 'restaurant' },
  { href: '/dashboard/qr-commande',  icon: '📱', label: 'QR de commande' },
  { href: '/dashboard/boutique',     icon: '🛍️', label: 'Boutique',          badge: 'boutique' },

  { section: 'Événements & accueil' },
  { href: '/dashboard/evenements',   icon: '🎪', label: 'Événements' },
  { href: '/dashboard/assistance',   icon: '🔔', label: 'Assistance',        badge: 'assistance' },

  { section: 'Finance' },
  { href: '/dashboard/facturation',  icon: '🧾', label: 'Facturation' },
  { href: '/dashboard/tresorerie',   icon: '💼', label: 'Trésorerie',     gestion: true },
  { href: '/dashboard/rapports',     icon: '📈', label: 'Rapports' },

  { section: 'Ressources humaines', gestion: true },
  { href: '/dashboard/personnel',    icon: '🧑‍💼', label: 'Personnel',      gestion: true },
  { href: '/dashboard/paie',         icon: '💵', label: 'Fiches de paie', gestion: true },

  { section: 'Administration' },
  { href: '/dashboard/equipe',       icon: '👨‍👩‍👧', label: 'Équipe & accès' },
  { href: '/dashboard/photos',       icon: '🖼️', label: 'Photos' },
  { href: '/dashboard/parametres',   icon: '⚙️', label: 'Paramètres' },
]

const ALERTE_DUREE_MS = 8000
// Sonnerie répétée toutes les 3,5 s tant qu'une alerte n'est pas prise en charge
const DELAI_SONNERIE_MS = 3500
// Au-delà de 2 h, une alerte restée sans prise en charge reste dans la liste mais ne sonne plus
const FENETRE_SONNERIE_MS = 2 * 60 * 60 * 1000
const LISTE_MAX = 60

const PAGE_PAR_SOURCE = {
  reservations: '/dashboard/reservations',
  commandes_restaurant: '/dashboard/restaurant',
  ventes: '/dashboard/boutique',
}

const heure = (iso) => (iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '')
const sonPourType = (type) => (type === 'reservation' ? 'reservation' : 'commande')

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [counts, setCounts] = useState({ restaurant: 0, assistance: 0, boutique: 0 })
  const [alertes, setAlertes] = useState([])
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSTip, setShowIOSTip] = useState(false)
  const [sons, setSons] = useState(true)
  const [sonOk, setSonOk] = useState(false)
  const [userId, setUserId] = useState(null)
  const [role, setRole] = useState(null)
  const [notifs, setNotifs] = useState([])
  const [panelOuvert, setPanelOuvert] = useState(false)
  const supabase = createClient()

  // Refs lues par les minuteries et le temps réel (évite les fermetures périmées)
  const notifsRef = useRef([])
  const sonsRef = useRef(true)
  const sonOkRef = useRef(false)

  useEffect(() => { notifsRef.current = notifs }, [notifs])
  useEffect(() => { sonsRef.current = sons }, [sons])
  useEffect(() => { sonOkRef.current = sonOk }, [sonOk])

  useEffect(() => {
    setSons(lireSonsActifs())
    setSonOk(sonPret())
  }, [])

  const retirerAlerte = useCallback((id) => {
    setAlertes(liste => liste.filter(a => a.id !== id))
  }, [])

  const ajouterAlerte = useCallback((alerte) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setAlertes(liste => [...liste.slice(-2), { ...alerte, id }])
    setTimeout(() => retirerAlerte(id), ALERTE_DUREE_MS)
  }, [retirerAlerte])

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

  function basculerSons() {
    const nouveau = !sons
    setSons(nouveau)
    ecrireSonsActifs(nouveau)
  }

  // Le bouton doit déclencher la permission de notification pendant le geste utilisateur
  async function activerAlertesSonores() {
    demanderPermissionNotifications()
    const ok = await activerSon()
    setSonOk(ok)
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

  const chargerNotifs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(LISTE_MAX)
      setNotifs(data || [])
    } catch {}
  }, [supabase])

  // Initialisation : utilisateur, notifications existantes, compteurs, temps réel
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUserId(data?.user?.id || null)
      if (!data?.user) return
      const { data: profil } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
      setRole(profil?.role || null)
    })
    chargerNotifs()
    loadCounts()

    const channel = supabase
      .channel('notifications_manager')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const n = payload.new
          setNotifs(liste => (liste.some(x => x.id === n.id) ? liste : [n, ...liste].slice(0, LISTE_MAX)))
          if (sonsRef.current && sonOkRef.current) jouerSon(sonPourType(n.type))
          const corps = [n.client_nom, n.service, n.montant ? formatFCFA(n.montant) : null, n.demarcheur_nom ? `démarcheur : ${n.demarcheur_nom}` : null]
            .filter(Boolean).join(' · ')
          const href = PAGE_PAR_SOURCE[n.source_table] || '/dashboard'
          ajouterAlerte({ titre: n.titre, corps, href })
          afficherNotification(n.titre || 'H2O Manager', { corps, url: href, tag: n.id })
          loadCounts()
        } else if (payload.eventType === 'UPDATE') {
          const n = payload.new
          setNotifs(liste => liste.map(x => (x.id === n.id ? { ...x, ...n } : x)))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sonnerie répétée tant qu'une alerte récente n'est pas prise en charge
  useEffect(() => {
    const timer = setInterval(() => {
      if (!sonsRef.current || !sonOkRef.current) return
      const maintenant = Date.now()
      const urgente = notifsRef.current.find(n =>
        !n.pris_en_charge_par && maintenant - new Date(n.created_at).getTime() < FENETRE_SONNERIE_MS
      )
      if (urgente) jouerSon(sonPourType(urgente.type))
    }, DELAI_SONNERIE_MS)
    return () => clearInterval(timer)
  }, [])

  // Ouvrir le panneau : les alertes affichées passent en « lues » (pastille remise à zéro)
  useEffect(() => {
    if (!panelOuvert || !userId) return
    const ids = notifsRef.current.filter(n => !(n.lu_par || []).includes(userId)).map(n => n.id)
    if (ids.length === 0) return
    supabase.rpc('h2o_marquer_lues', { p_ids: ids }).then(({ error }) => {
      if (error) return
      setNotifs(liste => liste.map(n => (ids.includes(n.id) ? { ...n, lu_par: [...(n.lu_par || []), userId] } : n)))
    })
  }, [panelOuvert, userId, notifs.length]) // eslint-disable-line react-hooks/exhaustive-deps

  async function prendreEnCharge(n) {
    const { error } = await supabase.rpc('h2o_prendre_en_charge', { p_id: n.id })
    if (error) return
    await chargerNotifs()
  }

  const nonLues = userId ? notifs.filter(n => !(n.lu_par || []).includes(userId)).length : 0

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
        {NAV.filter(item => !item.gestion || estGestion(role)).map((item, i) => {
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

      {/* Sons */}
      <div className="px-2 pb-1">
        <button
          onClick={basculerSons}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-base">{sons ? '🔔' : '🔕'}</span>
          <span className="flex-1 text-left">{sons ? 'Sons activés' : 'Sons coupés'}</span>
        </button>
      </div>

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
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-1.5 text-gray-500 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {!sonOk && (
              <button
                onClick={activerAlertesSonores}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 animate-pulse"
                style={{ backgroundColor: 'var(--primary)' }}
                title="Les navigateurs bloquent le son tant que l'on n'a pas cliqué sur la page"
              >
                <span>🔊</span>
                <span className="hidden sm:inline">Activer les alertes sonores</span>
                <span className="sm:hidden">Son</span>
              </button>
            )}
            <button
              onClick={() => setPanelOuvert(o => !o)}
              className="relative p-1.5 rounded-lg hover:opacity-70 transition-opacity"
              aria-label={`Notifications${nonLues ? `, ${nonLues} non lue${nonLues > 1 ? 's' : ''}` : ''}`}
            >
              <span className="text-lg">🔔</span>
              {nonLues > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ backgroundColor: '#E8513A' }}>
                  {nonLues > 99 ? '99+' : nonLues}
                </span>
              )}
            </button>
            {(installPrompt || isIOS) && !installed && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--primary)' }}
                title="Installer H2O Manager sur cet appareil"
              >
                <span>📲</span>
                <span className="hidden sm:inline">Installer l'app</span>
              </button>
            )}
            <span className="hidden sm:inline">📍 Résidences H2O</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ backgroundColor: 'var(--bg-2)', color: 'var(--text)' }}>
          {children}
        </main>
      </div>

      {/* Panneau des notifications */}
      {panelOuvert && (
        <div className="fixed inset-0 z-[58]" onClick={() => setPanelOuvert(false)}>
          <div
            className="absolute top-14 right-3 left-3 sm:left-auto sm:w-96 max-h-[75vh] overflow-y-auto rounded-xl shadow-2xl border"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border-2)' }}>
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Notifications</p>
              <button onClick={() => setPanelOuvert(false)} className="text-xl leading-none" style={{ color: 'var(--text-3)' }} aria-label="Fermer">×</button>
            </div>
            {notifs.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>Aucune notification</p>
            ) : (
              <ul>
                {notifs.map(n => {
                  const lue = !userId || (n.lu_par || []).includes(userId)
                  const prise = !!n.pris_en_charge_par
                  return (
                    <li key={n.id} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-2)', backgroundColor: lue ? 'transparent' : 'rgba(232,81,58,0.07)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                          {!lue && <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#E8513A' }} />}
                          {n.titre}
                        </p>
                        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-3)' }}>{heure(n.created_at)}</span>
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{n.client_nom}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {n.service}{n.montant ? ` · ${formatFCFA(n.montant)}` : ''}
                      </p>
                      {n.demarcheur_nom && (
                        <p className="text-xs" style={{ color: 'var(--primary)' }}>Apporté par {n.demarcheur_nom}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {prise ? (
                          <span className="text-xs font-semibold text-green-700">
                            ✓ Pris en charge{n.pris_en_charge_par === userId ? ' par vous' : ''}{n.pris_en_charge_at ? ` à ${heure(n.pris_en_charge_at)}` : ''}
                          </span>
                        ) : (
                          <button onClick={() => prendreEnCharge(n)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#E8513A' }}>
                            Pris en charge
                          </button>
                        )}
                        <button
                          onClick={() => { setPanelOuvert(false); router.push(PAGE_PAR_SOURCE[n.source_table] || '/dashboard') }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-70"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                          Ouvrir
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Alertes temps réel : pile en haut à droite (pleine largeur sur mobile), cliquable */}
      <div className="fixed top-16 right-3 left-3 sm:left-auto sm:w-80 z-[60] flex flex-col gap-2 pointer-events-none">
        {alertes.map(a => (
          <div
            key={a.id}
            role="alert"
            className="pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-white"
            style={{ backgroundColor: 'var(--h2o-teal, #0C3A3D)', animation: 'h2o-alerte-in 0.25s ease-out' }}
          >
            <button
              onClick={() => { router.push(a.href); retirerAlerte(a.id) }}
              className="flex-1 text-left"
            >
              <p className="text-sm font-bold">🔔 {a.titre}</p>
              {a.corps && <p className="text-xs text-white/80 mt-0.5">{a.corps}</p>}
              <p className="text-xs text-white/60 mt-0.5">Appuyer pour ouvrir</p>
            </button>
            <button
              onClick={() => retirerAlerte(a.id)}
              className="text-white/60 hover:text-white text-lg leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes h2o-alerte-in { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  )
}
