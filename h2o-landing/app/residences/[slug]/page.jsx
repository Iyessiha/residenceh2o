import { getResidenceBySlug, getAllResidences, formatFCFA } from '@/lib/residences'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Users, MapPin } from 'lucide-react'

export async function generateStaticParams() {
  const residences = getAllResidences()
  return residences.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }) {
  const residence = getResidenceBySlug(params.slug)
  if (!residence) return { title: 'Duplex non trouvé' }

  return {
    title: `${residence.nom} | Les Résidences H₂O`,
    description: residence.tagline,
  }
}

export default function ResidencePage({ params }) {
  const residence = getResidenceBySlug(params.slug)

  if (!residence) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Duplex non trouvé</h1>
          <Link href="/residences" className="text-teal-600 hover:text-teal-700">
            Retour aux duplexes
          </Link>
        </div>
      </main>
    )
  }

  return (
    <>
    <Nav />
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative w-full h-96 sm:h-[500px] bg-gray-200 overflow-hidden">
        <Image
          src={residence.images[0]}
          alt={residence.nom}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className={`absolute top-28 left-4 sm:left-8 z-10 text-xs px-3 py-1.5 rounded-full shadow-md font-semibold ${residence.badgeClass}`}>
          {residence.badge}
        </span>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{residence.nom}</h1>
            <p className="text-xl text-gray-600 mb-4">{residence.tagline}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users size={18} />
                {residence.capacite}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                Modeste Beach, Grand-Bassam
              </div>
              <div className="flex items-center gap-2">
                Surface : {residence.surface}
              </div>
            </div>
          </div>
          <div className="md:text-right">
            <div className="text-3xl font-bold text-teal-600 mb-1">{formatFCFA(residence.prix)}</div>
            <p className="text-gray-600 text-sm mb-4">par nuit · minimum 2 nuits</p>
            <Link
              href="/#contact"
              className="inline-block px-8 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition"
            >
              Réserver ce duplex
            </Link>
          </div>
        </div>

        {/* Image gallery grid */}
        {residence.images.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {residence.images.map((img, i) => (
              <div key={img} className="relative h-32 sm:h-40 rounded-lg overflow-hidden">
                <Image
                  src={img}
                  alt={`${residence.nom} photo ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Équipements */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Équipements</h2>
          <ul className="grid md:grid-cols-2 gap-3">
            {residence.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-gray-700">
                <span className="text-teal-600 font-bold">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Booking CTA */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Prêt à réserver ?</h2>
          <p className="text-gray-600 mb-6">Envoyez votre demande pour le {residence.nom}. Nous vous répondons sous 24 h.</p>
          <Link
            href="/#contact"
            className="inline-block px-10 py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition text-lg"
          >
            Demander une réservation
          </Link>
        </div>

        {/* Other residences */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nos autres duplexes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {getAllResidences()
              .filter(r => r.slug !== residence.slug)
              .map(r => (
                <Link key={r.slug} href={`/residences/${r.slug}`} className="group">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition">
                    <div className="relative h-48 bg-gray-200">
                      <Image
                        src={r.images[0]}
                        alt={r.nom}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2">{r.nom}</h3>
                      <p className="text-sm text-gray-600 mb-3">{r.tagline}</p>
                      <p className="text-teal-600 font-bold">À partir de {formatFCFA(r.prix)} / nuit</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </main>
    <Footer />
    </>
  )
}
