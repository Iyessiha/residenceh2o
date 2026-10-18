import { getResidenceBySlug, getAllResidences } from '@/lib/residences'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Heart, Share2, MapPin, Users, DoorOpen } from 'lucide-react'

export async function generateStaticParams() {
  const residences = getAllResidences()
  return residences.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }) {
  const residence = getResidenceBySlug(params.slug)
  if (!residence) return { title: 'Résidence non trouvée' }

  return {
    title: `${residence.nom} - Residence H2O`,
    description: residence.description,
  }
}

export default function ResidencePage({ params }) {
  const residence = getResidenceBySlug(params.slug)

  if (!residence) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Résidence non trouvée</h1>
          <Link href="/residences" className="text-teal-600 hover:text-teal-700">
            Retour aux résidences
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero gallery */}
      <div className="relative w-full h-96 sm:h-[500px] bg-gray-200 overflow-hidden">
        {residence.images.length > 0 && (
          <Image
            src={residence.images[0]}
            alt={residence.nom}
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Gallery nav buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
          <button className="bg-white/80 hover:bg-white p-3 rounded-full shadow-lg">
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <button className="bg-white/80 hover:bg-white p-3 rounded-full shadow-lg">
            <ChevronRight size={24} className="text-gray-900" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 z-20 flex gap-3">
          <button className="bg-white/90 hover:bg-white p-3 rounded-full shadow-lg">
            <Heart size={20} className="text-red-600" />
          </button>
          <button className="bg-white/90 hover:bg-white p-3 rounded-full shadow-lg">
            <Share2 size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{residence.nom}</h1>
            <p className="text-xl text-gray-600 mb-4">{residence.description}</p>
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
                <DoorOpen size={18} />
                Disponible à l'année
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-teal-600 mb-2">€{residence.prix}</div>
            <p className="text-gray-600 text-sm mb-4">par nuit</p>
            <Link
              href="#reserver"
              className="inline-block px-8 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition"
            >
              Réserver maintenant
            </Link>
          </div>
        </div>

        {/* Image gallery grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {residence.images.map((img, i) => (
            <div key={i} className="relative h-32 sm:h-40 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition">
              <Image
                src={img}
                alt={`${residence.nom} photo ${i + 1}`}
                fill
                className="object-cover hover:scale-110 transition-transform"
              />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Features */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Équipements</h2>
            <ul className="space-y-3">
              {residence.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <span className="text-teal-600 font-bold mt-1">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Services & Loisirs</h2>
            <div className="grid grid-cols-2 gap-4">
              {residence.amenities.map((amenity, i) => (
                <div key={i} className="bg-teal-50 p-4 rounded-lg text-center">
                  <p className="text-lg mb-1">{amenity.split(' ')[0]}</p>
                  <p className="text-sm text-gray-600">{amenity.split(' ').slice(1).join(' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking CTA */}
        <div id="reserver" className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Prêt à réserver ?</h2>
          <p className="text-gray-600 mb-6">Réservez votre séjour inoubliable au {residence.nom}</p>
          <Link
            href="/#contact"
            className="inline-block px-10 py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition text-lg"
          >
            Consulter les disponibilités
          </Link>
        </div>

        {/* Other residences */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nos autres résidences</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {getAllResidences()
              .filter(r => r.slug !== residence.slug)
              .map(r => (
                <Link key={r.slug} href={`/residences/${r.slug}`} className="group">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition">
                    <div className="relative h-48 bg-gray-200">
                      {r.images[0] && (
                        <Image
                          src={r.images[0]}
                          alt={r.nom}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2">{r.nom}</h3>
                      <p className="text-sm text-gray-600 mb-3">{r.description}</p>
                      <p className="text-teal-600 font-bold">À partir de €{r.prix}/nuit</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </main>
  )
}
