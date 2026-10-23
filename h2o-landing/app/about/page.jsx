import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ShieldCheck, Award, KeyRound } from 'lucide-react'

export const metadata = {
  title: 'À Propos | Les Résidences H₂O',
  description: "Les Résidences H2O : villas duplex avec piscine privée à Villa Poton, ancienne route de Bassam, au lac — 10 min de la plage, 30 min de l'aéroport et d'Abidjan."
}

// Mêmes engagements que le bloc « HostBadge » de la landing.
const values = [
  { icon: ShieldCheck, title: 'Établissement sécurisé', desc: 'Résidence surveillée par caméras, avec agent de sécurité et groupe électrogène.' },
  { icon: Award, title: 'Standing 5 étoiles', desc: 'Une piscine privée pour chaque villa, sans vis-à-vis.' },
  { icon: KeyRound, title: 'Accueil personnalise', desc: "Une conciergerie dediee et des horaires d'arrivee flexibles." },
]

export default function AboutPage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Notre Résidence</h1>
            <p className="text-xl text-white/90">Deux villas duplex au bord du lac, à Villa Poton</p>
          </div>
        </section>

        {/* Présentation */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-16 sm:mb-20">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: 'var(--text)' }}>
                  Les Résidences H₂O
                </h2>
                <p className="text-lg leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>
                  Les Résidences H₂O proposent deux villas duplex entières, chacune avec sa piscine privée, son pontoon, son jardin, sa terrasse et son toit-terrasse.
                </p>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {"Nous sommes situés à Villa Poton, ancienne route de Bassam, au bord du lac — à 10 minutes de la plage, 30 minutes de l'aéroport et d'Abidjan."}
                </p>
              </div>
            </div>

            {/* Engagements */}
            <div className="mb-16 sm:mb-20">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ color: 'var(--text)' }}>
                Nos engagements
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                {values.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="bg-white p-8 rounded-lg shadow-md border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all text-center"
                  >
                    <Icon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--primary)' }} />
                    <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>
                      {title}
                    </h3>
                    <p style={{ color: 'var(--text-2)' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-lg p-8 sm:p-12 text-center" style={{ backgroundColor: 'var(--primary-lt)' }}>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                Une question ?
              </h2>
              <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-2)' }}>
                Notre conciergerie vous répond sous 24 h, par le formulaire de réservation ou sur WhatsApp.
              </p>
              <Link
                href="/#contact"
                className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-all"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
