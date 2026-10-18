import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Heart, Lightbulb, Leaf } from 'lucide-react'

export const metadata = {
  title: 'À Propos | Residence H2O - Notre Histoire',
  description: 'Découvrez l\'histoire de Residence H2O, nos valeurs et notre engagement envers l\'excellence.'
}

export default function AboutPage() {
  const values = [
    { icon: Heart, title: 'Excellence', desc: 'L\'excellence dans chaque détail' },
    { icon: Lightbulb, title: 'Innovation', desc: 'Toujours chercher à améliorer' },
    { icon: Leaf, title: 'Durabilité', desc: 'Respecter l\'environnement' },
  ]

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
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Notre Histoire</h1>
            <p className="text-xl text-white/90">Excellence, Innovation et Hospitalité Depuis le Début</p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-16 sm:mb-20">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: 'var(--text)' }}>
                  Notre Mission
                </h2>
                <p className="text-lg leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>
                  Residence H2O offre une expérience d'hébergement de luxe qui dépasse les attentes. Notre mission est de créer un refuge idéal où chaque client se sent précieux et choyé.
                </p>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  Nous croyons que l'hospitalité va au-delà du service - c'est une question de créer des souvenirs durables.
                </p>
              </div>
              <div
                className="rounded-lg h-96 hidden lg:block"
                style={{
                  backgroundImage: 'linear-gradient(135deg, var(--primary-lt) 0%, rgba(232, 81, 58, 0.1) 100%)',
                }}
              />
            </div>

            {/* Values */}
            <div className="mb-16 sm:mb-20">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ color: 'var(--text)' }}>
                Nos Valeurs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                {values.map((value, idx) => {
                  const Icon = value.icon
                  return (
                    <div
                      key={idx}
                      className="bg-white p-8 rounded-lg shadow-md border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all text-center"
                    >
                      <Icon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--primary)' }} />
                      <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>
                        {value.title}
                      </h3>
                      <p style={{ color: 'var(--text-2)' }}>{value.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Team CTA */}
            <div className="rounded-lg p-8 sm:p-12 text-center" style={{ backgroundColor: 'var(--primary-lt)' }}>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                Notre Équipe
              </h2>
              <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-2)' }}>
                Notre équipe dévouée de professionnels est disponible 24/7 pour assurer votre confort et satisfaction.
              </p>
              <a
                href="#contact"
                className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-all"
                style={{ backgroundColor: 'var(--primary)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--primary-dk)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
              >
                Nous Contacter
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
