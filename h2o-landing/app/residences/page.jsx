import { getAllResidences } from '@/lib/residences'
import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, Users } from 'lucide-react'

export const metadata = {
  title: 'Nos Résidences - Residence H2O',
  description: '3 types de duplexes luxe avec piscine privée, pontoon et vue lagune à Grand-Bassam',
}

export default function ResidencesPage() {
  const residences = getAllResidences()

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-800 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Nos Résidences</h1>
          <p className="text-xl text-teal-100">3 catégories de duplexes meublés avec vue lagune</p>
        </div>
      </section>

      {/* Residences Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {residences.map(residence => (
            <Link key={residence.slug} href={`/residences/${residence.slug}`}>
              <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                {/* Image */}
                <div className="relative h-64 bg-gray-200 overflow-hidden">
                  {residence.images[0] && (
                    <Image
                      src={residence.images[0]}
                      alt={residence.nom}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{residence.nom}</h2>
                  <p className="text-gray-600 text-sm mb-4 h-12 overflow-hidden">{residence.description}</p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-1">
                      <Users size={16} className="text-teal-600" />
                      {residence.capacite}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-teal-600" />
                      Grand-Bassam
                    </div>
                  </div>

                  {/* Features preview */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {residence.features.slice(0, 3).map((feature, i) => (
                      <span key={i} className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full">
                        {feature.split(' ')[0]}
                      </span>
                    ))}
                    {residence.features.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                        +{residence.features.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Rating & Price */}
                  <div className="border-t pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-teal-600">€{residence.prix}</p>
                      <p className="text-xs text-gray-500">par nuit</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="w-full mt-4 bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition">
                    Voir les détails
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Comparaison des résidences</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Caractéristiques</th>
                  {residences.map(r => (
                    <th key={r.slug} className="text-center py-4 px-4 font-bold text-gray-900">
                      {r.nom}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-4 font-semibold text-gray-700">Prix par nuit</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4 text-teal-600 font-bold">
                      €{r.prix}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-4 font-semibold text-gray-700">Capacité</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4 text-gray-600">
                      {r.capacite}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-4 font-semibold text-gray-700">Piscine</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4">
                      ✓
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-4 font-semibold text-gray-700">Pontoon</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4">
                      {r.features.some(f => f.includes('Pontoon')) ? '✓' : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-4 font-semibold text-gray-700">Équipements</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4 text-sm text-gray-600">
                      {r.features.length} équipements
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}
