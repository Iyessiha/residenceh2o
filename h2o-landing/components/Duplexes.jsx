import Link from 'next/link'

const DUPLEXES = [
  {
    id: 'D-1',
    name: 'Duplex Lac',
    tagline: 'Vue panoramique sur le lac',
    features: ['Piscine privée 20m²', 'Pontoon privé', 'Chambre king size', 'Cuisine équipée', 'Terrasse vue lac'],
    capacity: '2–4 personnes',
    surface: '80 m²',
    price: 'À partir de 120 000 FCFA / nuit',
    badge: 'Vue Lac',
    badgeColor: 'bg-teal-600',
  },
  {
    id: 'D-2',
    name: 'Duplex Jardin',
    tagline: 'Intimité et verdure',
    features: ['Piscine privée 15m²', 'Jardin privatif', '2 chambres', 'Cuisine équipée', 'Salon séjour'],
    capacity: '4–6 personnes',
    surface: '100 m²',
    price: 'À partir de 150 000 FCFA / nuit',
    badge: 'Familial',
    badgeColor: 'bg-green-700',
  },
  {
    id: 'D-3',
    name: 'Duplex Premium',
    tagline: 'Le summum du luxe privé',
    features: ['Grande piscine privée 30m²', 'Pontoon & jacuzzi', '3 chambres', 'Cuisine & BBQ', 'Vue 360°'],
    capacity: '6–8 personnes',
    surface: '140 m²',
    price: 'À partir de 220 000 FCFA / nuit',
    badge: 'Premium',
    badgeColor: 'bg-orange-500',
  },
]

export default function Duplexes() {
  return (
    <section id="sejours" className="py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="section-label">Nos duplexes</span>
          <h2 className="font-serif text-4xl font-bold text-teal-900 mt-3 mb-4">
            Un cadre d'exception pour chaque séjour
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Chaque duplex dispose de sa propre piscine privée. Pas de voisins de piscine,
            pas de bruit — juste vous et le lac.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {DUPLEXES.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Photo placeholder */}
              <div className="bg-gradient-to-br from-teal-800 to-teal-600 h-48 flex items-center justify-center relative">
                <span className="text-5xl">🏊</span>
                <span className={`absolute top-3 right-3 ${d.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {d.badge}
                </span>
                <span className="absolute bottom-3 left-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
                  {d.id}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-serif text-xl font-bold text-teal-900 mb-1">{d.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{d.tagline}</p>

                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                  <span>👥 {d.capacity}</span>
                  <span>📐 {d.surface}</span>
                </div>

                <ul className="space-y-1 mb-5">
                  {d.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-teal-600">✓</span> {f}
                    </li>
                  ))}
                </ul>

                <div className="border-t pt-4 flex items-center justify-between">
                  <span className="text-teal-800 font-semibold text-sm">{d.price}</span>
                  <Link href="#contact" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    Réserver
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
