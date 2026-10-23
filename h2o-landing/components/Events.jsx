import Image from 'next/image'
import Link from 'next/link'
import { Heart, Sparkles, GlassWater, Users, Check, ArrowRight } from 'lucide-react'

const EVENT_PILLARS = [
  'Mariages & Fiançailles de prestige',
  'Anniversaires & Célébrations privées',
  "Seminaires d'entreprise & Teambuildings",
  'Dîners gastronomiques au bord du lac',
  'Privatisation intégrale du domaine',
]

export default function Events() {
  return (
    <section id="evenements" className="py-24 bg-[#0C3A3D] text-white relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left: Presentation */}
          <div className="lg:col-span-6">
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#7FB8B5] bg-[#0C3A3D]/80 border border-[#7FB8B5]/30 px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#7FB8B5]" />
              Événements & Réceptions
            </span>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
              Un espace événementiel : <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8E6E5] to-[#F5D9A8]">
                un décor féerique sur l'eau
              </span>
            </h2>

            <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed">
              Donnez une dimension inoubliable à vos célébrations. Notre espace événementiel accueille jusqu'à
              <strong className="text-white font-semibold"> 200 invités</strong> au bord du lac, à Villa Poton, avec pontoon direct et service traiteur clé en main.
            </p>

            <div className="space-y-3 mb-10">
              {EVENT_PILLARS.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/10 text-[#7FB8B5] flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm sm:text-base text-white/90">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1C6E70 0%, #0C3A3D 100%)' }}
              >
                <span>Demander un devis sur mesure</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://wa.me/2250705259234?text=Bonjour%2C%20je%20souhaite%20un%20devis%20pour%20un%20%C3%A9v%C3%A9nement%20aux%20R%C3%A9sidences%20H2O"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium px-5 py-3.5 rounded-xl border border-white/15 transition-all"
              >
                <span>WhatsApp Événements</span>
              </a>
            </div>
          </div>

          {/* Right: Bento Gallery */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="relative h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
              <Image
                src="/images/gallery/IMG_2870.jpg"
                alt="Espace événementiel H2O au bord du lac"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs font-semibold text-white/90">Espace événementiel jusqu'à 200 personnes</span>
              </div>
            </div>

            <div className="relative h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group mt-6">
              <Image
                src="/images/gallery/IMG_2877.jpg"
                alt="Piscine privée et terrasse"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs font-semibold text-white/90">Pontoon privé & coucher de soleil</span>
              </div>
            </div>

            <div className="col-span-2 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Privatisation totale possible</p>
                <p className="text-xs text-white/60">Hébergement des invités dans nos villas et chambres</p>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-[#D98A3A]/20 border border-[#D98A3A]/30 text-[#F5D9A8] text-xs font-semibold">
                Sur réservation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
