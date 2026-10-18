import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = {
  title: 'Services | Residence H2O - Équipements Complèts',
  description: 'Découvrez nos services et équipements de classe mondiale pour votre séjour.'
}

const services = [
  { icon: '🏊', title: 'Piscine Privée', description: 'Piscine chauffée avec vue lagune et pontoon' },
  { icon: '💪', title: 'Gym & Fitness', description: 'Équipement moderne avec personal trainer' },
  { icon: '🍽️', title: 'Restaurant', description: 'Gastronomie avec vue panoramique' },
  { icon: '💆', title: 'Spa & Wellness', description: 'Massages, soins et bien-être holistique' },
  { icon: '🚗', title: 'Transport', description: 'Service de navette vers Abidjan' },
  { icon: '💼', title: 'Business Center', description: 'Salles de réunion équipées' },
  { icon: '🎪', title: 'Pergola Events', description: 'Espaces pour événements privés' },
  { icon: '🎪', title: 'Kids Club', description: 'Activités pour enfants' },
]

export default function ServicesPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section
          className="text-white py-16 sm:py-24"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dk) 100%)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Nos Services</h1>
            <p className="text-xl text-white/90">Équipements de classe mondiale pour votre confort</p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {services.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-teal-200"
                >
                  <div className="text-4xl mb-3">{service.icon}</div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
                    {service.title}
                  </h3>
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
                Réservez votre séjour et profitez de tous nos services premium
              </p>
              <Link
                href="#contact"
                className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-all"
                style={{ backgroundColor: 'var(--primary)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--primary-dk)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
              >
                Réserver Maintenant
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
