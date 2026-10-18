'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Phone, Calendar, Menu, X, Waves } from 'lucide-react'

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
          ? 'bg-[#0B1721]/90 backdrop-blur-md shadow-xl border-b border-white/10 py-3'
          : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Résidences <span className="text-teal-400">H₂O</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-medium">
              Modeste Beach · Grand-Bassam
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/80">
          <Link href="#sejours" className="hover:text-teal-300 transition-colors">
            Les Duplexes
          </Link>
          <Link href="#evenements" className="hover:text-teal-300 transition-colors">
            Pergola & Événements
          </Link>
          <Link href="/services" className="hover:text-teal-300 transition-colors">
            Services & Pontoon
          </Link>
          <Link href="/gallery" className="hover:text-teal-300 transition-colors">
            Galerie
          </Link>
          <Link href="/about" className="hover:text-teal-300 transition-colors">
            Le Resort
          </Link>
          <Link href="/faq" className="hover:text-teal-300 transition-colors">
            FAQ
          </Link>
        </nav>

        {/* CTA & Direct contact */}
        <div className="hidden sm:flex items-center gap-4">
          <a
            href="https://wa.me/2250500446464?text=Bonjour%2C%20je%20souhaite%20des%20informations%20sur%20les%20R%C3%A9sidences%20H2O"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-semibold px-3 py-2 rounded-full border border-white/20 hover:border-teal-400/50 bg-white/5 backdrop-blur-sm transition-all"
            title="Assistance WhatsApp directe"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Phone className="w-3.5 h-3.5" />
            <span>Conciergerie</span>
          </a>

          <Link
            href="#contact"
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg shadow-teal-500/25 transition-all hover:shadow-teal-500/40 hover:-translate-y-0.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Réserver un séjour</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors focus:outline-none"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden mt-3 mx-4 rounded-2xl bg-[#0B1721]/95 backdrop-blur-xl border border-white/10 p-6 shadow-2xl flex flex-col gap-4 text-white animate-fadeIn">
          <Link
            href="#sejours"
            onClick={() => setOpen(false)}
            className="py-2 text-white/90 hover:text-teal-400 font-medium border-b border-white/10 flex items-center justify-between"
          >
            <span>Les Duplexes privés</span>
            <span className="text-xs text-teal-400">Piscine privée</span>
          </Link>
          <Link
            href="#evenements"
            onClick={() => setOpen(false)}
            className="py-2 text-white/90 hover:text-teal-400 font-medium border-b border-white/10"
          >
            Pergola & Événements
          </Link>
          <Link
            href="/services"
            onClick={() => setOpen(false)}
            className="py-2 text-white/90 hover:text-teal-400 font-medium border-b border-white/10"
          >
            Services & Expériences
          </Link>
          <Link
            href="/gallery"
            onClick={() => setOpen(false)}
            className="py-2 text-white/90 hover:text-teal-400 font-medium border-b border-white/10"
          >
            Galerie Photos
          </Link>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="py-2 text-white/90 hover:text-teal-400 font-medium border-b border-white/10"
          >
            À Propos du Resort
          </Link>
          <Link
            href="/faq"
            onClick={() => setOpen(false)}
            className="py-2 text-white/90 hover:text-teal-400 font-medium"
          >
            Questions fréquentes
          </Link>

          <div className="pt-3 flex flex-col gap-3">
            <Link
              href="#contact"
              onClick={() => setOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 font-semibold text-white shadow-lg"
            >
              Réserver maintenant
            </Link>
            <a
              href="https://wa.me/2250500446464?text=Bonjour%2C%20je%20souhaite%20des%20informations"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-3 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-medium flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              Contacter via WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
