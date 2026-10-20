import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Services | Les Résidences H₂O',
  description: 'Piscine privée, pontoon, restaurant, pergola événementielle et conciergerie : les services des Résidences H₂O à Modeste Beach.'
}

// Uniquement les services présentés sur la landing.
const services = [
  { icon: '🏊', title: 'Piscine privée', description: 'Chaque duplex a sa propre piscine privée, sans vis-à-vis.' },
  { icon: '⚓', title: 'Pontoon', description: 'Un pontoon face à la lagune, pour les couchers de soleil.' },
  { icon: '🛁', title: 'Jacuzzi chauffé', description: 'Disponible dans le Duplex Signature.' },
  { icon: '🍽️', title: 'Restaurant', description: 'Un restaurant sur place. Horaires à demander via WhatsApp.' },
  { icon: '🎪', title: 'Pergola evenementielle', description: "Jusqu'a 200 invites, avec service traiteur cle en main." },
  { icon: '🥂', title: 'Privatisation', description: 'Privatisation totale possible sur réservation.' },
  { icon: '🚗', title: 'Parking gratuit', description: 'Un parking gratuit pour tous nos hôtes.' },
  { icon: '🛡️', title: 'Sécurité 24h/24', description: 'Résidence sécurisée avec gardiennage permanent.' },
  { icon: '📶', title: 'Wi-Fi haut débit', description: 'Disponible dans les duplexes.' },
  { icon: '🛎️', title: 'Conciergerie', description: "Une conciergerie dediee et des horaires d'arrivee flexibles." },
]

export default function ServicesPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section
          className="text-white pt-32 pb-16 sm:pt-40 sm:pb-24"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dk) 100%)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Nos Services</h1>
            <p className="text-xl text-white/90">Piscine privée, pontoon et conciergerie au bord de la lagune</p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-teal-200"
                >
                  <div className="text-4xl mb-3">{service.icon}</div>
                  <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
                    {service.title}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                    {service.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="rounded-lg p-8 sm:p-12 text-center" style={{ backgroundColor: 'var(--primary-lt)' }}>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                Prêt à vivre l'expérience ?
              </h2>
              <p className="text-lg mb-8" style={{ color: 'var(--text-2)' }}>
                Choisissez votre duplex et réservez votre séjour à Modeste Beach
              </p>
              <Link
                href="/#contact"
                className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-all"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Réserver un duplex
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
