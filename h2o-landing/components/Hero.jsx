'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Waves, Sparkles, MapPin, ShieldCheck, ArrowRight, Calendar, Users, Home, Volume2, VolumeX, Play } from 'lucide-react'

const HIGHLIGHTS = [
  { icon: Waves, label: 'Piscine privée individuelle', desc: 'Sans aucun vis-à-vis' },
  { icon: Sparkles, label: 'Pontoon sur lagune', desc: 'Couchers de soleil' },
  { icon: ShieldCheck, label: 'Cadre sécurisé 24/7', desc: 'Parking privé gratuit' },
  { icon: MapPin, label: 'À 30 min d’Abidjan', desc: 'Grand-Bassam / Modeste' },
]

export default function Hero() {
  const [selectedDuplex, setSelectedDuplex] = useState('D-1')
  const [dates, setDates] = useState({ arrivee: '', depart: '' })
  const [guests, setGuests] = useState('2')
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true

    const tryPlay = () => {
      const promise = video.play()
      if (promise !== undefined) {
        promise
          .then(() => setIsPlaying(true))
          .catch(() => {
            setIsPlaying(false)
          })
      }
    }

    tryPlay()
  }, [])

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const manualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true))
    }
  }

  return (
    <section className="relative min-h-[95vh] lg:min-h-screen flex flex-col justify-between pt-28 pb-14 overflow-hidden">
      {/* Background Vidéo immersive */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#0B1721]">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          poster="/images/gallery/IMG_2868.jpg"
          src="/videos/hero.mp4"
        />

        {/* Voile cinématographique pour garantir la lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1721] via-[#0B1721]/50 to-[#0B1721]/40" />
      </div>

      {/* Bouton de reprise si le navigateur bloque l'autoplay ou contrôle du son */}
      <div className="absolute top-24 sm:top-28 right-4 sm:right-8 z-20 flex items-center gap-2">
        {!isPlaying && (
          <button
            onClick={manualPlay}
            className="p-2.5 px-3.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/30 transition-all animate-bounce"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Lancer la vidéo</span>
          </button>
        )}

        <button
          onClick={toggleSound}
          className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md border border-white/20 transition-all text-xs flex items-center gap-2"
          aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4 text-teal-400 animate-pulse" />}
          <span className="hidden md:inline text-[11px] font-medium pr-1">
            {isMuted ? 'Son' : 'Activé'}
          </span>
        </button>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto z-10 pt-4">
        <div className="max-w-3xl">
          {/* Badge de réassurance & localisation */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs sm:text-sm mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span className="font-semibold text-teal-300">Modeste Beach</span>
            <span className="text-white/40">|</span>
            <span className="text-white/80">Route de Grand-Bassam · Côte d'Ivoire</span>
          </div>

          {/* Titre statutaire luxe */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
            L'intimité d'une villa, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-amber-200">
              le privilège de l’eau.
            </span>
          </h1>

          <p className="text-white/90 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mb-10 text-shadow-sm">
            Découvrez nos duplexes contemporains avec piscine privative sans vis-à-vis, 
            pontoon aménagé et vue imprenable sur la lagune. Un refuge exclusif à seulement 30 minutes du Plateau.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-4 mb-12">
            <a
              href="#reserver-rapide"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold text-base px-7 py-3.5 rounded-xl shadow-xl shadow-teal-900/40 hover:-translate-y-0.5 transition-all"
            >
              <span>Vérifier la disponibilité</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="#sejours"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium text-base px-6 py-3.5 rounded-xl backdrop-blur-md border border-white/20 transition-all"
            >
              Découvrir les 3 duplexes
            </Link>
          </div>
        </div>

        {/* Barre de réservation rapide intégrée au Hero */}
        <div id="reserver-rapide" className="w-full bg-white/95 dark:bg-[#0E1F2C]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/20 max-w-5xl">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const contactSection = document.getElementById('contact')
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center"
          >
            {/* Duplex selector */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-teal-600" />
                Duplex souhaité
              </label>
              <select
                value={selectedDuplex}
                onChange={(e) => setSelectedDuplex(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
              >
                <option value="D-1">Duplex Lac (Vue Lagune & Pontoon)</option>
                <option value="D-2">Duplex Jardin (Familial & Intime)</option>
                <option value="D-3">Duplex Signature (Jacuzzi & Terrasse 360°)</option>
              </select>
            </div>

            {/* Dates */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Arrivée
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={dates.arrivee}
                onChange={(e) => setDates({ ...dates, arrivee: e.target.value })}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                Voyageurs
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
              >
                <option value="2">2 voyageurs (Couple)</option>
                <option value="4">4 voyageurs (Famille / Amis)</option>
                <option value="6">6+ voyageurs (Groupe)</option>
                <option value="event">Événement privatif</option>
              </select>
            </div>

            {/* Bouton validation */}
            <div>
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 hover:shadow-teal-600/50"
              >
                <span>Demander le tarif</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bandeau d'équipements / Avantages signature */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="p-3.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-teal-400/40 transition-all flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs sm:text-sm font-semibold truncate">{label}</p>
                <p className="text-white/60 text-[11px] truncate">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
