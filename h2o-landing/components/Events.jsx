import Link from 'next/link'

const EVENT_TYPES = [
  { icon: '💍', label: 'Mariages' },
  { icon: '🎂', label: 'Anniversaires' },
  { icon: '🍼', label: 'Baptêmes' },
  { icon: '💼', label: 'Séminaires' },
  { icon: '🎉', label: 'Fêtes privées' },
  { icon: '🥂', label: 'Réceptions' },
]

export default function Events() {
  return (
    <section id="evenements" className="py-20 bg-teal-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-teal-400">Événements</span>
            <h2 className="font-serif text-4xl font-bold mt-3 mb-5">
              La pergola & l'espace événementiel
            </h2>
            <p className="text-white/70 text-lg mb-6">
              Notre pergola en bord de lac est le cadre idéal pour célébrer vos moments importants.
              Jusqu'à 200 invités, vue lac à couper le souffle, équipe dédiée.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Espace modulable jusqu'à 200 personnes",
                'Vue directe sur le lac et le pontoon',
                'Cuisine traiteur disponible',
                'Sono, éclairage, et décoration sur mesure',
                'Hébergement des invités sur place',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-white/80">
                  <span className="text-teal-400 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link href="#contact" className="btn-primary inline-block">
              Demander un devis
            </Link>
          </div>

          {/* Right: event types grid */}
          <div>
            {/* Pergola visual */}
            <div className="bg-teal-800/50 border border-teal-700/50 rounded-2xl h-48 flex items-center justify-center mb-6">
              <div className="text-center">
                <span className="text-5xl">🎪</span>
                <p className="text-white/50 text-sm mt-2">Pergola & Espace Événementiel</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {EVENT_TYPES.map(({ icon, label }) => (
                <div key={label} className="bg-teal-800/40 border border-teal-700/40 rounded-xl p-3 text-center">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-white/70 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
