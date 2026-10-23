import { formatFCFA } from '@/lib/residences'
import { getDuplexes } from '@/lib/data'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { MapPin, Users } from 'lucide-react'

export const metadata = {
  title: 'Nos Villas | Les Résidences H₂O',
  description: 'Deux villas duplex entières avec piscine privée, jardin et toit-terrasse, à Villa Poton, ancienne route de Bassam, au lac.',
}

export const revalidate = 300

export default async function ResidencesPage() {
  const residences = await getDuplexes()

  return (
    <>
    <Nav />
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="gradient-sig text-white pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Nos Villas</h1>
          <p className="text-xl text-white/80">Deux villas duplex complètes, chacune avec sa piscine privée</p>
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
                  <Image
                    src={residence.images[0]}
                    alt={residence.nom}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{residence.nom}</h2>
                  <p className="text-gray-600 text-sm mb-4">{residence.tagline}</p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-1">
                      <Users size={16} className="text-teal-600" />
                      {residence.capacite}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-teal-600" />
                      Villa Poton
                    </div>
                  </div>

                  {/* Équipements clés */}
                  <ul className="space-y-2 mb-6">
                    {residence.features.slice(0, 3).map(feature => (
                      <li key={feature} className="text-sm text-gray-700">✓ {feature}</li>
                    ))}
                  </ul>

                  {/* Prix */}
                  <div className="border-t pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">À partir de</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--h2o-lagune)' }}>{formatFCFA(residence.prix)}</p>
                      <p className="text-xs text-gray-500">par nuit</p>
                    </div>
                    <span className="text-white font-bold px-4 py-2 rounded-lg transition group-hover:opacity-90"
                      style={{ backgroundColor: 'var(--primary)' }}>
                      Voir la villa
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Comparaison des villas</h2>

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
                  <td className="py-4 px-4 font-semibold text-gray-700">Nuit complète 24/24</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4 font-bold" style={{ color: 'var(--h2o-lagune)' }}>
                      {formatFCFA(r.prix)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-4 font-semibold text-gray-700">Matinée</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4 text-gray-600">
                      {r.prixJournee ? formatFCFA(r.prixJournee) : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-4 font-semibold text-gray-700">Capacité</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4 text-gray-600">
                      {r.capacite}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-4 font-semibold text-gray-700">Chambres</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4 text-gray-600">
                      {r.chambres}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-4 font-semibold text-gray-700">Piscine privée</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4">
                      {r.features.some(f => /piscine/i.test(f)) ? '✓' : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-4 font-semibold text-gray-700">Toit-terrasse</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4">
                      {r.features.some(f => f.includes('Toit-terrasse')) ? '✓' : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-4 font-semibold text-gray-700">Surface</td>
                  {residences.map(r => (
                    <td key={r.slug} className="text-center py-4 px-4 text-gray-600">
                      {r.surface || '—'}
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
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
    <Footer />
    </>
  )
}
