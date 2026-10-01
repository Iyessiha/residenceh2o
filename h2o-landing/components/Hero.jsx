import Link from 'next/link'

const AMENITIES = [
  { icon: '🏊', label: 'Piscine privée' },
  { icon: '⚓', label: 'Pontoon' },
  { icon: '🍽', label: 'Restaurant' },
  { icon: '🎪', label: 'Pergola events' },
  { icon: '🚗', label: 'Parking' },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-teal-950 flex flex-col justify-center overflow-hidden">
      {/* Background texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 opacity-90" />

      {/* Decorative circles */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
        {/* Location badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-8">
          <span>✦</span>
          <span>Modeste Beach · Route de Grand-Bassam</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          L'intimité d'un duplex,<br />
          <span className="text-teal-400">le luxe d'un resort</span>
        </h1>

        <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
          Duplexes meublés avec piscine privée, pontoon et vue lac.
          À 30 min d'Abidjan.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="#contact" className="btn-primary text-center text-lg">
            Réserver un duplex
          </Link>
          <Link href="#galerie" className="btn-outline text-center text-lg">
            Voir la galerie
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

        {/* SEO keywords (visually subtle) */}
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {['hôtel Modeste Beach', 'resort Grand-Bassam', 'duplex piscine Côte d\'Ivoire', 'résidence meublée Bassam'].map(kw => (
            <span key={kw} className="text-xs text-white/30 bg-white/5 px-3 py-1 rounded-full">
              {kw}
            </span>
          ))}
        </div>
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
