'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#1A0A04]/98 backdrop-blur-md shadow-lg border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-18">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <span className="text-white font-bold text-lg tracking-tight leading-tight">
            Les Résidences <span style={{ color: 'var(--primary)' }}>H₂O</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7 text-sm text-white/80 font-medium">
          <Link href="/rooms"     className="hover:text-white transition-colors">Chambres</Link>
          <Link href="/services"  className="hover:text-white transition-colors">Services</Link>
          <Link href="/about"     className="hover:text-white transition-colors">À Propos</Link>
          <Link href="/blog"      className="hover:text-white transition-colors">Blog</Link>
          <Link href="/faq"       className="hover:text-white transition-colors">FAQ</Link>
          <Link href="/gallery"   className="hover:text-white transition-colors">Galerie</Link>
          <Link
            href="/reservation"
            className="text-white font-semibold px-5 py-2 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-dk)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            Réserver
          </Link>
        </div>

        {/* Mobile toggle — cible tactile ≥ 44px */}
        <button
          className="md:hidden text-white p-2.5 min-w-[44px] min-h-[44px] flex flex-col justify-center items-center gap-1.5"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#1A0A04] border-t border-white/10 px-4 py-5 flex flex-col gap-4 text-white">
          <Link href="/rooms"    onClick={() => setOpen(false)} className="py-1 text-white/90 hover:text-white">Chambres</Link>
          <Link href="/services" onClick={() => setOpen(false)} className="py-1 text-white/90 hover:text-white">Services</Link>
          <Link href="/about"    onClick={() => setOpen(false)} className="py-1 text-white/90 hover:text-white">À Propos</Link>
          <Link href="/blog"     onClick={() => setOpen(false)} className="py-1 text-white/90 hover:text-white">Blog</Link>
          <Link href="/faq"      onClick={() => setOpen(false)} className="py-1 text-white/90 hover:text-white">FAQ</Link>
          <Link href="/gallery"  onClick={() => setOpen(false)} className="py-1 text-white/90 hover:text-white">Galerie</Link>
          <Link
            href="/reservation"
            onClick={() => setOpen(false)}
            className="text-white font-semibold px-5 py-3 rounded-lg text-center min-h-[44px] flex items-center justify-center"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Réserver maintenant
          </Link>
        </div>
      )}
    </nav>
  )
}
