import Link from 'next/link'

const AMENITIES = [
  { icon: '🏠', label: 'Villa entière' },
  { icon: '🛏️', label: 'Chambre seule' },
  { icon: '🏊', label: 'Piscine privée' },
  { icon: '🍽', label: 'Restaurant' },
  { icon: '🎪', label: 'Espace événementiel' },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#1A0A04] flex flex-col justify-center overflow-hidden">
      {/* Vidéo de fond fluide */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.4 }}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Dégradé signature H2O - réduit pour laisser vidéo visible */}
      <div className="absolute inset-0 gradient-sig opacity-40" />

      {/* Decorative circles */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
        {/* Location badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-8">
          <span>✦</span>
          <span>Villa Poton · Ancienne route de Bassam, au lac</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Villa entière ou chambre seule —<br />
          <span className="text-teal-400">le luxe au bord du lac à votre mesure</span>
        </h1>

        <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-4">
          Louez une villa duplex complète avec piscine privée, ou réservez une chambre à la nuit dès <span className="text-white font-semibold">40 000 FCFA</span>.
          À 10 min de la plage · 30 min de l'aéroport et d'Abidjan.
        </p>

        {/* Option pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm">
            🏠 Villa entière — 350 000 FCFA la nuit
          </span>
          <span className="inline-flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 rounded-full px-4 py-1.5 text-amber-200 text-sm font-medium">
            🛏️ Chambre à la nuit — dès 40 000 FCFA
          </span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="#contact" className="btn-primary text-center text-lg">
            Réserver un duplex
          </Link>
          <Link href="#chambres" className="btn-outline text-center text-lg">
            Voir les chambres
          </Link>
        </div>

        {/* Amenities */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto">
          {AMENITIES.map(({ icon, label }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 flex flex-col items-center gap-1">
              <span className="text-2xl">{icon}</span>
              <span className="text-white/70 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* SEO keywords — invisibles visuellement, indexés par les moteurs */}
        <p className="sr-only">
          villa Poton · villa piscine privée Côte d'Ivoire · duplex piscine privée ·
          chambre à louer à la nuit · chambre VIP · chambre VVIP · location villa Abidjan ·
          location vacances au bord du lac · espace événementiel · restaurant au bord du lac
        </p>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60L1440 60L1440 30C1200 60 720 0 0 30L0 60Z" fill="#f5f0e8" />
        </svg>
      </div>
    </section>
  )
}
