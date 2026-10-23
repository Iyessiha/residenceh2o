'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Calendar, Menu, X, Home, Zap, Package, Image as ImageIcon, Info, HelpCircle, UtensilsCrossed } from 'lucide-react'

const NAV_LINKS = [
  { href: '/residences', label: 'Villas', icon: Home },
  { href: '/chambres', label: 'Chambres', icon: Package },
  { href: '/restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { href: '/services', label: 'Services', icon: Zap },
  { href: '/gallery', label: 'Galerie', icon: ImageIcon },
  { href: '/about', label: 'À Propos', icon: Info },
  { href: '/faq', label: 'FAQ', icon: HelpCircle },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0C3A3D]/97 backdrop-blur-xl shadow-2xl border-b border-white/5 py-2 sm:py-3'
          : 'bg-gradient-to-b from-black/60 via-black/20 to-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <Image
              src="/icon.svg"
              alt="Les Résidences H2O"
              width={40}
              height={40}
              className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl group-hover:scale-110 transition-transform"
            />
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="font-serif text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-white">
                Résidences <span style={{ color: '#7FB8B5' }}>H₂O</span>
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/50 font-medium">
                Villa Poton
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA & Direct contact - Right */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* WhatsApp Button - Hidden on small mobile */}
            <a
              href="https://wa.me/2250705259234?text=Bonjour%2C%20je%20souhaite%20des%20informations"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-white/70 hover:text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all"
              title="WhatsApp"
            >
              <Phone className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/70" />
              <span className="hidden md:inline">Conciergerie</span>
            </a>

            {/* Book Button */}
            <Link
              href="/#contact"
              className="flex items-center gap-1.5 sm:gap-2 text-white font-semibold text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg shadow-lg transition-all hover:opacity-90 hover:-translate-y-0.5 min-h-[40px] sm:min-h-[44px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1C6E70 0%, #0C3A3D 100%)' }}
            >
              <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="hidden sm:inline">Réserver</span>
            </Link>

            {/* Mobile menu button */}
            <button
              className="lg:hidden text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors focus:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden mt-2 mx-4 rounded-xl bg-[#0C3A3D]/98 backdrop-blur-xl border border-white/10 p-4 space-y-1 animate-fadeIn shadow-2xl">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium text-sm transition-all"
            >
              <Icon className="w-4 h-4" style={{ color: 'var(--h2o-lagune-clair)' }} />
              {label}
            </Link>
          ))}

          <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className="w-full text-center py-3 rounded-lg font-semibold text-white text-sm transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1C6E70 0%, #0C3A3D 100%)' }}
            >
              Réserver maintenant
            </Link>
            <a
              href="https://wa.me/2250705259234?text=Bonjour"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-3 rounded-lg bg-white/10 border border-white/15 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/15 hover:border-white/30 transition-all"
            >
              <Phone className="w-4 h-4 text-white/70" />
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
