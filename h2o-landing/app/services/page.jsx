import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Services | Les Résidences H₂O',
  description: 'Wi-Fi 5G, TV, piscine privée, sécurité, ménage et équipements des villas des Résidences H₂O à Villa Poton, au bord du lac.'
}

// Services et équipements de la fiche officielle (connectivité, sécurité, politique maison, ménage).
const services = [
  { icon: '📶', title: 'Wi-Fi 5G', description: 'Wi-Fi 5G dans les villas.' },
  { icon: '📺', title: 'TV salon + chambre', description: 'Télévision dans le salon et dans chaque chambre.' },
  { icon: '🔊', title: 'Enceinte Bluetooth', description: 'Enceinte Bluetooth dans la villa.' },
  { icon: '🎛️', title: 'Télécommande', description: 'Télécommande pour le salon et pour la chambre.' },
  { icon: '📹', title: 'Caméras de surveillance', description: 'Résidence surveillée par caméras.' },
  { icon: '🛡️', title: 'Agent de sécurité', description: 'Un agent de sécurité sur place.' },
  { icon: '⚡', title: 'Groupe électrogène', description: 'Groupe électrogène sur place.' },
  { icon: '🍽️', title: 'Table à manger', description: 'Table à manger pour 8 personnes dans le salon.' },
  { icon: '🏊', title: 'Piscine privée', description: "Jusqu'à 10 personnes dans la piscine privée de la villa." },
  { icon: '🧹', title: 'Ménage', description: 'Ménage 2 fois par semaine pour les longs séjours.' },
  { icon: '🏡', title: 'Ménage quotidien', description: 'Chaque jour : salon, cuisine, piscine et terrasse, inclus.' },
  { icon: '👕', title: 'Buanderie & repassage', description: 'Buanderie externe et service repassage, disponibles.' },
  { icon: '🐕', title: 'Chiens acceptés', description: 'Les chiens sont acceptés dans les villas.' },
  { icon: '🏷️', title: 'Nom de la villa', description: 'Le nom de la villa peut être choisi par le client.' },
  { icon: '⚠️', title: 'Piscine sans maître nageur', description: "La piscine privée n'est pas surveillée par un maître nageur." },
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
            <p className="text-xl text-white/90">Piscine privée, ménage, sécurité et connectivité dans chaque villa</p>
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
                Choisissez votre villa et réservez votre séjour à Villa Poton
              </p>
              <Link
                href="/#contact"
                className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-all"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Réserver une villa
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
