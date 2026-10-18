import Image from 'next/image'
import Link from 'next/link'
import { Users, Maximize2, Waves, Sparkles, Check, ArrowRight } from 'lucide-react'

const DUPLEXES = [
  {
    id: 'D-1',
    name: 'Duplex Lac',
    tagline: 'Vue panoramique sur la lagune & pontoon privé',
    image: '/images/gallery/IMG_2869.jpg',
    features: ['Piscine privée 20m²', 'Pontoon privé', 'Chambre king size', 'Cuisine équipée', 'Terrasse vue lagune'],
    capacity: '2–4 personnes',
    surface: '80 m²',
    price: '120 000 FCFA',
    period: '/ nuit',
    badge: 'Vue Lagune',
    badgeClass: 'bg-teal-500/90 text-white',
  },
  {
    id: 'D-2',
    name: 'Duplex Jardin',
    tagline: 'Intimité, verdure et sérénité tropicale',
    image: '/images/gallery/IMG_2873.jpg',
    features: ['Piscine privée 15m²', 'Jardin privatif paysager', '2 chambres avec dressing', 'Cuisine & bar équipés', 'Salon lounge'],
    capacity: '4–6 personnes',
    surface: '100 m²',
    price: '150 000 FCFA',
    period: '/ nuit',
    badge: 'Idéal Famille',
    badgeClass: 'bg-emerald-600/90 text-white',
  },
  {
    id: 'D-3',
    name: 'Duplex Signature',
    tagline: 'Le summum du luxe privé avec jacuzzi et rooftop',
    image: '/images/gallery/IMG_2875.jpg',
    features: ['Grande piscine privée 30m²', 'Pontoon & jacuzzi chauffé', '3 suites parentales', 'Espace BBQ & rooftop', 'Vue lagune 360°'],
    capacity: '6–8 personnes',
    surface: '140 m²',
    price: '220 000 FCFA',
    period: '/ nuit',
    badge: 'Prestige VIP',
    badgeClass: 'bg-amber-500/95 text-slate-900 font-bold',
  },
]

export default function Duplexes() {
  return (
    <section id="sejours" className="py-24 bg-[#FAF8F5] text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200/60 inline-block mb-3">
            Hébergements d'exception
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Chaque duplex a sa propre piscine privée
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Aucun voisin de bassin, aucun compromis. Une intimité totale conçue pour les couples, familles et séjours de prestige.
          </p>
        </div>

        {/* Duplex Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {DUPLEXES.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-1.5"
            >
              {/* Photo HD */}
              <div className="relative h-64 w-full overflow-hidden bg-slate-100">
                <Image
                  src={d.image}
                  alt={d.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                <span className={`absolute top-4 left-4 backdrop-blur-md text-xs px-3 py-1.5 rounded-full shadow-md font-semibold ${d.badgeClass}`}>
                  {d.badge}
                </span>

                <span className="absolute bottom-3 left-4 bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs px-2.5 py-0.5 rounded-full font-mono">
                  {d.id}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors mb-1.5">
                    {d.name}
                  </h3>
                  <p className="text-slate-500 text-sm mb-5 leading-relaxed">{d.tagline}</p>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mb-5 pb-5 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      {d.capacity}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                      <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
                      {d.surface}
                    </span>
                  </div>

                  {/* Highlights */}
                  <ul className="space-y-2.5 mb-6">
                    {d.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-xs text-slate-700">
                        <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold">À partir de</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg sm:text-xl font-bold text-slate-900">{d.price}</span>
                      <span className="text-xs text-slate-500">{d.period}</span>
                    </div>
                  </div>

                  <Link
                    href="#contact"
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-teal-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow hover:shadow-md"
                  >
                    <span>Réserver</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
