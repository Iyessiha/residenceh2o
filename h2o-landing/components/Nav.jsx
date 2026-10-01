'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-teal-950/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-serif text-white text-xl font-bold tracking-wide">
          Les Résidences H2O
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm text-white/80">
          <Link href="#sejours" className="hover:text-white transition-colors">Séjours</Link>
          <Link href="#evenements" className="hover:text-white transition-colors">Événements</Link>
          <Link href="#galerie" className="hover:text-white transition-colors">Galerie</Link>
          <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
          <Link
            href="#contact"
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
          >
            Réserver
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <div className={`w-6 h-0.5 bg-white mb-1.5 transition-all ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <div className={`w-6 h-0.5 bg-white mb-1.5 transition-all ${open ? 'opacity-0' : ''}`} />
          <div className={`w-6 h-0.5 bg-white transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-teal-950 border-t border-white/10 px-4 py-4 flex flex-col gap-4 text-white">
          <Link href="#sejours" onClick={() => setOpen(false)}>Séjours</Link>
          <Link href="#evenements" onClick={() => setOpen(false)}>Événements</Link>
          <Link href="#galerie" onClick={() => setOpen(false)}>Galerie</Link>
          <Link href="#contact" onClick={() => setOpen(false)}>Contact</Link>
          <Link
            href="#contact"
            onClick={() => setOpen(false)}
            className="bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold text-center"
          >
            Réserver
          </Link>
        </div>
      )}
    </nav>
  )
}
